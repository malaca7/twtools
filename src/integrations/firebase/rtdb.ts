/**
 * Twin Wheels - Firebase Realtime Database Integration & Schema Types
 * Database URL: https://malacagroup-default-rtdb.firebaseio.com
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, get, set, update, remove, onValue, off, type DatabaseReference } from 'firebase/database';

export const FIREBASE_RTDB_URL =
  (typeof import.meta !== 'undefined' && (import.meta.env?.['VITE_FIREBASE_RTDB_URL'] as string)) ||
  'https://rfdrive-fd805-default-rtdb.firebaseio.com';

export const firebaseConfig = {
  apiKey: (typeof import.meta !== 'undefined' && (import.meta.env?.['VITE_FIREBASE_API_KEY'] as string)) || "AIzaSyD1kR3dRwS_K8ZNximxR10v0Ea1OnQt38I",
  authDomain: (typeof import.meta !== 'undefined' && (import.meta.env?.['VITE_FIREBASE_AUTH_DOMAIN'] as string)) || "malacagroup.firebaseapp.com",
  projectId: (typeof import.meta !== 'undefined' && (import.meta.env?.['VITE_FIREBASE_PROJECT_ID'] as string)) || "malacagroup",
  storageBucket: (typeof import.meta !== 'undefined' && (import.meta.env?.['VITE_FIREBASE_STORAGE_BUCKET'] as string)) || "malacagroup.firebasestorage.app",
  messagingSenderId: (typeof import.meta !== 'undefined' && (import.meta.env?.['VITE_FIREBASE_MESSAGING_SENDER_ID'] as string)) || "769206753468",
  appId: (typeof import.meta !== 'undefined' && (import.meta.env?.['VITE_FIREBASE_APP_ID'] as string)) || "1:769206753468:web:21e154c24d60d8b8cf18b9",
  measurementId: (typeof import.meta !== 'undefined' && (import.meta.env?.['VITE_FIREBASE_MEASUREMENT_ID'] as string)) || "G-LV3XFMJ2HM",
  databaseURL: FIREBASE_RTDB_URL,
};

// Inicializa a instância do Firebase App caso ainda não exista
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getDatabase(app, FIREBASE_RTDB_URL);

/**
 * Definições de Tipos Oficiais das Coleções do Firebase RTDB
 */
