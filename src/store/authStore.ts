import { create } from 'zustand'
import { authApi } from '../services/api'

interface User {
  id: string
  name: string
  email: string
}

interface AuthStore {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  loginWithGoogle: (accessToken: string) => Promise<void>
  logout: () => Promise<void>
  setAuth: (user: User, token: string) => void
  hydrate: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  hydrate: () => {
    try {
      const token = localStorage.getItem('vb_token')
      const userStr = localStorage.getItem('vb_user')
      if (token && userStr) {
        set({ token, user: JSON.parse(userStr) })
      }
    } catch {
      localStorage.removeItem('vb_token')
      localStorage.removeItem('vb_user')
    }
  },

  setAuth: (user, token) => {
    localStorage.setItem('vb_token', token)
    localStorage.setItem('vb_user', JSON.stringify(user))
    set({ user, token, error: null })
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await authApi.login(email, password)
      localStorage.setItem('vb_token', data.token)
      localStorage.setItem('vb_user', JSON.stringify(data.user))
      set({ user: data.user, token: data.token, isLoading: false })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Login failed'
      set({ isLoading: false, error: msg })
      throw new Error(msg)
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await authApi.register(name, email, password)
      localStorage.setItem('vb_token', data.token)
      localStorage.setItem('vb_user', JSON.stringify(data.user))
      set({ user: data.user, token: data.token, isLoading: false })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Registration failed'
      set({ isLoading: false, error: msg })
      throw new Error(msg)
    }
  },

  logout: async () => {
    localStorage.removeItem('vb_token')
    localStorage.removeItem('vb_user')
    set({ user: null, token: null })
  },

  loginWithGoogle: async (accessToken) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await authApi.googleLogin(accessToken)
      localStorage.setItem('vb_token', data.token)
      localStorage.setItem('vb_user', JSON.stringify(data.user))
      set({ user: data.user, token: data.token, isLoading: false })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Google sign-in failed'
      set({ isLoading: false, error: msg })
      throw new Error(msg)
    }
  },
}))