/**
 * Twin Wheels - Firebase Realtime Database Integration
 * Database URL: https://rfdrive-fd805-default-rtdb.firebaseio.com
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, get, set, update, remove, onValue, off, DatabaseReference } from 'firebase/database';

const FIREBASE_RTDB_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_RTDB_URL) ||
  'https://rfdrive-fd805-default-rtdb.firebaseio.com';

const firebaseConfig = {
  databaseURL: FIREBASE_RTDB_URL,
};

// Inicializa a instância do Firebase App caso ainda não exista
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getDatabase(app, FIREBASE_RTDB_URL);

/**
 * Utilitários convenientes para operações CRUD no Firebase RTDB
 */
export const rtdb = {
  /**
   * Obtém os dados de um nó ou coleção
   */
  async get<T = any>(path: string): Promise<T | null> {
    const nodeRef = ref(db, path);
    const snapshot = await get(nodeRef);
    return snapshot.exists() ? (snapshot.val() as T) : null;
  },

  /**
   * Obtém uma coleção como lista (array de itens)
   */
  async getList<T = any>(collectionName: string): Promise<T[]> {
    const data = await this.get<Record<string, T>>(collectionName);
    if (!data) return [];
    return Object.values(data).filter((item: any) => !item?._schema_info);
  },

  /**
   * Grava dados sobrescrevendo o nó indicado
   */
  async set<T = any>(path: string, data: T): Promise<void> {
    const nodeRef = ref(db, path);
    await set(nodeRef, data);
  },

  /**
   * Atualiza campos específicos em um nó
   */
  async update(path: string, data: Record<string, any>): Promise<void> {
    const nodeRef = ref(db, path);
    await update(nodeRef, data);
  },

  /**
   * Remove um nó
   */
  async remove(path: string): Promise<void> {
    const nodeRef = ref(db, path);
    await remove(nodeRef);
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
   * Retorna referência direta do Firebase Realtime Database
   */
  ref(path: string): DatabaseReference {
    return ref(db, path);
  },
};

export default rtdb;
