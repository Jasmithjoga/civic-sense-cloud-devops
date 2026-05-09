import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'https://civicsense-tvmn.onrender.com';

// ─── Axios instance ───────────────────────────────────────────────────────────
const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor — attach token ───────────────────────────────────────
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('civic_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// ─── Response interceptor — normalise errors ──────────────────────────────────
api.interceptors.response.use(
    (res) => res.data,
    (err) => {
        const message = err.response?.data?.message || err.message || 'Network error';
        if (err.response?.status === 401) {
            localStorage.removeItem('civic_token');
            localStorage.removeItem('civic_user');
        }
        return Promise.reject(new Error(message));
    }
);

// ═══════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════
export const authAPI = {
    register: (data) => api.post('/api/auth/register', data),
    login: (data) => api.post('/api/auth/login', data),
    getMe: () => api.get('/api/auth/me'),
};

// ═══════════════════════════════════════════════════════════
// COMPLAINTS
// ═══════════════════════════════════════════════════════════
export const complaintsAPI = {
    /**
     * Create/Report a complaint — handles reportCount logic
     */
    report: (formData) =>
        api.post('/api/complaints/report', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),

    /**
     * Legacy Create (mapped to report)
     */
    create: (formData) =>
        api.post('/api/complaints/report', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),

    /**
     * Escalate a complaint
     */
    escalate: (id) => api.put(`/api/complaints/escalate/${id}`),

    /**
     * Get a complaint by its human-readable ID (e.g. CIV-2026-1234)
     */
    getById: (complaintId) => api.get(`/api/complaints/${complaintId}`),

    /**
     * Upvote a complaint
     */
    upvote: (complaintId) => api.post(`/api/complaints/${complaintId}/upvote`),

    /**
     * Get complaints nearby a GPS coordinate
     */
    nearby: ({ lat, lng, radius = 500 }) =>
        api.get('/api/complaints/nearby', { params: { lat, lng, radius } }),
};

// ═══════════════════════════════════════════════════════════
// ADMIN
// ═══════════════════════════════════════════════════════════
export const adminAPI = {
    /**
     * Get all complaints with optional filters
     */
    getAll: (params = {}) => api.get('/api/admin/complaints', { params }),

    /**
     * Get only escalated complaints
     */
    getEscalated: () => api.get('/api/complaints/admin/escalated'),

    /**
     * Update complaint status
     */
    updateStatus: (id, status) => api.patch(`/api/admin/complaints/${id}/status`, { status }),

    /**
     * Assign department
     */
    assign: (id, department) => api.patch(`/api/admin/complaints/${id}/assign`, { department }),
};

// ═══════════════════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════════════════
export const analyticsAPI = {
    issuesByType: () => api.get('/api/analytics/issues-by-type'),
    statusBreakdown: () => api.get('/api/analytics/status-breakdown'),
    hotspots: () => api.get('/api/analytics/hotspots'),
    monthly: () => api.get('/api/analytics/monthly'),
    summary: () => api.get('/api/analytics/summary'),
};

// ─── Health check ─────────────────────────────────────────────────────────────
export const checkBackend = () =>
    api.get('/api/health').catch(() => null);

export default api;
