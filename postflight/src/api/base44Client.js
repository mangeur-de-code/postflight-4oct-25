// API client for serverless functions
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}/${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Flight operations
  async getFlights(params = {}) {
    return this.request('flights', { method: 'GET', params });
  }

  async createFlight(data) {
    return this.request('flights', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateFlight(id, data) {
    return this.request(`flights/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteFlight(id) {
    return this.request(`flights/${id}`, { method: 'DELETE' });
  }
}

export const base44 = new ApiClient(BASE_URL);
