/**
 * Generic API service for making HTTP requests to web APIs.
 * This module provides a templatized way to connect to web APIs with common HTTP methods.
 */

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://sal-707-dl.onrender.com'; // Replace with your actual API base URL
const API_KEY = process.env.REACT_APP_API_KEY; // Optional API key for non-authenticated endpoints

// Helper function to check if JWT token is expired
const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    return true;
  }
};

/**
 * Generic function to make API requests
 * @param {string} endpoint - The API endpoint (e.g., '/orders')
 * @param {object} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise} - Resolves to the JSON response or rejects with an error
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  // Get auth token from localStorage
  const token = localStorage.getItem('token');

  // Check if token is expired
  if (token && isTokenExpired(token)) {
    // Clear expired token
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Force page reload to trigger logout
    window.location.reload();
    throw new Error('Session expired. Please log in again.');
  }

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      // Add authorization token if available (JWT)
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  };

  const config = { ...defaultOptions, ...options };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Check if response has content
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return response.text();
    }
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

/**
 * GET request
 * @param {string} endpoint - The API endpoint
 * @param {object} params - Query parameters
 * @returns {Promise}
 */
export async function apiGet(endpoint, params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const url = queryString ? `${endpoint}?${queryString}` : endpoint;
  return apiRequest(url, { method: 'GET' });
}

/**
 * POST request
 * @param {string} endpoint - The API endpoint
 * @param {object} data - The data to send in the request body
 * @returns {Promise}
 */
export async function apiPost(endpoint, data) {
  return apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * PUT request
 * @param {string} endpoint - The API endpoint
 * @param {object} data - The data to send in the request body
 * @returns {Promise}
 */
export async function apiPut(endpoint, data) {
  return apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * DELETE request
 * @param {string} endpoint - The API endpoint
 * @returns {Promise}
 */
export async function apiDelete(endpoint) {
  return apiRequest(endpoint, { method: 'DELETE' });
}

/**
 * PATCH request
 * @param {string} endpoint - The API endpoint
 * @param {object} data - The data to send in the request body
 * @returns {Promise}
 */
export async function apiPatch(endpoint, data) {
  return apiRequest(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// Export the base URL for external use if needed
export { API_BASE_URL };