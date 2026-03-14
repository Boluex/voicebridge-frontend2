import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vb_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('vb_token')
      localStorage.removeItem('vb_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (name: string, email: string, password: string) =>
    api.post('/auth/register', { name, email, password }),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  googleLogin: (accessToken: string) =>
    api.post('/auth/google', { accessToken }),
}

// ─── Business ────────────────────────────────────────────────────────────────
export const businessApi = {
  list: () => api.get('/business'),
  get: (id: string) => api.get(`/business/${id}`),
  create: (data: Record<string, unknown>) => api.post('/business', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/business/${id}`, data),
  delete: (id: string) => api.delete(`/business/${id}`),
  stats: (id: string) => api.get(`/business/${id}/stats`),
  updateSchedule: (id: string, data: Record<string, unknown>) =>
    api.patch(`/business/${id}/schedule`, data),
}

// ─── Knowledge ────────────────────────────────────────────────────────────────
export const knowledgeApi = {
  list: (bizId: string) => api.get(`/knowledge/${bizId}`),
  getContent: (bizId: string, sourceId: string) =>
    api.get(`/knowledge/${bizId}/${sourceId}/content`),
  addUrl: (bizId: string, url: string) =>
    api.post(`/knowledge/${bizId}/url`, { url }),
  addFile: (bizId: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post(`/knowledge/${bizId}/file`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  addFaq: (bizId: string, content: string, name?: string) =>
    api.post(`/knowledge/${bizId}/faq`, { content, name }),
  delete: (bizId: string, sourceId: string) =>
    api.delete(`/knowledge/${bizId}/${sourceId}`),
}

// ─── Catalog ──────────────────────────────────────────────────────────────────
export const catalogApi = {
  list: (bizId: string) => api.get(`/catalog/${bizId}`),
  create: (bizId: string, data: Record<string, unknown>) =>
    api.post(`/catalog/${bizId}`, data),
  update: (bizId: string, itemId: string, data: Record<string, unknown>) =>
    api.patch(`/catalog/${bizId}/${itemId}`, data),
  delete: (bizId: string, itemId: string) =>
    api.delete(`/catalog/${bizId}/${itemId}`),
}

// ─── Calls ────────────────────────────────────────────────────────────────────
export const callsApi = {
  list: (bizId: string) => api.get(`/calls/${bizId}`),
}

// ─── Orders ───────────────────────────────────────────────────────────────────
export const ordersApi = {
  list: (bizId: string) => api.get(`/orders/${bizId}`),
}

// ─── Agent ────────────────────────────────────────────────────────────────────
export const agentApi = {
  voices: () => api.get('/agent/voices'),
  update: (bizId: string, data: Record<string, unknown>) =>
    api.patch(`/agent/${bizId}`, data),
  widgetUrl: (bizId: string) => api.get(`/agent/${bizId}/widget-url`),
}

// ─── Billing ──────────────────────────────────────────────────────────────────
export const billingApi = {
  status: (bizId: string) => api.get(`/billing/${bizId}/status`),
  activate: (bizId: string, data: { days: number; plan: string; email?: string }) =>
    api.post(`/billing/${bizId}/activate`, data),
  updateSchedule: (bizId: string, data: Record<string, unknown>) =>
    api.patch(`/billing/${bizId}/schedule`, data),
}