/**
 * Serviço de Upload de Imagens via CDN Postimages.org & Proxy de Imagens
 * Roteado de forma transparente e otimizada pelo bot Discloud (https://twin.discloud.app/api/upload-image),
 * com fallback direto no navegador, garantindo velocidade de CDN global, suporte a CORS e ZERO egress no Supabase.
 */

export interface PostimagesUploadOptions {
  filename?: string;
  maxDimension?: number;
  quality?: number;
}

/**
 * Otimiza e redimensiona imagem via Canvas no navegador preservando transparência e qualidade
 */
async function compressImageForUpload(
  file: File | Blob,
  maxDimension = 1920,
  quality = 0.85
): Promise<{ base64: string; mimeType: string }> {
  const originalType = (file as File).type || "image/png";
  const isTransparentFormat = originalType === "image/png" || originalType.includes("png") || originalType.includes("svg");
  const isAnimatedOrVector = originalType.includes("gif") || originalType.includes("svg");

  // Para imagens já leves (< 2MB) ou vetores/animações, preserva integridade exata sem recompilar
  if (file.size > 0 && file.size <= 2 * 1024 * 1024 && (isTransparentFormat || isAnimatedOrVector)) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        resolve({
          base64: reader.result as string,
          mimeType: originalType,
        });
      };
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => {
        // Fallback: se falhar carregamento do Image, retorna base64 original
        resolve({
          base64: reader.result as string,
          mimeType: originalType,
        });
      };
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Se dimensões já são adequadas e tamanho pequeno, preserva
        if (width <= maxDimension && height <= maxDimension && file.size <= 2 * 1024 * 1024) {
          return resolve({
            base64: reader.result as string,
            mimeType: originalType,
          });
        }

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return resolve({
            base64: reader.result as string,
            mimeType: originalType,
          });
        }

        // Se o formato original for PNG, preserva transparência sem fundo preto
        const targetMime = isTransparentFormat ? "image/png" : (originalType.includes("webp") ? "image/webp" : "image/jpeg");
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL(targetMime, targetMime === "image/png" ? undefined : quality);
        resolve({ base64: dataUrl, mimeType: targetMime });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Fallback direto do navegador para o Postimages.org caso o bot Discloud esteja indisponível
 */
async function uploadDirectToPostimages(file: File | Blob, filename: string): Promise<string> {
  const form = new FormData();
  form.append("gallery", "");
  form.append("optsize", "0");
  form.append("expire", "0");
  form.append("numfiles", "1");
  form.append("upload_session", `${Date.now()}${Math.random().toString().substring(1)}`);
  form.append("file", file, filename);

  const res = await fetch("https://postimages.org/json/rr", {
    method: "POST",
    body: form,
    headers: {
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  if (!res.ok) {
    throw new Error(`Postimages HTTP ${res.status}`);
  }

  const data = await res.json();
  if (!data.url) {
    throw new Error("URL de visualização não retornada pelo Postimages.");
  }

  const pageRes = await fetch(data.url);
  const html = await pageRes.text();
  const inputDirectMatch = html.match(/id=["']direct["'][^>]*value=["']([^"']+)["']/i) || html.match(/value=["'](https:\/\/i\.postimg\.cc\/[^"']+)["']/i);
  const ogMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) || html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
  const directMatch = html.match(/https:\/\/i\.postimg\.cc\/[a-zA-Z0-9_\-./]+\.(?:png|jpg|jpeg|webp|gif)/i);

  const cdnUrl = (inputDirectMatch && inputDirectMatch[1]) || (ogMatch && ogMatch[1]) || (directMatch && directMatch[0]);
  if (!cdnUrl) {
    throw new Error("Não foi possível extrair link direto CDN da imagem.");
  }

  return cdnUrl;
}

/**
 * Envia uma imagem para a API Postimages via Bot CDN (com fallback automático) e retorna o link direto
 */
export async function uploadImageToPostimages(file: File | Blob, options: PostimagesUploadOptions = {}): Promise<string> {
  const originalName = file instanceof File ? file.name : "imagem.png";
  const nameWithoutExt = (options.filename || originalName)
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_");
  const ext = (file as File).type?.includes("png") ? "png" : "jpg";
  const uniqueName = `${nameWithoutExt}_${Date.now()}.${ext}`;

  // 1. Otimiza a imagem localmente antes do envio
  const { base64, mimeType } = await compressImageForUpload(file, options.maxDimension || 1920, options.quality || 0.85);

  // 2. Tenta enviar para o CDN através do endpoint do Bot (com timeout de 15 segundos)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch("https://twin.discloud.app/api/upload-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filename: uniqueName,
        base64,
        contentType: mimeType,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const directCdnUrl = data.cdnUrl || data.url;
      if (data.success && directCdnUrl) {
        return directCdnUrl;
      }
    }
  } catch (botErr) {
    console.warn("Discloud upload-image route failed or timed out, trying direct fallback:", botErr);
  }

  // 3. Fallback: upload direto via navegador
  try {
    return await uploadDirectToPostimages(file, uniqueName);
  } catch (directErr: any) {
    console.warn("Direct upload fallback failed:", directErr);
    // Se a imagem for pequena o suficiente (< 150KB), pode retornar base64 temporariamente
    if (base64 && base64.length < 200 * 1024) {
      return base64;
    }
    throw new Error(directErr?.message || "Falha no upload da imagem. Verifique sua conexão e tente novamente.");
  }
}

/**
 * Garante que imagens de CDN (ex: i.postimg.cc) que sofrem bloqueio/timeout de TLS por provedores de internet
 * sejam sempre servidas com velocidade máxima via Cloudflare Edge do Discloud.
 */
export function getProxiedImageUrl(url: string | null | undefined): string {
  if (!url || typeof url !== "string") return "";
  const clean = url.trim();
  if (!clean) return "";
  if (
    clean.startsWith("data:") ||
    clean.startsWith("blob:") ||
    clean.startsWith("/") ||
    clean.includes("twin.discloud.app/api/image") ||
    clean.includes("supabase.co")
  ) {
    return clean;
  }
  if (clean.includes("i.postimg.cc") || clean.includes("postimg.cc")) {
    return `https://twin.discloud.app/api/image?url=${encodeURIComponent(clean)}`;
  }
  return clean;
}

