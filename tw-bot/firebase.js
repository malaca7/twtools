/**
 * Twin Wheels Bot - Firebase Realtime Database Client
 * Target: https://rfdrive-fd805-default-rtdb.firebaseio.com
 */

const FIREBASE_RTDB_URL = process.env.FIREBASE_RTDB_URL || 'https://rfdrive-fd805-default-rtdb.firebaseio.com';

const firebaseRtdb = {
  url: FIREBASE_RTDB_URL,

  async get(nodePath) {
    const cleanPath = nodePath.replace(/^\/+|\/+$/g, '');
    const res = await fetch(`${FIREBASE_RTDB_URL}/${cleanPath}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return await res.json();
  },

  async set(nodePath, data) {
    const cleanPath = nodePath.replace(/^\/+|\/+$/g, '');
    const res = await fetch(`${FIREBASE_RTDB_URL}/${cleanPath}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return await res.json();
  },

  async update(nodePath, data) {
    const cleanPath = nodePath.replace(/^\/+|\/+$/g, '');
    const res = await fetch(`${FIREBASE_RTDB_URL}/${cleanPath}.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return await res.json();
  },

  async remove(nodePath) {
    const cleanPath = nodePath.replace(/^\/+|\/+$/g, '');
    const res = await fetch(`${FIREBASE_RTDB_URL}/${cleanPath}.json`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return await res.json();
  },
};

module.exports = firebaseRtdb;
