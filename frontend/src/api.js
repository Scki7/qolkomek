import axios from 'axios';

const api = axios.create({
  // ЗАМЕНИ ЭТУ ССЫЛКУ НА СВОЮ ИЗ RENDER (которая заканчивается на .onrender.com)
  baseURL: 'https://qolkomek.onrender.com', 
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
