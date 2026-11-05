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

/**
 * Utilitários convenientes para operações CRUD no Firebase RTDB
 */
export const rtdb = {
  /**
   * Obtém os dados de um nó ou coleção com proteção contra travamento (timeout padrão de 2.5s)
   */
  async get<T = any>(path: string, timeoutMs = 2500): Promise<T | null> {
    try {
      const nodeRef = ref(db, path);
      let timer: any;
      const timeoutPromise = new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), timeoutMs);
      });
      const fetchPromise = get(nodeRef).then((snapshot) =>
        snapshot.exists() ? (snapshot.val() as T) : null
      ).catch(() => null);

      try {
        return await Promise.race([fetchPromise, timeoutPromise]);
      } finally {
        clearTimeout(timer);
      }
    } catch {
      return null;
    }
  },

  /**
   * Obtém uma coleção como lista (array de itens)
   */
  async getList<T = any>(collectionName: string, timeoutMs = 2500): Promise<T[]> {
    try {
      const data = await this.get<Record<string, T>>(collectionName, timeoutMs);
      if (!data || typeof data !== 'object') return [];
      return Object.values(data).filter((item: any) => !item?._schema_info);
    } catch {
      return [];
    }
  },

  /**
   * Grava dados sobrescrevendo o nó indicado com proteção contra travamento
   */
  async set<T = any>(path: string, data: T, timeoutMs = 2500): Promise<void> {
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
      this.triggerRealtimeNotification(path, 'UPDATE', data);
    } catch {}
  },

  /**
   * Atualiza campos específicos em um nó com proteção contra travamento
   */
  async update(path: string, data: Record<string, any>, timeoutMs = 2500): Promise<void> {
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
      this.triggerRealtimeNotification(path, 'UPDATE', data);
    } catch {}
  },

  /**
   * Remove um nó com proteção contra travamento
   */
  async remove(path: string, timeoutMs = 2500): Promise<void> {
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
      this.triggerRealtimeNotification(path, 'DELETE', null);
    } catch {}
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
