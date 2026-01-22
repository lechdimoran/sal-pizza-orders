import { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete, apiPatch } from './apiService';

/**
 * Custom hook for API calls with loading and error states
 * @param {string} endpoint - The API endpoint
 * @param {object} options - Options for the request
 * @returns {object} - { data, loading, error, refetch }
 */
export function useApi(endpoint, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiGet(endpoint, options.params);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (endpoint) {
      fetchData();
    }
  }, [endpoint]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook for API mutations (POST, PUT, DELETE, PATCH)
 * @param {string} method - HTTP method ('POST', 'PUT', 'DELETE', 'PATCH')
 * @returns {function} - Function to perform the mutation
 */
export function useApiMutation(method = 'POST') {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = async (endpoint, data) => {
    setLoading(true);
    setError(null);
    try {
      let result;
      switch (method.toUpperCase()) {
        case 'POST':
          result = await apiPost(endpoint, data);
          break;
        case 'PUT':
          result = await apiPut(endpoint, data);
          break;
        case 'DELETE':
          result = await apiDelete(endpoint);
          break;
        case 'PATCH':
          result = await apiPatch(endpoint, data);
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error };
}