import type { Product, Category, Bau } from "@/lib/app-types";

/**
 * Normaliza uma string para comparação ignorando acentos, maiúsculas/minúsculas e pontuação comum.
 */
export function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^\w\s]/g, " ") // Converte pontuação em espaço
    .replace(/\s+/g, " ") // Reduz espaços múltiplos
    .trim();
}

/**
 * Calcula a distância de Levenshtein entre duas strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const normA = normalizeText(a);
  const normB = normalizeText(b);

  if (normA === normB) return 0;
  if (!normA.length) return normB.length;
  if (!normB.length) return normA.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= normB.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= normA.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= normB.length; i++) {
    for (let j = 1; j <= normA.length; j++) {
      if (normB.charAt(i - 1) === normA.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // Substituição
          matrix[i][j - 1] + 1,     // Inserção
          matrix[i - 1][j] + 1      // Deleção
        );
      }
    }
  }

  return matrix[normB.length][normA.length];
}

/**
 * Calcula o índice de similaridade entre duas strings (0.0 a 1.0)
 */
export function calculateSimilarity(a: string, b: string): number {
  const normA = normalizeText(a);
  const normB = normalizeText(b);

  if (!normA || !normB) return 0;
  if (normA === normB) return 1.0;

  // Se uma contém a outra completamente
  if (normA.includes(normB) || normB.includes(normA)) {
    const ratio = Math.min(normA.length, normB.length) / Math.max(normA.length, normB.length);
    return Math.max(0.75, ratio);
  }

  const distance = levenshteinDistance(normA, normB);
  const maxLength = Math.max(normA.length, normB.length);
  if (maxLength === 0) return 1.0;

  const levScore = 1.0 - distance / maxLength;

  // Token matching (Jaccard sobre palavras)
  const tokensA = new Set(normA.split(" ").filter(Boolean));
  const tokensB = new Set(normB.split(" ").filter(Boolean));
  let tokenIntersection = 0;

  tokensA.forEach((token) => {
    if (tokensB.has(token)) tokenIntersection++;
  });

  const tokenScore = tokenIntersection > 0
    ? (2 * tokenIntersection) / (tokensA.size + tokensB.size)
    : 0;

  return Math.max(levScore, tokenScore);
}

/**
 * Separa a string de cda_name em uma lista de aliases únicos e limpos
 */
export function parseCdaAliases(cdaName?: string | null): string[] {
  if (!cdaName) return [];
  const parts = cdaName.split(/[,;\n|]+/);
  const seen = new Set<string>();
  const result: string[] = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed && !seen.has(trimmed.toLowerCase())) {
      seen.add(trimmed.toLowerCase());
      result.push(trimmed);
    }
  }

  return result;
}

/**
 * Formata um array de aliases em uma string padrão separada por vírgula
 */
export function formatCdaAliases(aliases: string[]): string {
  const seen = new Set<string>();
  const clean: string[] = [];

  for (const a of aliases) {
    const trimmed = a.trim();
    if (trimmed && !seen.has(trimmed.toLowerCase())) {
      seen.add(trimmed.toLowerCase());
      clean.push(trimmed);
    }
  }

  return clean.join(", ");
}

export interface FuzzyProductMatch {
  product: Product;
  score: number;
  matchedField: "nome" | "cda_alias" | "descricao" | "categoria" | "bau";
  matchedValue: string;
  reason: string;
}

export interface ProductSearchResult {
  exactMatches: Product[];
  similarMatches: FuzzyProductMatch[];
}

/**
 * Realiza busca inteligente em produtos suportando:
 * 1. Múltiplos aliases de log do Discord (CDA)
 * 2. Comparação case-insensitive e acento-insensível
 * 3. Busca por similaridade / fuzzy matching caso haja erros de digitação ou termos aproximados
 */
export function searchProductsWithFuzzy(
  products: Product[],
  query: string,
  categories: Category[] = [],
  baus: Bau[] = []
): ProductSearchResult {
  const rawQuery = query.trim();
  if (!rawQuery) {
    return {
      exactMatches: products,
      similarMatches: [],
    };
  }

  const normQuery = normalizeText(rawQuery);
  const categoryMap = new Map(categories.map((c) => [c.id, normalizeText(c.nome)]));
  const bauMap = new Map(baus.map((b) => [b.id, normalizeText(b.nome)]));

  const exactMatches: Product[] = [];
  const similarCandidates: FuzzyProductMatch[] = [];

  for (const product of products) {
    const normNome = normalizeText(product.nome);
    const normDesc = normalizeText(product.descricao || "");
    const aliases = parseCdaAliases(product.cda_name);
    const normAliases = aliases.map((a) => ({ raw: a, norm: normalizeText(a) }));
    const normCat = product.categoria_id ? categoryMap.get(product.categoria_id) || "" : "";
    const normBau = product.bau_id ? bauMap.get(product.bau_id) || "" : "";

    // 1. Verificação Exata / Substring
    let isExact = false;

    if (normNome.includes(normQuery)) {
      isExact = true;
    } else if (normAliases.some((a) => a.norm.includes(normQuery))) {
      isExact = true;
    } else if (normDesc.includes(normQuery)) {
      isExact = true;
    } else if (normCat && normCat.includes(normQuery)) {
      isExact = true;
    } else if (normBau && normBau.includes(normQuery)) {
      isExact = true;
    }

    if (isExact) {
      exactMatches.push(product);
      continue;
    }

    // 2. Verificação de Similaridade / Aproximação (Fuzzy)
    let bestScore = 0;
    let bestField: "nome" | "cda_alias" | "descricao" = "nome";
    let bestMatchedValue = "";
    let bestReason = "";

    // Similaridade com o Nome
    const nomeScore = calculateSimilarity(normQuery, normNome);
    if (nomeScore > bestScore) {
      bestScore = nomeScore;
      bestField = "nome";
      bestMatchedValue = product.nome;
      bestReason = `Nome similar: "${product.nome}"`;
    }

    // Similaridade com cada alias do Discord (CDA)
    for (const a of normAliases) {
      const aliasScore = calculateSimilarity(normQuery, a.norm);
      if (aliasScore > bestScore) {
        bestScore = aliasScore;
        bestField = "cda_alias";
        bestMatchedValue = a.raw;
        bestReason = `Alias Discord similar: "${a.raw}"`;
      }
    }

    // Threshold de aceitação de similaridade (>= 0.60 para palavras médias/longas, ou distância <= 2)
    const minThreshold = normQuery.length <= 4 ? 0.68 : 0.58;

    if (bestScore >= minThreshold) {
      similarCandidates.push({
        product,
        score: bestScore,
        matchedField: bestField,
        matchedValue: bestMatchedValue,
        reason: bestReason,
      });
    }
  }

  // Ordenar candidatos similares pelo maior score
  similarCandidates.sort((a, b) => b.score - a.score);

  return {
    exactMatches,
    similarMatches: similarCandidates,
  };
}