export interface FirebaseProfile {
  id?: string;
  user_id: string;
  nome: string;
  nickname?: string | null;
  telefone?: string | null;
  game_id?: string | null;
  avatar_url?: string | null;
  discord_id?: string | null;
  discord_username?: string | null;
  discord_avatar_url?: string | null;
  discord_email?: string | null;
  status?: string;
  is_developer?: boolean;
  is_ceo?: boolean;
  custom_theme?: any;
  custom_url?: string | null;
  banner_url?: string | null;
  bio?: string | null;
  custom_status?: string | null;
  social_links?: any;
  data_entrada?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FirebaseUserRole {
  user_id: string;
  nivel: string;
  created_at?: string;
  updated_at?: string;
}

export interface FirebaseProduct {
  id: string;
  nome: string;
  cda_name?: string | null;
  descricao?: string | null;
  categoria_id?: string | null;
  bau_id?: string | null;
  unidade: string;
  estoque_atual: number;
  estoque_minimo: number;
  preco_sugerido: number;
  imagem_url?: string | null;
  can_be_produced?: boolean;
  can_be_sold?: boolean;
  sale_available_quantity?: number;
  production_yield?: number;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FirebaseBau {
  id: string;
  nome: string;
  descricao?: string | null;
  tipo_gestao?: 'manual' | 'automatico';
  discord_channel_id?: string | null;
  discord_guild_id?: string | null;
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FirebaseProductBau {
  product_id: string;
  bau_id: string;
  estoque_atual: number;
  updated_at?: string;
}

export interface FirebaseCategory {
  id: string;
  nome: string;
  cor?: string | null;
  ordem?: number;
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FirebaseStockMovement {
  id: string;
  user_id?: string | null;
  product_id: string;
  bau_id?: string | null;
  type: 'entrada' | 'saida';
  quantity: number;
  previous_balance?: number;
  resulting_balance?: number;
  reason?: string | null;
  status?: string;
  created_at: string;
}

export interface FirebaseSale {
  id: string;
  user_id?: string | null;
  product_id?: string | null;
  bau_id?: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  buyer_name?: string | null;
  buyer_phone?: string | null;
  notes?: string | null;
  payment_method?: string | null;
  discount_percentage?: number | null;
  created_at: string;
}

export interface FirebaseCashMovement {
  id: string;
  user_id?: string | null;
  type: 'entrada' | 'saida';
  amount: number;
  motive: string;
  notes?: string | null;
  status: string;
  previous_balance?: number;
  resulting_balance?: number;
  reversal_of?: string | null;
  reversal_reason?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface FirebaseRolePermissions {
  level: string;
  nivel?: string;
  permissions: any;
  updated_at?: string;
}

export interface FirebaseCustomRole {
  id: string;
  nome: string;
  descricao?: string | null;
  rank: number;
  is_system?: boolean;
  module_permissions?: Record<string, string>;
  created_at?: string;
  updated_at?: string;
}

export interface FirebaseAnnouncement {
  id: string;
  title: string;
  content: string;
  priority: 'normal' | 'importante' | 'urgente';
  created_by?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface FirebaseAnnouncementRead {
  announcement_id: string;
  user_id: string;
  read_at: string;
}

export interface FirebaseSignupRequest {
  id: string;
  user_id?: string;
  nome: string;
  nickname?: string | null;
  telefone: string;
  game_id: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  requested_at?: string;
  reviewed_at?: string;
  reviewed_by?: string | null;
}

export interface FirebaseDiscordStockConfig {
  id: string;
  channel_id?: string;
  guild_id?: string;
  default_bau_id?: string;
  is_active: boolean;
  allow_negative_stock: boolean;
  item_mappings?: Record<string, string>;
  bau_channels?: Record<string, any>;
  last_message_id?: string;
  last_processed_at?: string;
  last_status?: string;
  created_at?: string;
  updated_at?: string;
}

import { BACKUP_SEED_DATABASE } from '@/data/backupSeedData';

function getSeedFallback(path: string): any {
  const clean = path.replace(/^\/+|\/+$/g, '');
  const parts = clean.split('/');

  // 1. Verifica se há alteração local no localStorage
  if (typeof window !== 'undefined') {
    try {
      const localItem = localStorage.getItem(`tw_rtdb_${clean}`);
      if (localItem !== null) {
        return JSON.parse(localItem);
      }
    } catch {}
  }

  // 2. Busca na base de backup de 3 dias atrás
  if (parts.length === 1) {
    const col = parts[0];
    const data = (BACKUP_SEED_DATABASE as any)[col];
    return data !== undefined ? data : null;
  }
  if (parts.length === 2) {
    const [col, key] = parts;
    const data = (BACKUP_SEED_DATABASE as any)[col]?.[key];
    return data !== undefined ? data : null;
  }
  if (parts.length >= 3) {
    let curr = (BACKUP_SEED_DATABASE as any)[parts[0]];
    for (let i = 1; i < parts.length; i++) {
      if (!curr) return null;
      curr = curr[parts[i]];
    }
    return curr !== undefined ? curr : null;
  }
  return null;
}

function getSeedFallbackList(collectionName: string): any[] {
  const clean = collectionName.replace(/^\/+|\/+$/g, '');
  let baseObj = (BACKUP_SEED_DATABASE as any)[clean];
  const map: Record<string, any> = {};

  if (baseObj && typeof baseObj === 'object') {
    for (const [k, v] of Object.entries(baseObj)) {
      if (v && !(v as any)._schema_info && !(v as any).error) {
        map[k] = v;
      }
    }
  }

  // Mescla com modificações salvas no localStorage
  if (typeof window !== 'undefined') {
    try {
      const prefix = `tw_rtdb_${clean}/`;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          const subKey = key.slice(prefix.length);
          const raw = localStorage.getItem(key);
          if (raw) {
            try {
              const val = JSON.parse(raw);
              if (val === null) {
                delete map[subKey];
              } else {
                map[subKey] = val;
              }
            } catch {}
          }
        }
      }
    } catch {}
  }

  return Object.values(map);
}

let rtdbCheckPromise: Promise<boolean> | null = null;
let isRtdbReachable: boolean | null = null;

export async function checkRtdbReachable(): Promise<boolean> {
  if (isRtdbReachable !== null) return isRtdbReachable;
  if (rtdbCheckPromise) return rtdbCheckPromise;

  rtdbCheckPromise = fetch(`${FIREBASE_RTDB_URL}/.json?shallow=true`, { method: 'GET' })
    .then((r) => {
      isRtdbReachable = r.ok;
      return r.ok;
    })
    .catch(() => {
      isRtdbReachable = false;
      return false;
    });

  return rtdbCheckPromise;
}

/**
 * Utilitários convenientes para operações CRUD no Firebase RTDB
 */
export const rtdb = {
  /**
   * Obtém os dados de um nó ou coleção com proteção contra travamento (timeout padrão de 2.5s)
   */
  async get<T = any>(path: string, timeoutMs = 2500): Promise<T | null> {
    const reachable = await checkRtdbReachable();
    if (!reachable) {
      const fallback = getSeedFallback(path);
      return fallback !== undefined ? (fallback as T) : null;
    }

    try {
      const nodeRef = ref(db, path);
      let timer: any;
      const timeoutPromise = new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), timeoutMs);
      });
      const fetchPromise = get(nodeRef).then((snapshot) => {
        if (!snapshot.exists()) return null;
        const val = snapshot.val();
        if (val && typeof val === 'object' && (val as any).error) return null;
        return val as T;
      }).catch(() => null);

      let result: any = null;
      try {
        result = await Promise.race([fetchPromise, timeoutPromise]);
      } finally {
        clearTimeout(timer);
      }

      if (result !== null && result !== undefined) {
        return result as T;
      }
    } catch {}

