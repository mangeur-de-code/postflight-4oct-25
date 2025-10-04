import { apiClient } from './base44Client';

// Flight operations
export const Flight = {
  getAll: () => apiClient.request('flights'),
  getById: (id) => apiClient.request(`flights/${id}`),
  create: (data) => apiClient.request('flights', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiClient.request(`flights/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiClient.request(`flights/${id}`, { method: 'DELETE' }),
};

export const FlightGroup = {
  getAll: () => apiClient.request('flight-groups'),
  getById: (id) => apiClient.request(`flight-groups/${id}`),
  create: (data) => apiClient.request('flight-groups', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiClient.request(`flight-groups/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiClient.request(`flight-groups/${id}`, { method: 'DELETE' }),
};

export const User = {
  me: () => apiClient.request('users/me'),
  loginWithRedirect: async (redirectUrl) => {
    window.location.href = `/api/auth/signin?redirect=${encodeURIComponent(redirectUrl)}`;
  },
  logout: async (redirectUrl) => {
    window.location.href = `/api/auth/signout?redirect=${encodeURIComponent(redirectUrl)}`;
  }
};