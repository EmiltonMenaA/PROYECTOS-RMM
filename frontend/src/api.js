import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000
})

// Agregar token al header de cada request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const authAPI = {
  register: (username, password, full_name, role = 'user', extra = {}) =>
    api.post('/auth/register', { username, password, full_name, role, ...extra }),

  login: (username, password) =>
    api.post('/auth/login', { username, password }),

  getUsers: () =>
    api.get('/auth/users'),

  getSupervisors: () =>
    api.get('/auth/users').then(res => ({
      ...res,
      data: { users: res.data.users.filter(u => u.role === 'supervisor') }
    })),

  deactivateUser: (userId, active) =>
    api.patch(`/auth/${userId}/active`, { active }),

  deleteUser: (userId) =>
    api.delete(`/auth/${userId}`),

  health: () =>
    api.get('/health')
}

export const usersAPI = {
  getProfile: () =>
    api.get('/users/profile'),

  updateProfile: (profile) =>
    api.put('/users/profile', profile)
}

export const supervisorAPI = {
  getCalendar: (start, end) =>
    api.get('/supervisor/calendar', { params: { start, end } }),

  createEvent: (payload) =>
    api.post('/supervisor/events', payload),

  createTask: (payload) =>
    api.post('/supervisor/tasks', payload),

  createAction: (payload) =>
    api.post('/supervisor/actions', payload)
}

export const projectsAPI = {
  getProjects: () =>
    api.get('/projects'),

  getProject: (id) =>
    api.get(`/projects/${id}`),

  createProject: (data) =>
    api.post('/projects', data),

  assignSupervisor: (projectId, supervisorId) =>
    api.post(`/projects/${projectId}/supervisors/${supervisorId}`),

  removeSupervisor: (projectId, supervisorId) =>
    api.delete(`/projects/${projectId}/supervisors/${supervisorId}`)
}

export default api
