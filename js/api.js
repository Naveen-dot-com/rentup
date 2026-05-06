// ============================================================
// RentUp v2 — API Client
// All backend communication goes through this module
// ============================================================

const API = (() => {
  // ⚠️ Replace with your deployed Cloudflare Worker URL
  const BASE_URL = 'https://rentup-api.n-k-dubey1997.workers.dev';

  function getToken() { return localStorage.getItem('rentup_token'); }
  function setToken(token) { localStorage.setItem('rentup_token', token); }
  function clearToken() { localStorage.removeItem('rentup_token'); localStorage.removeItem('rentup_user'); sessionStorage.clear(); }
  function getUser() { try { return JSON.parse(localStorage.getItem('rentup_user')); } catch { return null; } }
  function setUser(user) { localStorage.setItem('rentup_user', JSON.stringify(user)); }

  async function request(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(BASE_URL + path, opts);
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) { clearToken(); window.location.href = 'index.html'; }
      throw new Error(data.error || 'Request failed');
    }
    return data;
  }

  return {
    getToken, setToken, clearToken, getUser, setUser,

    // Auth
    login: (body) => request('POST', '/api/login', body),
    register: (body) => request('POST', '/api/register', body),

    // Properties
    getProperties: () => request('GET', '/api/properties'),
    createProperty: (body) => request('POST', '/api/properties', body),
    updateProperty: (id, body) => request('PUT', '/api/properties/' + id, body),
    deleteProperty: (id) => request('DELETE', '/api/properties/' + id),

    // Rooms
    getRooms: (propertyId) => request('GET', '/api/rooms' + (propertyId ? '?property_id=' + propertyId : '')),
    createRoom: (body) => request('POST', '/api/rooms', body),
    updateRoom: (id, body) => request('PUT', '/api/rooms/' + id, body),
    deleteRoom: (id) => request('DELETE', '/api/rooms/' + id),

    // Bills
    getBills: (month, propertyId) => {
      const params = [];
      if (month) params.push('month=' + month);
      if (propertyId) params.push('property_id=' + propertyId);
      return request('GET', '/api/bills' + (params.length ? '?' + params.join('&') : ''));
    },
    createBill: (body) => request('POST', '/api/bills', body),
    updateBill: (id, body) => request('PUT', '/api/bills/' + id, body),
    togglePaid: (id) => request('PUT', '/api/bills/' + id + '/paid'),

    // Dashboard
    getDashboard: (month) => request('GET', '/api/dashboard' + (month ? '?month=' + month : '')),

    // Settings
    getSettings: () => request('GET', '/api/settings'),
    updateSettings: (body) => request('PUT', '/api/settings', body),

    // Export
    exportData: () => request('GET', '/api/export'),
  };
})();
