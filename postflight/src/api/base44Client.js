import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Replace hardcoded URLs with environment variables
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://base44.com/api';
const AUTH_URL = import.meta.env.VITE_AUTH_URL || 'https://base44.com/oauth';

// Create a client with authentication required
export const base44 = createClient({
  appId: import.meta.env.VITE_BASE44_APP_ID || "687810a9294a03ec0724d15e",
  requiresAuth: true, // Ensure authentication is required for all operations
  baseUrl: BASE_URL,
  authUrl: AUTH_URL
});
