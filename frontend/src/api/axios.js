import axios from 'axios';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', headers: { 'Content-Type': 'application/json' } });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vehiclecare_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));
api.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401) {
    localStorage.removeItem('vehiclecare_token'); localStorage.removeItem('vehiclecare_user');
    if (!['/login', '/register'].includes(window.location.pathname)) window.location.href = '/login?expired=1';
  } else if (error.response?.status === 403 && window.location.pathname !== '/403') {
    window.location.href = '/403';
  }
  return Promise.reject(error);
});
export default api;
