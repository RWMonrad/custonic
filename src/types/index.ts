export interface Contract {
  id: string
  title: string
  description?: string
  status: 'draft' | 'active' | 'expired' | 'terminated'
  value: number
  start_date: string
  end_date: string
  client_id: string
  created_at: string
  updated_at: string
  user_id: string
  client?: Client
}

export interface Client {
  id: string
  name: string
  email: string
  company: string
  phone?: string
  address?: string
  created_at: string
  updated_at: string
  user_id: string
  contracts?: Contract[]
}

export interface Profile {
  id: string
  full_name?: string
  avatar_url?: string
  company?: string
  role: 'admin' | 'user'
  created_at: string
  updated_at: string
}

export interface ContractStats {
  total: number
  active: number
  expired: number
  draft: number
  terminated: number
  totalValue: number
  expiringSoon: number
}

export interface DashboardData {
  stats: ContractStats
  recentContracts: Contract[]
  topClients: Client[]
}
