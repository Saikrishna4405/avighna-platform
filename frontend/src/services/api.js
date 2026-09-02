const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : 'http://localhost:8000/api';

export const getAuthHeaders = () => {
  const token = localStorage.getItem('avighna_token');
  return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};

export const apiFetch = async (endpoint, options = {}) => {
  const headers = { ...getAuthHeaders(), ...options.headers };
  const config = { ...options, headers };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    if (!response.ok) {
      const errData = await response.json().catch(() => ({ detail: 'API Error' }));
      throw new Error(errData.detail || `HTTP ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    console.error(`API Fetch Error on ${endpoint}:`, err);
    throw err;
  }
};
