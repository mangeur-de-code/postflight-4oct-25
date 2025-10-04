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

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle Unauthorized
      if (response.status === 401) {
        window.location.href = `/api/auth/signin?redirect=${encodeURIComponent(window.location.href)}`;
        return;
      }

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      // Handle No Content responses
      if (response.status === 204) {
        return null;
      }

      return response.json();
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }
}

export const apiClient = new ApiClient(BASE_URL);
