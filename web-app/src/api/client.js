/**
 * Central API client for the Spring Boot backend.
 * Automatically attaches the Bearer JWT and logs out on 401 responses.
 */

const BASE = import.meta.env.VITE_API_URL ?? ''

function getToken() {
  return localStorage.getItem('rs_token')
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers })

  if (res.status === 401) {
    localStorage.removeItem('rs_token')
    localStorage.removeItem('rs_user')
    window.location.href = '/login'
    throw new Error('Session expired')
  }

  const data = res.headers.get('content-type')?.includes('application/json')
    ? await res.json()
    : await res.text()

  if (!res.ok) {
    const message = (typeof data === 'object' && data?.message) ? data.message : `HTTP ${res.status}`
    throw Object.assign(new Error(message), { status: res.status, data })
  }

  return data
}

export const authApi = {
  googleLogin: (idToken) =>
    request('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    }),

  appleLogin: (identityToken, fullName) =>
    request('/api/auth/apple', {
      method: 'POST',
      body: JSON.stringify({ identityToken, fullName }),
    }),
}

export const userApi = {
  getMe: () => request('/api/users/me'),
}

export const analysisApi = {
  analyze: (file, jobDescription) => {
    const form = new FormData()
    form.append('resume', file)
    if (jobDescription?.trim()) form.append('jobDescription', jobDescription.trim())
    return request('/api/analyze', { method: 'POST', body: form })
  },

  getById: (id) => request(`/api/results/${id}`),

  getHistory: () => request('/api/history'),
}

export const creditsApi = {
  topup: (amount, reason = 'TOPUP') =>
    request('/api/credits/topup', {
      method: 'POST',
      body: JSON.stringify({ amount, reason }),
    }),
}

export const paymentApi = {
  getPlans: () => request('/api/payment/plans'),

  createOrder: (planId) =>
    request('/api/payment/create-order', {
      method: 'POST',
      body: JSON.stringify({ planId }),
    }),

  verify: (orderId, paymentId, signature) =>
    request('/api/payment/verify', {
      method: 'POST',
      body: JSON.stringify({ orderId, paymentId, signature }),
    }),
}
