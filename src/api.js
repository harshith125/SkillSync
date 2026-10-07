import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD
        ? 'https://skillsync-server-vhkg.onrender.com/api'
        : 'http://localhost:5000/api')
});

// Automatically inject JWT authentication token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['x-auth-token'] = token;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// RESTful Jobs API
export const jobsAPI = {
    // GET
    getAll: () => api.get('/jobs'),
    getMyJobs: () => api.get('/jobs/my-jobs'),
    getById: (id) => api.get(`/jobs/${id}`),
    getMeetLink: (id) => api.get(`/jobs/${id}/generate-meet-link`),
    // POST
    create: (jobData) => api.post('/jobs', jobData),
    scheduleMeeting: (id, meetingData) => api.post(`/jobs/${id}/schedule-meeting`, meetingData),
    // PUT
    update: (id, jobData) => api.put(`/jobs/${id}`, jobData),
    close: (id) => api.put(`/jobs/${id}/close`),
    updateStages: (id, stages) => api.put(`/jobs/${id}/stages`, { stages }),
    // PATCH
    patchStatus: (id, status) => api.patch(`/jobs/${id}/status`, { status }),
    // DELETE
    delete: (id) => api.delete(`/jobs/${id}`)
};

// RESTful Applications API
export const applicationsAPI = {
    // GET
    getMyApplications: () => api.get('/applications/my'),
    getByJob: (jobId) => api.get(`/applications/job/${jobId}`),
    getById: (id) => api.get(`/applications/${id}`),
    // POST (Multi-part for PDF resumes)
    apply: (jobId, formData) => api.post(`/applications/apply/${jobId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    // PUT & PATCH
    updateStage: (id, stage) => api.patch(`/applications/${id}/stage`, { stage }),
    updateStatus: (id, status) => api.put(`/applications/${id}/status`, { status }),
    // DELETE
    delete: (id) => api.delete(`/applications/${id}`)
};

// RESTful Google OAuth & Calendar API
export const googleAPI = {
    // GET
    getStatus: () => api.get('/google/status'),
    getAuthUrl: () => api.get('/google/auth'),
    // POST
    scheduleInterview: (eventData) => api.post('/google/schedule-interview', eventData),
    // DELETE
    disconnect: () => api.delete('/google/disconnect')
};

// RESTful Auth & Profile API
export const authAPI = {
    // GET
    getMe: () => api.get('/auth/me'),
    verifyResetToken: (token) => api.get(`/auth/verify-reset-token/${token}`),
    // POST
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
    resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
    // PUT
    updateProfile: (profileData) => api.put('/auth/profile', profileData),
    // POST profile picture
    uploadProfilePicture: (formData) => api.post('/auth/profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    })
};

// ATS Resume Screening API
export const atsAPI = {
    // POST
    scan: (formData) => api.post('/ats/scan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    analyze: (formData) => api.post('/ats/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    })
};

// SkillSync PRO Subscription API
export const subscriptionAPI = {
    // GET
    getStatus: () => api.get('/subscription/status'),
    // POST
    activate: (data) => api.post('/subscription/activate', data)
};

export default api;
