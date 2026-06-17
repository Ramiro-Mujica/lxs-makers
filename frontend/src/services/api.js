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
    if (error.response?.status === 401 && !original._retry && original.url !== '/usuarios/login/') {
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
  actualizarPerfil:      (datos)      => api.patch('/usuarios/perfil/', datos),
  resumen:               ()           => api.get('/usuarios/resumen/'),
  listarVendedores:      ()           => api.get('/usuarios/vendedores/'),
  cambiarEstadoVendedor: (id, estado) => api.patch(`/usuarios/vendedores/${id}/estado/`, { estado }),
}

export const productosService = {
  listar:               ()                   => api.get('/productos/'),
  crear:                (datos)              => api.post('/productos/', datos),
  actualizar:           (id, datos)          => api.patch(`/productos/${id}/`, datos),
  eliminar:             (id)                 => api.delete(`/productos/${id}/`),
  agregarImagen:        (id, archivo, orden) => {
    const formData = new FormData()
    formData.append('imagen', archivo)
    formData.append('orden', orden)
    return api.post(`/productos/${id}/imagenes/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  eliminarImagen:       (id, imgId)          => api.delete(`/productos/${id}/imagenes/${imgId}/`),
  actualizarOrdenImagen:(id, imgId, orden)   => api.patch(`/productos/${id}/imagenes/${imgId}/orden/`, { orden }),
  agregarVariante:      (id, datos)          => api.post(`/productos/${id}/variantes/`, datos),
  eliminarVariante:     (id, varId)          => api.delete(`/productos/${id}/variantes/${varId}/`),
  catalogoPublico:      (codigo)             => api.get(`/productos/catalogo/${codigo}/`),
}

export const pedidosService = {
  listar:          ()                  => api.get('/pedidos/'),
  crear:           (datos)             => api.post('/pedidos/', datos),
  actualizar:      (id, datos)         => api.patch(`/pedidos/${id}/`, datos),
  eliminar:        (id)                => api.delete(`/pedidos/${id}/`),
  agregarDetalle:  (id, datos)         => api.post(`/pedidos/${id}/detalles/`, datos),
  eliminarDetalle: (id, detId)         => api.delete(`/pedidos/${id}/detalles/${detId}/`),
  editarDetalle:   (id, detId, datos)  => api.patch(`/pedidos/${id}/detalles/${detId}/editar/`, datos),
  seguimiento:     (codigo)            => api.get(`/pedidos/seguimiento/${codigo}/`),
}

export const tablerosService = {
  listar:       ()               => api.get('/tableros/'),
  crear:        (datos)          => api.post('/tableros/', datos),
  actualizar:   (id, datos)      => api.patch(`/tableros/${id}/`, datos),
  eliminar:     (id)             => api.delete(`/tableros/${id}/`),
  agregarTarea: (id, datos)      => api.post(`/tableros/${id}/tareas/`, datos),
  editarTarea:  (id, tId, datos) => api.patch(`/tableros/${id}/tareas/${tId}/`, datos),
  eliminarTarea:(id, tId)        => api.delete(`/tableros/${id}/tareas/${tId}/`),
}

export const estadisticasService = {
  obtener:          ()         => api.get('/pedidos/estadisticas/'),
  reiniciar:        ()         => api.post('/pedidos/estadisticas/reiniciar/'),
  obtenerAdmin:     ()         => api.get('/pedidos/estadisticas/admin/'),
  reiniciarAdmin:   (vendId)   => api.post('/pedidos/estadisticas/admin/reiniciar/', { vendedor_id: vendId }),
}

export default api