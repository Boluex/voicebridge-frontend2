// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string
  name: string
  email: string
  clerkId?: string
}

// ─── Business ────────────────────────────────────────────────────────────────
export type BusinessCategory =
  | 'RESTAURANT' | 'CAFE' | 'BAKERY' | 'PHARMACY' | 'SALON'
  | 'BARBERSHOP' | 'PLUMBER' | 'ELECTRICIAN' | 'CLEANING' | 'HOTEL'
  | 'GYM' | 'CLINIC' | 'DENTAL' | 'GROCERY' | 'FASHION' | 'OTHER'

export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled'

export interface Business {
  id: string
  name: string
  slug: string
  category: BusinessCategory
  description?: string
  logoUrl?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  country: string
  deliveryRadius: number
  agentId?: string
  agentName: string
  agentGender: string
  agentVoiceId: string
  agentGreeting: string
  agentTone: string
  primaryLanguage: string
  multilingualOn: boolean
  recordCalls: boolean
  autoEscalate: boolean
  aiPhoneNumber?: string
  agentScheduleType?: string
  agentActiveDays?: string[]
  agentStartTime?: string
  agentEndTime?: string
  paystackPublicKey?: string
  paystackSecretKey?: string
  orderWebhookUrl?: string
  notificationEmail?: string
  escalationPhone?: string
  plan: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'
  subscriptionStatus: SubscriptionStatus
  subscriptionPlan?: string
  subscriptionExpiry?: string
  trialEndsAt?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    calls: number
    orders: number
    knowledgeSources: number
    catalogItems: number
  }
}

// ─── Knowledge Source ─────────────────────────────────────────────────────────
export type SourceType = 'URL' | 'PDF' | 'FAQ' | 'DOCX' | 'CSV' | 'TXT' | 'IMAGE' | 'XLSX'
export type SourceStatus = 'PROCESSING' | 'INDEXED' | 'ERROR'

export interface KnowledgeSource {
  id: string
  businessId: string
  type: SourceType
  name: string
  source?: string
  fileUrl?: string
  fileSize?: number
  chunkCount: number
  status: SourceStatus
  createdAt: string
}

// ─── Catalog ──────────────────────────────────────────────────────────────────
export interface CatalogItem {
  id: string
  businessId: string
  name: string
  description?: string
  price: number
  currency: string
  category?: string
  imageUrl?: string
  inStock: boolean
  available: boolean
  createdAt: string
}

// ─── Calls ────────────────────────────────────────────────────────────────────
export type CallStatus = 'COMPLETED' | 'ESCALATED' | 'MISSED' | 'FAILED'

export interface Call {
  id: string
  businessId: string
  callerNumber: string
  callerName?: string
  duration?: number
  status: CallStatus
  intent?: string
  language: string
  transcript?: string
  summary?: string
  elevenlabsCallId?: string
  startedAt: string
  endedAt?: string
}

// ─── Orders ───────────────────────────────────────────────────────────────────
export type OrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'PROCESSING' | 'DELIVERED' | 'CANCELLED' | 'FAILED'

export interface OrderItem {
  name: string
  qty: number
  price: number
}

export interface Order {
  id: string
  businessId: string
  callId?: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  deliveryAddress?: string
  items: OrderItem[]
  subtotal: number
  currency: string
  paystackRef?: string
  paystackLinkUrl?: string
  status: OrderStatus
  paidAt?: string
  createdAt: string
}

// ─── Stats ────────────────────────────────────────────────────────────────────
export interface BusinessStats {
  callsToday: number
  ordersToday: number
  totalOrders: number
  totalRevenue: number
  recentCalls: Call[]
  subscription: {
    status: SubscriptionStatus
    plan?: string
    trialEndsAt?: string
    expiry?: string
  }
}

// ─── Voice ────────────────────────────────────────────────────────────────────
export interface Voice {
  id: string
  name: string
  gender: string
  accent?: string
  useCase?: string
}
