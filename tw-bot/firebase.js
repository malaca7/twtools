/**
 * Twin Wheels Bot - Firebase Realtime Database Client
 * Target: https://rfdrive-fd805-default-rtdb.firebaseio.com
 */

const FIREBASE_RTDB_URL = process.env.FIREBASE_RTDB_URL || 'https://rfdrive-fd805-default-rtdb.firebaseio.com';

const firebaseRtdb = {
  url: FIREBASE_RTDB_URL,

  async get(nodePath) {
    try {
      const cleanPath = nodePath.replace(/^\/+|\/+$/g, '');
      const res = await fetch(`${FIREBASE_RTDB_URL}/${cleanPath}.json`);
      if (!res.ok) return null;
      const data = await res.json();
      if (data && typeof data === 'object' && data.error) return null;
      return data;
    } catch {
      return null;
    }
  },

  async set(nodePath, data) {
    try {
      const cleanPath = nodePath.replace(/^\/+|\/+$/g, '');
      const res = await fetch(`${FIREBASE_RTDB_URL}/${cleanPath}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async update(nodePath, data) {
    try {
      const cleanPath = nodePath.replace(/^\/+|\/+$/g, '');
      const res = await fetch(`${FIREBASE_RTDB_URL}/${cleanPath}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async remove(nodePath) {
    try {
      const cleanPath = nodePath.replace(/^\/+|\/+$/g, '');
      const res = await fetch(`${FIREBASE_RTDB_URL}/${cleanPath}.json`, {
        method: 'DELETE',
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },
};

module.exports = firebaseRtdb;
