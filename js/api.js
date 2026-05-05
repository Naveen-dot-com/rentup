// ============================================================
// RentUp — API Client
// All backend communication goes through this module
// ============================================================

const API = (() => {
  // ⚠️ Replace with your deployed Cloudflare Worker URL
  const BASE_URL = 'https://rentup-api.n-k-dubey1997.workers.dev';

  function getToken() {
    return localStorage.getItem('rentup_token');
  }

  function setToken(token) {
    localStorage.setItem('rentup_token', token);
  }

  function clearToken() {
    localStorage.removeItem('rentup_token');
    localStorage.removeItem('rentup_user');
  }

  function getUser() {
    try { return JSON.parse(localStorage.getItem('rentup_user')); }
    catch { return null; }
  }

  function setUser(user) {
    localStorage.setItem('rentup_user', JSON.stringify(user));
  }

  async function request(method, path, data = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;

    const opts = { method, headers };
    if (data && method !== 'GET') opts.body = JSON.stringify(data);

    let url = BASE_URL + path;

    try {
      const res = await fetch(url, opts);
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          clearToken();
          window.location.href = 'index.html';
          return;
        }
        throw new Error(json.error || 'Request failed');
      }
      return json;
    } catch (err) {
      if (err.message === 'Failed to fetch') {
        throw new Error('Unable to connect to server. Please check your connection.');
      }
      throw err;
    }
  }

  return {
    getToken, setToken, clearToken, getUser, setUser,

    // Auth
    register: (data) => request('POST', '/api/register', data),
    login: (data) => request('POST', '/api/login', data),

    // Properties
    getProperties: () => request('GET', '/api/properties'),
    createProperty: (data) => request('POST', '/api/properties', data),
    updateProperty: (id, data) => request('PUT', '/api/properties/' + id, data),
    deleteProperty: (id) => request('DELETE', '/api/properties/' + id),

    // Rooms
    getRooms: (propertyId) => {
      let path = '/api/rooms';
      if (propertyId) path += '?property_id=' + propertyId;
      return request('GET', path);
    },
    createRoom: (data) => request('POST', '/api/rooms', data),
    updateRoom: (id, data) => request('PUT', '/api/rooms/' + id, data),
    deleteRoom: (id) => request('DELETE', '/api/rooms/' + id),

    // Bills
    getBills: (params) => {
      const qs = new URLSearchParams();
      if (params.month) qs.set('month', params.month);
      if (params.property_id) qs.set('property_id', params.property_id);
      if (params.room_id) qs.set('room_id', params.room_id);
      return request('GET', '/api/bills?' + qs.toString());
    },
    createBill: (data) => request('POST', '/api/bills', data),
    updateBill: (id, data) => request('PUT', '/api/bills/' + id, data),
    togglePaid: (id) => request('PUT', '/api/bills/' + id + '/paid'),

    // Dashboard
    getDashboard: (month) => {
      let path = '/api/dashboard';
      if (month) path += '?month=' + month;
      return request('GET', path);
    },

    // Settings
    getSettings: () => request('GET', '/api/settings'),
    updateSettings: (data) => request('PUT', '/api/settings', data),

    // Export
    exportAll: () => request('GET', '/api/export'),
  };
})();
