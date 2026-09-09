import { apiFetch } from './api';

export const loginUser = async (email, password) => {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  if (data.access_token) {
    localStorage.setItem('avighna_token', data.access_token);
    localStorage.setItem('avighna_user', JSON.stringify(data.user));
  }
  return data;
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('avighna_user');
  if (userStr) {
    try { return JSON.parse(userStr); } catch (e) { return null; }
  }
  return null;
};

export const registerUser = async (name, email, password, role = 'FIELD_OFFICER', district = 'Guwahati') => {
  const user = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, role, district })
  });
  return await loginUser(email, password);
};

export const logoutUser = () => {
  localStorage.removeItem('avighna_token');
  localStorage.removeItem('avighna_user');
};