    // Fallback garantido com os dados de 3 dias atrás
    const fallback = getSeedFallback(path);
    return fallback !== undefined ? (fallback as T) : null;
  },

  /**
   * Obtém uma coleção como lista (array de itens)
   */
  async getList<T = any>(collectionName: string, timeoutMs = 2500): Promise<T[]> {
    const reachable = await checkRtdbReachable();
    if (!reachable) {
      return getSeedFallbackList(collectionName);
    }

    try {
      const data = await this.get<Record<string, T>>(collectionName, timeoutMs);
      if (data && typeof data === 'object' && !(data as any).error) {
        const list = Object.values(data).filter((item: any) => item && !item?._schema_info && !item?.error);
        if (list.length > 0) return list;
      }
    } catch {}

    // Fallback garantido com a coleção de 3 dias atrás
    return getSeedFallbackList(collectionName);
  },

  /**
   * Grava dados sobrescrevendo o nó indicado com proteção contra travamento
   */
  async set<T = any>(path: string, data: T, timeoutMs = 2500): Promise<void> {
    const clean = path.replace(/^\/+|\/+$/g, '');
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`tw_rtdb_${clean}`, JSON.stringify(data));
      } catch {}
    }
    try {
      const nodeRef = ref(db, path);
      let timer: any;
      const timeoutPromise = new Promise<void>((resolve) => {
        timer = setTimeout(() => resolve(), timeoutMs);
      });
      const setPromise = set(nodeRef, data).catch(() => {});
      try {
        await Promise.race([setPromise, timeoutPromise]);
      } finally {
        clearTimeout(timer);
      }
    } catch {}
    this.triggerRealtimeNotification(path, 'UPDATE', data);
  },

  /**
   * Atualiza campos específicos em um nó com proteção contra travamento
   */
  async update(path: string, data: Record<string, any>, timeoutMs = 2500): Promise<void> {
    const clean = path.replace(/^\/+|\/+$/g, '');
    if (typeof window !== 'undefined') {
      try {
        const existing = getSeedFallback(clean) || {};
        const merged = { ...existing, ...data };
        localStorage.setItem(`tw_rtdb_${clean}`, JSON.stringify(merged));
      } catch {}
    }
    try {
      const nodeRef = ref(db, path);
      let timer: any;
      const timeoutPromise = new Promise<void>((resolve) => {
        timer = setTimeout(() => resolve(), timeoutMs);
      });
      const updatePromise = update(nodeRef, data).catch(() => {});
      try {
        await Promise.race([updatePromise, timeoutPromise]);
      } finally {
        clearTimeout(timer);
      }
    } catch {}
    this.triggerRealtimeNotification(path, 'UPDATE', data);
  },

  /**
   * Remove um nó com proteção contra travamento
   */
  async remove(path: string, timeoutMs = 2500): Promise<void> {
    const clean = path.replace(/^\/+|\/+$/g, '');
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`tw_rtdb_${clean}`, JSON.stringify(null));
      } catch {}
    }
    try {
      const nodeRef = ref(db, path);
      let timer: any;
      const timeoutPromise = new Promise<void>((resolve) => {
        timer = setTimeout(() => resolve(), timeoutMs);
      });
      const removePromise = remove(nodeRef).catch(() => {});
      try {
        await Promise.race([removePromise, timeoutPromise]);
      } finally {
        clearTimeout(timer);
      }
    } catch {}
    this.triggerRealtimeNotification(path, 'DELETE', null);
  },

  /**
   * Escuta alterações em tempo real em um nó
   */
  subscribe<T = any>(path: string, callback: (data: T | null) => void): () => void {
    const nodeRef = ref(db, path);
    const listener = (snapshot: any) => {
      callback(snapshot.exists() ? (snapshot.val() as T) : null);
    };
    onValue(nodeRef, listener);
    return () => off(nodeRef, 'value', listener);
  },

  /**
   * Dispara a propagação do evento em tempo real para toda a rede
   */
  triggerRealtimeNotification(path: string, eventType: string, data?: any) {
    const clean = path.replace(/^\/+/, '');
    const root = clean.split('/')[0];
    if (!root || root.startsWith('system_') || root.startsWith('_')) return;
    try {
      import('@/integrations/supabase/client')
        .then(({ notifyTableChange }) => {
          notifyTableChange(root, eventType, data);
        })
        .catch(() => {});
    } catch {}
  },

  /**
   * Notifica manualmente a alteração em uma tabela
   */
  notifyRealtimeChange(table: string, eventType: string = 'UPDATE', data?: any) {
    try {
      import('@/integrations/supabase/client')
        .then(({ notifyTableChange }) => {
          notifyTableChange(table, eventType, data);
        })
        .catch(() => {});
    } catch {}
  },

  /**
   * Retorna referência direta do Firebase Realtime Database
   */
  ref(path: string): DatabaseReference {
    return ref(db, path);
  },
};

export default rtdb;
