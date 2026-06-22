    import { useState, useEffect } from 'react'
    import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
    import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
    import { CSS } from '@dnd-kit/utilities'
    import { tablerosService } from '../../services/api'
    import SidebarVendedor from '../../components/SidebarVendedor'
    import '../../styles/dashboard.css'
    import '../../styles/tableros.css'

    function TareaCard({ tarea, tableroId, onMover, onEliminar, onEditar }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tarea.id })
    const [editando, setEditando] = useState(false)
    const [contenido, setContenido] = useState(tarea.contenido)

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    }

    const guardar = async () => {
        if (!contenido.trim()) return
        await onEditar(tableroId, tarea.id, { contenido })
        setEditando(false)
    }

    const cancelar = () => {
        setContenido(tarea.contenido)
        setEditando(false)
    }

    const seccionesDestino = {
        por_hacer:   [{ key: 'en_progreso', label: 'En progreso' }, { key: 'hecho', label: 'Hecho' }],
        en_progreso: [{ key: 'por_hacer', label: 'Por hacer' }, { key: 'hecho', label: 'Hecho' }],
        hecho:       [{ key: 'por_hacer', label: 'Por hacer' }, { key: 'en_progreso', label: 'En progreso' }],
    }

    return (
        <div ref={setNodeRef} style={style} className="kanban-tarea">
        <div className="kanban-tarea-top">
            <div className="kanban-tarea-drag" {...attributes} {...listeners} title="Arrastrá para mover">⠿⠿</div>
            <div className="kanban-tarea-btns-top">
            <button className="btn-icono" onClick={() => setEditando(true)} title="Editar">✏️</button>
            <button className="btn-icono btn-icono-danger" onClick={() => onEliminar(tableroId, tarea.id)} title="Eliminar">🗑️</button>
            </div>
        </div>

        {editando ? (
            <div className="kanban-tarea-editar">
            <textarea
                value={contenido}
                onChange={e => setContenido(e.target.value)}
                rows={3}
                autoFocus
            />
            <div className="kanban-tarea-acciones">
                <button className="btn btn-primary" onClick={guardar}>Guardar</button>
                <button className="btn btn-secondary" onClick={cancelar}>Cancelar</button>
            </div>
            </div>
        ) : (
            <>
            <p>{tarea.contenido}</p>
            <div className="kanban-mover">
                <span className="kanban-mover-label">Mover a:</span>
                <div className="kanban-mover-btns">
                {seccionesDestino[tarea.seccion].map(s => (
                    <button key={s.key} className="btn btn-secondary" onClick={() => onMover(tableroId, tarea.id, s.key)}>
                    {s.label}
                    </button>
                ))}
                </div>
            </div>
            </>
        )}
        </div>
    )
    }

    function Tableros() {
    const [tableros, setTableros]           = useState([])
    const [cargando, setCargando]           = useState(true)
    const [error, setError]                 = useState('')
    const [nuevoNombre, setNuevoNombre]     = useState('')
    const [tableroActivo, setTableroActivo] = useState(null)
    const [nuevaTarea, setNuevaTarea]       = useState('')
    const [seccionNueva, setSeccionNueva]   = useState('por_hacer')
    const [limite, setLimite]               = useState(5)

    const sensors = useSensors(useSensor(PointerSensor))

    const cargarTableros = async () => {
        try {
        const res = await tablerosService.listar()
        setTableros(res.data)
        if (tableroActivo) {
            const actualizado = res.data.find(t => t.id === tableroActivo.id)
            if (actualizado) setTableroActivo(actualizado)
        }
        } catch {
        setError('Error al cargar tableros.')
        } finally {
        setCargando(false)
        }
    }

    useEffect(() => {
        cargarTableros()
        const lim = localStorage.getItem('limite_tableros')
        if (lim) setLimite(Number(lim))
    }, [])

    const crearTablero = async (e) => {
        e.preventDefault()
        if (!nuevoNombre.trim()) return
        setError('')
        try {
        await tablerosService.crear({ nombre: nuevoNombre })
        setNuevoNombre('')
        cargarTableros()
        } catch (err) {
        setError(err.response?.data?.detail || 'Error al crear tablero.')
        }
    }

    const eliminarTablero = async (id) => {
        if (!window.confirm('¿Eliminar este tablero y todas sus tareas?')) return
        try {
        await tablerosService.eliminar(id)
        if (tableroActivo?.id === id) setTableroActivo(null)
        cargarTableros()
        } catch {
        setError('Error al eliminar tablero.')
        }
    }

    const agregarTarea = async (e) => {
        e.preventDefault()
        if (!nuevaTarea.trim()) return
        try {
        await tablerosService.agregarTarea(tableroActivo.id, { contenido: nuevaTarea, seccion: seccionNueva })
        setNuevaTarea('')
        cargarTableros()
        } catch {
        setError('Error al agregar tarea.')
        }
    }

    const moverTarea = async (tableroId, tareaId, nuevaSeccion) => {
        try {
        await tablerosService.editarTarea(tableroId, tareaId, { seccion: nuevaSeccion })
        cargarTableros()
        } catch {
        setError('Error al mover tarea.')
        }
    }

    const editarTarea = async (tableroId, tareaId, datos) => {
        try {
        await tablerosService.editarTarea(tableroId, tareaId, datos)
        cargarTableros()
        } catch {
        setError('Error al editar tarea.')
        }
    }

    const eliminarTarea = async (tableroId, tareaId) => {
        try {
        await tablerosService.eliminarTarea(tableroId, tareaId)
        cargarTableros()
        } catch {
        setError('Error al eliminar tarea.')
        }
    }

    const handleDragEnd = async (event) => {
        const { active, over } = event
        if (!over || active.id === over.id) return

        const tarea = tableroActivo.tareas.find(t => t.id === active.id)
        const destino = tableroActivo.tareas.find(t => t.id === over.id)
        if (!tarea || !destino || tarea.seccion === destino.seccion) return

        await moverTarea(tableroActivo.id, tarea.id, destino.seccion)
    }

    const secciones = [
        { key: 'por_hacer',   label: 'Por hacer',   color: 'var(--color-warning)' },
        { key: 'en_progreso', label: 'En progreso', color: 'var(--color-info)'    },
        { key: 'hecho',       label: 'Hecho',       color: 'var(--color-success)' },
    ]

    const tareasPorSeccion = (seccion) =>
        tableroActivo?.tareas?.filter(t => t.seccion === seccion) || []

    return (
        <div className="dashboard-wrapper">
        <SidebarVendedor />

        <div className="main-content">
            <div className="topbar">
            <span className="topbar-title">Tableros Kanban</span>
            <div className="topbar-user">
                <span className="text-muted">{tableros.length}/{limite} tableros</span>
            </div>
            </div>

            <div className="content-area">
            {error && <div className="auth-error">{error}</div>}

            <div className="tableros-layout">
                <div className="tableros-lista card">
                <div className="card-header">Mis tableros</div>

                {tableros.length < limite && (
                    <form onSubmit={crearTablero} className="tablero-form">
                    <div className="form-group">
                        <input
                        type="text"
                        value={nuevoNombre}
                        onChange={e => setNuevoNombre(e.target.value)}
                        placeholder="Nombre del tablero"
                        />
                    </div>
                    <button className="btn btn-primary" type="submit">Crear</button>
                    </form>
                )}

                {cargando ? <p>Cargando...</p> : tableros.length === 0 ? (
                    <p className="text-muted">No tenés tableros todavía.</p>
                ) : (
                    tableros.map(t => (
                    <div
                        key={t.id}
                        className={`tablero-item${tableroActivo?.id === t.id ? ' activo' : ''}`}
                        onClick={() => setTableroActivo(t)}
                    >
                        <span>{t.nombre}</span>
                        <button className="btn btn-danger" onClick={e => { e.stopPropagation(); eliminarTablero(t.id) }}>✕</button>
                    </div>
                    ))
                )}
                </div>

                {tableroActivo && (
                <div className="kanban-wrapper">
                    <div className="kanban-header">
                    <h3>{tableroActivo.nombre}</h3>
                    </div>

                    <form onSubmit={agregarTarea} className="tarea-form card card-mb">
                    <div className="form-row">
                        <div className="form-group">
                        <label>Nueva tarea</label>
                        <input
                            type="text"
                            value={nuevaTarea}
                            onChange={e => setNuevaTarea(e.target.value)}
                            placeholder="Describí la tarea..."
                        />
                        </div>
                        <div className="form-group">
                        <label>Columna</label>
                        <select value={seccionNueva} onChange={e => setSeccionNueva(e.target.value)}>
                            {secciones.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                        </select>
                        </div>
                    </div>
                    <button className="btn btn-primary" type="submit">Agregar tarea</button>
                    </form>

                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <div className="kanban-columnas">
                        {secciones.map(s => (
                        <div key={s.key} className="kanban-columna">
                            <div className="kanban-columna-header" style={{ borderTop: `3px solid ${s.color}` }}>
                            {s.label}
                            <span className="kanban-count">{tareasPorSeccion(s.key).length}</span>
                            </div>
                            <SortableContext items={tareasPorSeccion(s.key).map(t => t.id)} strategy={verticalListSortingStrategy}>
                            <div className="kanban-tareas">
                                {tareasPorSeccion(s.key).length === 0 ? (
                                <p className="text-muted">Sin tareas</p>
                                ) : (
                                tareasPorSeccion(s.key).map(t => (
                                    <TareaCard
                                    key={t.id}
                                    tarea={t}
                                    tableroId={tableroActivo.id}
                                    onMover={moverTarea}
                                    onEliminar={eliminarTarea}
                                    onEditar={editarTarea}
                                    />
                                ))
                                )}
                            </div>
                            </SortableContext>
                        </div>
                        ))}
                    </div>
                    </DndContext>
                </div>
                )}
            </div>
            </div>
        </div>
        </div>
    )
    }

    export default Tableros