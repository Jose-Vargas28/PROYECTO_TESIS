import { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router"
import { ToastContainer } from "react-toastify"
import axios from "axios"
import storeAuth from "../context/storeAuth"
import Badge from "../components/ui/Badge"
import Paginacion from "../components/ui/Paginacion"
import ModalConfirmar from "../components/ui/ModalConfirmar"
import useFetch from "../hooks/useFetch"
import LogoMarca from "../components/ui/LogoMarca"

const formatearFecha = (fecha) => {
    if (!fecha) return "—"
    return new Date(fecha).toLocaleString("es-EC", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

const MisReportes = () => {
    const navigate = useNavigate()
    const { rol, token } = storeAuth()
    const { fetchDataBackend } = useFetch()

    const [reportes, setReportes] = useState([])
    const [busqueda, setBusqueda] = useState("")
    const [cargando, setCargando] = useState(true)
    const [pagina, setPagina] = useState(1)
    const [totalPaginas, setTotalPaginas] = useState(1)
    const [total, setTotal] = useState(0)
    const [modalEliminar, setModalEliminar] = useState(null)

    const cargar = useCallback(async (pag = 1, busq = "") => {
        setCargando(true)
        try {
            const params = new URLSearchParams({ pagina: pag })
            if (busq) params.append("busqueda", busq)
            const res = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/mis-reportes?${params}`,
                { headers: { Authorization: `Bearer ${token}` } }
            )
            setReportes(res.data.reportes || [])
            setTotalPaginas(res.data.paginas || 1)
            setTotal(res.data.total || 0)
        } catch (error) { console.error(error); setReportes([]) }
        setCargando(false)
    }, [token])

    useEffect(() => { cargar() }, [])

    useEffect(() => {
        const t = setTimeout(() => { setPagina(1); cargar(1, busqueda) }, 400)
        return () => clearTimeout(t)
    }, [busqueda])

    const cambiarPagina = (p) => { setPagina(p); cargar(p, busqueda) }

    const handleEliminar = async () => {
        const url = `${import.meta.env.VITE_BACKEND_URL}/reportes/${modalEliminar._id}`
        const headers = { Authorization: `Bearer ${token}` }
        const res = await fetchDataBackend(url, undefined, "DELETE", headers)
        if (res) { setModalEliminar(null); cargar(pagina, busqueda) }
    }

    return (
        <div>
            <ToastContainer />
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Mis reportes</h1>
            <p className="text-slate-500 mb-6">
                {rol === "admin"
                    ? `${total} reporte(s) creados.`
                    : `${total} reporte(s). Puedes editarlos dentro de las primeras 48 horas.`}
            </p>

            <div className="flex gap-3 mb-6">
                <input type="text" placeholder="Buscar por marca, modelo o falla..."
                    className="flex-1 rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 py-2 px-3 text-slate-700"
                    value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                {busqueda && <button type="button" onClick={() => setBusqueda("")} className="px-3 py-2 text-sm text-slate-500 hover:underline">Limpiar</button>}
            </div>

            {cargando ? <p className="text-slate-400">Cargando...</p>
            : reportes.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center text-slate-500">
                    Aún no has creado reportes.{" "}
                    <button type="button" onClick={() => navigate("/dashboard/reportar")} className="text-blue-700 hover:underline font-semibold">Crear uno</button>
                </div>
            ) : (
                <>
                    <div className="space-y-3">
                        {reportes.map((r) => (
                            <div key={r._id} className="bg-white rounded-xl shadow p-4">
                                <div className="flex justify-between items-center gap-4 flex-wrap">
                                    {/* Info principal */}
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <LogoMarca marca={r.vehiculo?.marca} size={48} />
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <span className="font-bold text-slate-800">
                                                    {r.vehiculo?.marca} {r.vehiculo?.modelo} {r.vehiculo?.anio}
                                                </span>
                                                <Badge tipo={r.estado} />
                                            </div>
                                            <p className="text-sm text-slate-600">{r.falla?.nombre}</p>
                                            <p className="text-xs text-slate-400 mt-1">{formatearFecha(r.createdAt)}</p>
                                        </div>
                                    </div>

                                    {/* Acciones */}
                                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                        {r.puedeModificar && r.estado !== "validado" ? (
                                            <>
                                                <button type="button" onClick={() => navigate(`/dashboard/reporte/${r._id}`)}
                                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                                                    👁 Ver
                                                </button>
                                                <button type="button" onClick={() => navigate(`/dashboard/editar/${r._id}`)}
                                                    className="bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                                                    ✏️ Editar
                                                </button>
                                                <button type="button" onClick={() => setModalEliminar(r)}
                                                    className="bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                                                    🗑 Eliminar
                                                </button>
                                            </>
                                        ) : (
                                            <button type="button" onClick={() => navigate(`/dashboard/reporte/${r._id}`)}
                                                className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                                                👁 Ver detalle
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Observación del admin si existe */}
                                {r.observacion && (
                                    <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                                        <p className="text-xs font-semibold text-blue-800 mb-1">↩️ Observación del administrador:</p>
                                        <p className="text-sm text-blue-700">{r.observacion}</p>
                                        <p className="text-xs text-blue-400 mt-1">Edita tu reporte para corregir esto y vuelve a enviarlo.</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <Paginacion paginaActual={pagina} totalPaginas={totalPaginas} onCambiar={cambiarPagina} />
                </>
            )}

            {modalEliminar && (
                <ModalConfirmar
                    titulo="¿Eliminar reporte?"
                    descripcion={`¿Eliminar el reporte del ${modalEliminar.vehiculo?.marca} ${modalEliminar.vehiculo?.modelo}?`}
                    textoConfirmar="Sí, eliminar"
                    onConfirmar={handleEliminar}
                    onCancelar={() => setModalEliminar(null)}
                />
            )}
        </div>
    )
}

export default MisReportes