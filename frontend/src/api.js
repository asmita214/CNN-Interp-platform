import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export const api = axios.create({
  baseURL: API_BASE,
});

export function imageUrl(imageIdx) {
  return `${API_BASE}/image/${imageIdx}`;
}
