import { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router"
import { ToastContainer } from "react-toastify"
import axios from "axios"
import storeAuth from "../context/storeAuth"
import Badge from "../components/ui/Badge"
import Paginacion from "../components/ui/Paginacion"
import ModalConfirmar from "../components/ui/ModalConfirmar"
import useFetch from "../hooks/useFetch"

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
        } catch (error) {
            console.error(error)
            setReportes([])
        }
        setCargando(false)
    }, [token])

    useEffect(() => { cargar() }, [])

    useEffect(() => {
        const timer = setTimeout(() => { setPagina(1); cargar(1, busqueda) }, 400)
        return () => clearTimeout(timer)
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
                {rol === "admin" ? `${total} reporte(s) creados.` : `${total} reporte(s). Puedes editarlos o eliminarlos dentro de las primeras 48 horas.`}
            </p>

            <div className="flex gap-3 mb-6">
                <input
                    type="text"
                    placeholder="Buscar por marca, modelo o falla..."
                    className="flex-1 rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 py-2 px-3 text-slate-700"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />
                {busqueda && (
                    <button type="button" onClick={() => setBusqueda("")} className="px-3 py-2 text-sm text-slate-500 hover:underline">
                        Limpiar
                    </button>
                )}
            </div>

            {cargando ? (
                <p className="text-slate-400">Cargando...</p>
            ) : reportes.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center text-slate-500">
                    Aún no has creado reportes.{" "}
                    <button type="button" onClick={() => navigate("/dashboard/reportar")} className="text-blue-700 hover:underline font-semibold">Crear uno</button>
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
                                    <th className="p-3 text-left">Fecha</th>
                                    <th className="p-3 text-left">Estado</th>
                                    <th className="p-3 text-left">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportes.map((r, i) => (
                                    <tr key={r._id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                                        <td className="p-3">{r.vehiculo?.marca}</td>
                                        <td className="p-3">{r.vehiculo?.modelo}</td>
                                        <td className="p-3">{r.vehiculo?.anio}</td>
                                        <td className="p-3">{r.falla?.nombre}</td>
                                        <td className="p-3 text-xs text-slate-500">{formatearFecha(r.createdAt)}</td>
                                        <td className="p-3"><Badge tipo={r.estado} /></td>
                                        <td className="p-3">
                                            <div className="flex gap-2 flex-wrap">
                                                <button type="button" onClick={() => navigate(`/dashboard/reporte/${r._id}`)} className="text-blue-700 hover:underline text-sm">Ver</button>
                                                {r.puedeModificar && r.estado !== "validado" && (
                                                    <>
                                                        <button type="button" onClick={() => navigate(`/dashboard/editar/${r._id}`)} className="text-amber-600 hover:underline text-sm">Editar</button>
                                                        <button type="button" onClick={() => setModalEliminar(r)} className="text-red-600 hover:underline text-sm">Eliminar</button>
                                                    </>
                                                )}
                                                {!r.puedeModificar && r.estado !== "validado" && (
                                                    <span className="text-xs text-slate-400">Sin acciones (48h)</span>
                                                )}
                                                {r.estado === "validado" && (
                                                    <span className="text-xs text-green-600 italic">✅ Validado</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Paginacion paginaActual={pagina} totalPaginas={totalPaginas} onCambiar={cambiarPagina} />
                </>
            )}

            {modalEliminar && (
                <ModalConfirmar
                    titulo="¿Eliminar reporte?"
                    descripcion={`¿Estás seguro de que deseas eliminar el reporte del ${modalEliminar.vehiculo?.marca} ${modalEliminar.vehiculo?.modelo}?`}
                    textoConfirmar="Sí, eliminar"
                    onConfirmar={handleEliminar}
                    onCancelar={() => setModalEliminar(null)}
                />
            )}
        </div>
    )
}

export default MisReportes
