import axios from 'axios'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const usuariosService = {
  registro: (datos) => api.post('/usuarios/registro/', datos),
  login:    (datos) => api.post('/usuarios/login/',    datos),
  perfil:   ()      => api.get('/usuarios/perfil/'),
}

export default api