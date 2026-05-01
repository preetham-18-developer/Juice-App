import axios from 'axios';
import { SecurityService } from './SecurityService';

const API_TIMEOUT = 10000; // 10 seconds as per security requirements

const apiClient = axios.create({
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Add JWT
apiClient.interceptors.request.use(
  async (config) => {
    const token = await SecurityService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Force HTTPS
    if (config.url?.startsWith('http://')) {
      config.url = config.url.replace('http://', 'https://');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Refresh Token Rotation & Errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 and refresh token logic
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = await SecurityService.getRefreshToken();
      
      if (refreshToken) {
        try {
          // Mocking token rotation
          // In real app: const { data } = await axios.post('https://api.juicy.app/refresh', { refreshToken });
          // await SecurityService.saveTokens(data.accessToken, data.refreshToken);
          // originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          // return apiClient(originalRequest);
        } catch (refreshError) {
          await SecurityService.clearTokens();
          // Trigger redirect to login (usually via an event emitter or global state)
        }
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
