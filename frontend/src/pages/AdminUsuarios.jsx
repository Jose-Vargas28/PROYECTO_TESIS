import { useEffect, useState, useCallback } from "react"
import { ToastContainer, toast } from "react-toastify"
import axios from "axios"
import storeAuth from "../context/storeAuth"
import ModalConfirmar from "../components/ui/ModalConfirmar"
import Paginacion from "../components/ui/Paginacion"
import { regionesEcuador, provinciasPorRegion } from "../config/ecuador"

const AdminUsuarios = () => {
    const { token } = storeAuth()
    const [pestana, setPestana] = useState("activos")
    const [modoGestion, setModoGestion] = useState(false)
    const [usuarioDetalle, setUsuarioDetalle] = useState(null)

    // Activos
    const [usuarios, setUsuarios] = useState([])
    const [cargandoActivos, setCargandoActivos] = useState(true)
    const [busqueda, setBusqueda] = useState("")
    const [filtroRegion, setFiltroRegion] = useState("")
    const [filtroProvincia, setFiltroProvincia] = useState("")
    const [filtroMinReportes, setFiltroMinReportes] = useState("")
    const [filtroMaxReportes, setFiltroMaxReportes] = useState("")
    const [paginaActivos, setPaginaActivos] = useState(1)
    const [totalPaginasActivos, setTotalPaginasActivos] = useState(1)
    const [totalActivos, setTotalActivos] = useState(0)
    const [stats, setStats] = useState({ baneados: 0 })

    // Eliminados
    const [usuariosEliminados, setUsuariosEliminados] = useState([])
    const [cargandoEliminados, setCargandoEliminados] = useState(false)
    const [busquedaEliminados, setBusquedaEliminados] = useState("")
    const [paginaEliminados, setPaginaEliminados] = useState(1)
    const [totalPaginasEliminados, setTotalPaginasEliminados] = useState(1)
    const [totalEliminados, setTotalEliminados] = useState(0)

    const [modalAccion, setModalAccion] = useState(null)

    const authHeaders = () => ({ headers: { Authorization: `Bearer ${token}` } })

    const cargarActivos = useCallback(async (pag = 1, busq = "", region = "", provincia = "", minR = "", maxR = "") => {
        setCargandoActivos(true)
        try {
            const params = new URLSearchParams({ pagina: pag })
            if (busq) params.append("busqueda", busq)
            if (region) params.append("region", region)
            if (provincia) params.append("provincia", provincia)
            if (minR) params.append("minReportes", minR)
            if (maxR) params.append("maxReportes", maxR)
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/usuarios?${params}`, authHeaders())
            setUsuarios(res.data.usuarios || [])
            setTotalPaginasActivos(res.data.paginas || 1)
            setTotalActivos(res.data.total || 0)
            setStats({ baneados: (res.data.usuarios || []).filter(u => u.baneado).length })
        } catch (error) { console.error(error); setUsuarios([]) }
        setCargandoActivos(false)
    }, [token])

    const cargarEliminados = useCallback(async (pag = 1, busq = "") => {
        setCargandoEliminados(true)
        try {
            const params = new URLSearchParams({ pagina: pag })
            if (busq) params.append("busqueda", busq)
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/usuarios/eliminados?${params}`, authHeaders())
            setUsuariosEliminados(res.data.usuarios || [])
            setTotalPaginasEliminados(res.data.paginas || 1)
            setTotalEliminados(res.data.total || 0)
        } catch (error) { console.error(error); setUsuariosEliminados([]) }
        setCargandoEliminados(false)
    }, [token])

    useEffect(() => { cargarActivos() }, [])
    useEffect(() => { if (pestana === "eliminados") cargarEliminados() }, [pestana])

    // Búsqueda y filtros con debounce
    useEffect(() => {
        const t = setTimeout(() => {
            setPaginaActivos(1)
            cargarActivos(1, busqueda, filtroRegion, filtroProvincia, filtroMinReportes, filtroMaxReportes)
        }, 400)
        return () => clearTimeout(t)
    }, [busqueda, filtroRegion, filtroProvincia, filtroMinReportes, filtroMaxReportes])

    useEffect(() => {
        const t = setTimeout(() => { setPaginaEliminados(1); cargarEliminados(1, busquedaEliminados) }, 400)
        return () => clearTimeout(t)
    }, [busquedaEliminados])

    const limpiarFiltros = () => {
        setBusqueda(""); setFiltroRegion(""); setFiltroProvincia("")
        setFiltroMinReportes(""); setFiltroMaxReportes("")
    }

    const hayFiltros = busqueda || filtroRegion || filtroProvincia || filtroMinReportes || filtroMaxReportes

    const ejecutarAccion = async () => {
        const { usuario, accion } = modalAccion
        try {
            let res
            if (accion === "banear") res = await axios.patch(`${import.meta.env.VITE_BACKEND_URL}/usuarios/${usuario._id}/banear`, {}, authHeaders())
            else if (accion === "desbanear") res = await axios.patch(`${import.meta.env.VITE_BACKEND_URL}/usuarios/${usuario._id}/desbanear`, {}, authHeaders())
            else if (accion === "eliminar") res = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/usuarios/${usuario._id}`, authHeaders())
            else if (accion === "restaurar") res = await axios.patch(`${import.meta.env.VITE_BACKEND_URL}/usuarios/${usuario._id}/restaurar`, {}, authHeaders())

            toast.success(res.data.msg)
            setModalAccion(null)
            if (accion === "restaurar") cargarEliminados(paginaEliminados, busquedaEliminados)
            else cargarActivos(paginaActivos, busqueda, filtroRegion, filtroProvincia, filtroMinReportes, filtroMaxReportes)
        } catch (error) {
            toast.error(error?.response?.data?.msg || "Error al procesar la acción")
        }
    }

    const configModal = {
        banear: { titulo: "¿Suspender usuario?", descripcion: `¿Suspender a ${modalAccion?.usuario?.nombre}?`, textoConfirmar: "Sí, suspender", color: "bg-amber-500 hover:bg-amber-600" },
        desbanear: { titulo: "¿Reactivar usuario?", descripcion: `¿Reactivar a ${modalAccion?.usuario?.nombre}?`, textoConfirmar: "Sí, reactivar", color: "bg-green-600 hover:bg-green-700" },
        eliminar: { titulo: "¿Eliminar usuario?", descripcion: `¿Eliminar a ${modalAccion?.usuario?.nombre}? Sus reportes no serán eliminados.`, textoConfirmar: "Sí, eliminar", color: "bg-red-600 hover:bg-red-700" },
        restaurar: { titulo: "¿Restaurar usuario?", descripcion: `¿Restaurar la cuenta de ${modalAccion?.usuario?.nombre}?`, textoConfirmar: "Sí, restaurar", color: "bg-blue-900 hover:bg-blue-800" }
    }

    const formatearFecha = (f) => f ? new Date(f).toLocaleDateString("es-EC") : "—"
    const inputClass = "rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 py-2 px-3 text-slate-700 text-sm"

    return (
        <div>
            <ToastContainer />
            <div className="flex justify-between items-start flex-wrap gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 mb-1">Gestión de usuarios</h1>
                    <p className="text-slate-500 text-sm">Administra las cuentas de usuarios de la plataforma.</p>
                </div>
                {pestana === "activos" && (
                    <button type="button" onClick={() => setModoGestion(!modoGestion)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${modoGestion ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-slate-200 hover:bg-slate-300 text-slate-600"}`}>
                        {modoGestion ? "⚙️ Gestión activa" : "Gestionar usuarios"}
                    </button>
                )}
            </div>

            {/* Resumen */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow p-4 text-center">
                    <p className="text-3xl font-black text-blue-900">{totalActivos}</p>
                    <p className="text-slate-500 text-sm mt-1">Total activos</p>
                </div>
                <div className="bg-white rounded-xl shadow p-4 text-center">
                    <p className="text-3xl font-black text-amber-600">{stats.baneados}</p>
                    <p className="text-slate-500 text-sm mt-1">Suspendidos</p>
                </div>
                <div className="bg-white rounded-xl shadow p-4 text-center">
                    <p className="text-3xl font-black text-red-600">{totalEliminados}</p>
                    <p className="text-slate-500 text-sm mt-1">Eliminados</p>
                </div>
            </div>

            {/* Pestañas */}
            <div className="flex gap-2 mb-6 border-b border-slate-200">
                <button type="button" onClick={() => setPestana("activos")}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${pestana === "activos" ? "border-blue-900 text-blue-900" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
                    Usuarios activos
                </button>
                <button type="button" onClick={() => setPestana("eliminados")}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${pestana === "eliminados" ? "border-red-600 text-red-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
                    Eliminados {totalEliminados > 0 && <span className="ml-1 bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded-full">{totalEliminados}</span>}
                </button>
            </div>

            {/* PESTAÑA ACTIVOS */}
            {pestana === "activos" && (
                <>
                    {modoGestion && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 text-sm text-amber-800">
                            Modo gestión activo. Puedes suspender, reactivar o eliminar usuarios fila por fila.
                        </div>
                    )}

                    {/* Filtros */}
                    <div className="bg-white rounded-xl shadow p-4 mb-4">
                        <p className="text-sm font-semibold text-slate-600 mb-3">Filtros de búsqueda</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <input type="text" placeholder="Nombre o correo..." className={`${inputClass} col-span-2 md:col-span-1`}
                                value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                            <select className={inputClass} value={filtroRegion}
                                onChange={(e) => { setFiltroRegion(e.target.value); setFiltroProvincia("") }}>
                                <option value="">Todas las regiones</option>
                                {regionesEcuador.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            <select className={inputClass} value={filtroProvincia} disabled={!filtroRegion}
                                onChange={(e) => setFiltroProvincia(e.target.value)}>
                                <option value="">Todas las provincias</option>
                                {(provinciasPorRegion[filtroRegion] || []).map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                            <input type="number" placeholder="Mín. reportes" className={inputClass} min="0"
                                value={filtroMinReportes} onChange={(e) => setFiltroMinReportes(e.target.value)} />
                            <input type="number" placeholder="Máx. reportes" className={inputClass} min="0"
                                value={filtroMaxReportes} onChange={(e) => setFiltroMaxReportes(e.target.value)} />
                        </div>
                        {hayFiltros && (
                            <button type="button" onClick={limpiarFiltros}
                                className="mt-3 text-sm text-slate-500 hover:underline">
                                Limpiar filtros
                            </button>
                        )}
                    </div>

                    {cargandoActivos ? <p className="text-slate-400">Cargando...</p>
                    : usuarios.length === 0 ? (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center text-slate-500">No hay usuarios que coincidan.</div>
                    ) : (
                        <>
                            <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
                                <table className="w-full">
                                    <thead className="bg-slate-800 text-slate-200">
                                        <tr>
                                            <th className="p-3 text-left">Nombre</th>
                                            <th className="p-3 text-left">Correo</th>
                                            <th className="p-3 text-left">Región / Provincia</th>
                                            <th className="p-3 text-center">Reportes</th>
                                            <th className="p-3 text-left">Estado</th>
                                            <th className="p-3 text-left">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {usuarios.map((u, i) => (
                                            <tr key={u._id} className={`${i % 2 === 0 ? "bg-white" : "bg-slate-50"} ${u.baneado ? "opacity-60" : ""}`}>
                                                <td className="p-3">
                                                    <button type="button" onClick={() => setUsuarioDetalle(usuarioDetalle?._id === u._id ? null : u)}
                                                        className="font-semibold text-blue-700 hover:underline text-left">
                                                        {u.nombre}
                                                    </button>
                                                </td>
                                                <td className="p-3 text-sm text-slate-500">{u.email}</td>
                                                <td className="p-3 text-sm">
                                                    {u.region ? (
                                                        <div>
                                                            <div className="text-slate-700">{u.region}</div>
                                                            {u.provincia && <div className="text-slate-400 text-xs">{u.provincia}</div>}
                                                        </div>
                                                    ) : <span className="text-slate-300 italic text-xs">No registrada</span>}
                                                </td>
                                                <td className="p-3 text-center font-bold text-slate-700">{u.totalReportes}</td>
                                                <td className="p-3">
                                                    <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${u.baneado ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"}`}>
                                                        {u.baneado ? "Suspendido" : "Activo"}
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    {modoGestion ? (
                                                        <div className="flex gap-2 flex-wrap">
                                                            {u.baneado ? (
                                                                <button type="button" onClick={() => setModalAccion({ usuario: u, accion: "desbanear" })}
                                                                    className="bg-green-100 hover:bg-green-200 text-green-800 text-xs font-semibold px-3 py-1 rounded-lg">Reactivar</button>
                                                            ) : (
                                                                <button type="button" onClick={() => setModalAccion({ usuario: u, accion: "banear" })}
                                                                    className="bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-semibold px-3 py-1 rounded-lg">Suspender</button>
                                                            )}
                                                            <button type="button" onClick={() => setModalAccion({ usuario: u, accion: "eliminar" })}
                                                                className="bg-red-100 hover:bg-red-200 text-red-800 text-xs font-semibold px-3 py-1 rounded-lg">Eliminar</button>
                                                        </div>
                                                    ) : (
                                                        <button type="button" onClick={() => setUsuarioDetalle(usuarioDetalle?._id === u._id ? null : u)}
                                                            className="text-blue-700 hover:underline text-xs">
                                                            {usuarioDetalle?._id === u._id ? "Ocultar" : "Ver datos"}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Panel de detalle del usuario */}
                            {usuarioDetalle && (
                                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-5">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="font-bold text-blue-900 text-lg">Datos de {usuarioDetalle.nombre}</h3>
                                        <button type="button" onClick={() => setUsuarioDetalle(null)} className="text-slate-400 hover:text-slate-600 text-sm">Cerrar ×</button>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <p className="text-slate-400 text-xs">Nombre</p>
                                            <p className="font-semibold text-slate-700">{usuarioDetalle.nombre}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 text-xs">Correo</p>
                                            <p className="font-semibold text-slate-700">{usuarioDetalle.email}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 text-xs">Teléfono</p>
                                            <p className="font-semibold text-slate-700">{usuarioDetalle.telefono || <span className="text-slate-400 italic font-normal">No registrado</span>}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 text-xs">Región</p>
                                            <p className="font-semibold text-slate-700">{usuarioDetalle.region || <span className="text-slate-400 italic font-normal">No registrada</span>}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 text-xs">Provincia</p>
                                            <p className="font-semibold text-slate-700">{usuarioDetalle.provincia || <span className="text-slate-400 italic font-normal">No registrada</span>}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 text-xs">Registro</p>
                                            <p className="font-semibold text-slate-700">{formatearFecha(usuarioDetalle.createdAt)}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 text-xs">Total reportes</p>
                                            <p className="font-bold text-blue-900 text-lg">{usuarioDetalle.totalReportes}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 text-xs">Reportes validados</p>
                                            <p className="font-bold text-green-600 text-lg">{usuarioDetalle.reportesVerificados}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 text-xs">Estado</p>
                                            <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${usuarioDetalle.baneado ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"}`}>
                                                {usuarioDetalle.baneado ? "Suspendido" : "Activo"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <Paginacion paginaActual={paginaActivos} totalPaginas={totalPaginasActivos}
                                onCambiar={(p) => { setPaginaActivos(p); cargarActivos(p, busqueda, filtroRegion, filtroProvincia, filtroMinReportes, filtroMaxReportes) }} />
                        </>
                    )}
                </>
            )}

            {/* PESTAÑA ELIMINADOS */}
            {pestana === "eliminados" && (
                <>
                    <div className="flex gap-3 mb-4">
                        <input type="text" placeholder="Buscar por nombre o correo..."
                            className={`flex-1 ${inputClass}`}
                            value={busquedaEliminados} onChange={(e) => setBusquedaEliminados(e.target.value)} />
                        {busquedaEliminados && <button type="button" onClick={() => setBusquedaEliminados("")} className="px-3 py-2 text-sm text-slate-500 hover:underline">Limpiar</button>}
                    </div>

                    {cargandoEliminados ? <p className="text-slate-400">Cargando...</p>
                    : usuariosEliminados.length === 0 ? (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center text-slate-500">No hay usuarios eliminados.</div>
                    ) : (
                        <>
                            <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
                                <table className="w-full">
                                    <thead className="bg-slate-800 text-slate-200">
                                        <tr>
                                            <th className="p-3 text-left">Nombre</th>
                                            <th className="p-3 text-left">Correo</th>
                                            <th className="p-3 text-left">Eliminado el</th>
                                            <th className="p-3 text-left">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {usuariosEliminados.map((u, i) => (
                                            <tr key={u._id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                                                <td className="p-3 font-semibold text-slate-700">{u.nombre}</td>
                                                <td className="p-3 text-sm text-slate-500">{u.email}</td>
                                                <td className="p-3 text-sm text-slate-400">{formatearFecha(u.eliminadoEn)}</td>
                                                <td className="p-3">
                                                    <button type="button" onClick={() => setModalAccion({ usuario: u, accion: "restaurar" })}
                                                        className="bg-blue-100 hover:bg-blue-200 text-blue-900 text-xs font-semibold px-3 py-1 rounded-lg">
                                                        Restaurar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <Paginacion paginaActual={paginaEliminados} totalPaginas={totalPaginasEliminados}
                                onCambiar={(p) => { setPaginaEliminados(p); cargarEliminados(p, busquedaEliminados) }} />
                        </>
                    )}
                </>
            )}

            {modalAccion && configModal[modalAccion.accion] && (
                <ModalConfirmar
                    titulo={configModal[modalAccion.accion].titulo}
                    descripcion={configModal[modalAccion.accion].descripcion}
                    textoConfirmar={configModal[modalAccion.accion].textoConfirmar}
                    colorBoton={configModal[modalAccion.accion].color}
                    onConfirmar={ejecutarAccion}
                    onCancelar={() => setModalAccion(null)}
                />
            )}
        </div>
    )
}

export default AdminUsuarios
