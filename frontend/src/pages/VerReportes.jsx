import { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router"
import { ToastContainer } from "react-toastify"
import axios from "axios"
import storeAuth from "../context/storeAuth"
import Badge from "../components/ui/Badge"
import Paginacion from "../components/ui/Paginacion"
import ModalMotivo from "../components/ui/ModalMotivo"
import ModalConfirmar from "../components/ui/ModalConfirmar"
import storeProfile from "../context/storeProfile"
import useFetch from "../hooks/useFetch"

const VerReportes = () => {
    const navigate = useNavigate()
    const { rol, token } = storeAuth()
    const { user } = storeProfile()
    const { fetchDataBackend } = useFetch()

    const [reportes, setReportes] = useState([])
    const [busqueda, setBusqueda] = useState("")
    const [gravedad, setGravedad] = useState("")
    const [cargando, setCargando] = useState(true)
    const [pagina, setPagina] = useState(1)
    const [totalPaginas, setTotalPaginas] = useState(1)
    const [total, setTotal] = useState(0)
    const [modoEdicion, setModoEdicion] = useState(false)
    const [modalEliminar, setModalEliminar] = useState(null)
    const [modalEliminarPropio, setModalEliminarPropio] = useState(null)

    const cargar = useCallback(async (pag = pagina, busq = busqueda, grav = gravedad) => {
        setCargando(true)
        try {
            const params = new URLSearchParams({ pagina: pag })
            if (busq) params.append("busqueda", busq)
            if (grav) params.append("gravedad", grav)
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/reportes?${params}`)
            setReportes(res.data.reportes || [])
            setTotalPaginas(res.data.paginas || 1)
            setTotal(res.data.total || 0)
        } catch (error) {
            console.error(error)
            setReportes([])
        }
        setCargando(false)
    }, [])

    useEffect(() => { cargar(1, busqueda, gravedad) }, [])

    // Búsqueda con debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setPagina(1)
            cargar(1, busqueda, gravedad)
        }, 400)
        return () => clearTimeout(timer)
    }, [busqueda, gravedad])

    const cambiarPagina = (nuevaPagina) => {
        setPagina(nuevaPagina)
        cargar(nuevaPagina, busqueda, gravedad)
    }

    // Admin eliminando su propio reporte: sin motivo ni correo
    const handleEliminarPropio = async () => {
        const headers = { Authorization: `Bearer ${token}` }
        const url = `${import.meta.env.VITE_BACKEND_URL}/reportes/${modalEliminarPropio._id}`
        const res = await fetchDataBackend(url, undefined, "DELETE", headers)
        if (res) { setModalEliminarPropio(null); cargar(pagina, busqueda, gravedad) }
    }

    const handleEliminar = async (motivo) => {
        const headers = { Authorization: `Bearer ${token}` }
        const url = `${import.meta.env.VITE_BACKEND_URL}/reportes/${modalEliminar._id}`
        const res = await fetchDataBackend(url, { motivo }, "DELETE", headers)
        if (res) { setModalEliminar(null); cargar(pagina, busqueda, gravedad) }
    }

    return (
        <div>
            <ToastContainer />
            <div className="flex justify-between items-start flex-wrap gap-4 mb-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 mb-1">Reportes validados</h1>
                    <p className="text-slate-500 text-sm">{total} reporte(s) encontrado(s)</p>
                </div>
                {rol === "admin" && (
                    <button type="button" onClick={() => setModoEdicion(!modoEdicion)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${modoEdicion ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-slate-200 hover:bg-slate-300 text-slate-600"}`}>
                        {modoEdicion ? "✏️ Modo edición activo" : "Gestionar reportes"}
                    </button>
                )}
            </div>

            {modoEdicion && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 text-sm text-amber-800">
                    Modo edición activo. Úsalo solo cuando sea necesario.
                </div>
            )}

            {/* Filtros */}
            <div className="flex flex-wrap gap-3 mb-6">
                <input
                    type="text"
                    placeholder="Buscar por marca, modelo o falla..."
                    className="flex-1 min-w-48 rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 py-2 px-3 text-slate-700"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />
                <select
                    className="rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none py-2 px-3 text-slate-700"
                    value={gravedad}
                    onChange={(e) => setGravedad(e.target.value)}
                >
                    <option value="">Todas las gravedades</option>
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                </select>
                {(busqueda || gravedad) && (
                    <button type="button" onClick={() => { setBusqueda(""); setGravedad("") }}
                        className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 hover:underline">
                        Limpiar filtros
                    </button>
                )}
            </div>

            {cargando ? (
                <p className="text-slate-400">Cargando reportes...</p>
            ) : reportes.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center text-slate-500">
                    No hay reportes validados que coincidan.
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
                        <table className="w-full">
                            <thead className="bg-slate-800 text-slate-200">
                                <tr>
                                    <th className="p-3 text-left">Marca</th>
                                    <th className="p-3 text-left">Modelo</th>
                                    <th className="p-3 text-left">Año</th>
                                    <th className="p-3 text-left">Falla</th>
                                    <th className="p-3 text-left">Tipo</th>
                                    <th className="p-3 text-left">Combustible</th>
                                    <th className="p-3 text-left">Gravedad</th>
                                    <th className="p-3 text-left">Reportado por</th>
                                    <th className="p-3 text-left">Región / Provincia</th>
                                    <th className="p-3 text-left">{modoEdicion ? "Acciones" : "Detalle"}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportes.map((r, i) => (
                                    <tr key={r._id} className={`${i % 2 === 0 ? "bg-white" : "bg-slate-50"} ${modoEdicion ? "border-l-4 border-amber-400" : ""}`}>
                                        <td className="p-3">{r.vehiculo?.marca}</td>
                                        <td className="p-3">{r.vehiculo?.modelo}</td>
                                        <td className="p-3">{r.vehiculo?.anio}</td>
                                        <td className="p-3">{r.falla?.nombre}</td>
                                        <td className="p-3 text-sm text-slate-600 capitalize">{r.vehiculo?.tipo || "—"}</td>
                                        <td className="p-3 text-sm text-slate-600 capitalize">{r.vehiculo?.combustible || "—"}</td>
                                        <td className="p-3"><Badge tipo={r.gravedad} /></td>
                                        <td className="p-3 text-sm">
                                            <div className="font-semibold text-slate-700">{r.usuario?.nombre}</div>
                                            <div className="text-slate-400 text-xs">{r.usuario?.email}</div>
                                        </td>
                                        <td className="p-3 text-sm">
                                            {r.usuario?.region ? (
                                                <div>
                                                    <div className="text-slate-700">{r.usuario.region}</div>
                                                    {r.usuario.provincia && <div className="text-slate-400 text-xs">{r.usuario.provincia}</div>}
                                                </div>
                                            ) : (
                                                <span className="text-slate-300 italic text-xs">No registrada</span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            {modoEdicion ? (
                                                <div className="flex gap-2 flex-wrap">
                                                    <button type="button" onClick={() => navigate(`/dashboard/reporte/${r._id}`)} className="text-blue-700 hover:underline text-sm">Ver</button>
                                                    <button type="button" onClick={() => navigate(`/dashboard/editar/${r._id}`)} className="text-amber-600 hover:underline text-sm">Editar</button>
                                                    <button type="button"
                                                        onClick={() => {
                                                            if (r.usuario?._id === user?._id || r.usuario?.email === user?.email) {
                                                                setModalEliminarPropio(r)
                                                            } else {
                                                                setModalEliminar(r)
                                                            }
                                                        }}
                                                        className="text-red-500 hover:underline text-sm">Eliminar</button>
                                                </div>
                                            ) : (
                                                <button type="button" onClick={() => navigate(`/dashboard/reporte/${r._id}`)} className="text-blue-700 hover:underline font-semibold text-sm">Ver detalle</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Paginacion paginaActual={pagina} totalPaginas={totalPaginas} onCambiar={cambiarPagina} />
                </>
            )}

            {modalEliminarPropio && (
                <ModalConfirmar
                    titulo="¿Eliminar este reporte?"
                    descripcion="¿Estás seguro de que deseas eliminar este reporte? Se moverá a la papelera."
                    textoConfirmar="Sí, eliminar"
                    onConfirmar={handleEliminarPropio}
                    onCancelar={() => setModalEliminarPropio(null)}
                />
            )}
            {modalEliminar && (
                <ModalMotivo
                    titulo="Eliminar reporte"
                    descripcion={`Vas a eliminar el reporte de ${modalEliminar.usuario?.nombre}. El usuario recibirá un correo con el motivo.`}
                    onConfirmar={handleEliminar}
                    onCancelar={() => setModalEliminar(null)}
                />
            )}
        </div>
    )
}

export default VerReportes
