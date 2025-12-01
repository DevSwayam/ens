const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

interface ApiError {
  success: false
  error: string
  details?: unknown
  code?: string
}

interface ApiSuccess<T> {
  success: true
  data: T
  message?: string
}

type ApiResponse<T> = ApiSuccess<T> | ApiError

class ApiClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      const data: ApiResponse<T> = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(
          data.success === false
            ? data.error
            : `Request failed with status ${response.status}`
        )
      }

      return data.data
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unknown error occurred')
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  async delete<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      body: JSON.stringify(body),
    })
  }
}

export const apiClient = new ApiClient(API_URL)
