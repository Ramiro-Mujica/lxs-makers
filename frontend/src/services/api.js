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

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refresh')
        const res = await axios.post('http://127.0.0.1:8000/api/token/refresh/', { refresh })
        localStorage.setItem('access', res.data.access)
        original.headers.Authorization = `Bearer ${res.data.access}`
        return api(original)
      } catch {
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export const usuariosService = {
  registro:              (datos)      => api.post('/usuarios/registro/', datos),
  login:                 (datos)      => api.post('/usuarios/login/',    datos),
  perfil:                ()           => api.get('/usuarios/perfil/'),
  listarVendedores:      ()           => api.get('/usuarios/vendedores/'),
  cambiarEstadoVendedor: (id, estado) => api.patch(`/usuarios/vendedores/${id}/estado/`, { estado }),
}

export const productosService = {
  listar:          ()          => api.get('/productos/'),
  crear:           (datos)     => api.post('/productos/', datos),
  actualizar:      (id, datos) => api.patch(`/productos/${id}/`, datos),
  eliminar:        (id)        => api.delete(`/productos/${id}/`),
  agregarImagen:   (id, datos) => api.post(`/productos/${id}/imagenes/`, datos),
  eliminarImagen:  (id, imgId) => api.delete(`/productos/${id}/imagenes/${imgId}/`),
  agregarVariante: (id, datos) => api.post(`/productos/${id}/variantes/`, datos),
  eliminarVariante:(id, varId) => api.delete(`/productos/${id}/variantes/${varId}/`),
  catalogoPublico: (codigo)    => api.get(`/productos/catalogo/${codigo}/`),
}

export default api