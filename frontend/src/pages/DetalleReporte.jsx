import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router"
import { ToastContainer, toast } from "react-toastify"
import { getReporteDetalle, validarReporte, invalidarReporte } from "../services/reporteService"
import { getYoutubeEmbedUrl } from "../helpers/youtube"
import Badge from "../components/ui/Badge"
import ModalMotivo from "../components/ui/ModalMotivo"
import storeAuth from "../context/storeAuth"

const formatearFechaHora = (fecha) => {
    if (!fecha) return "—"
    return new Date(fecha).toLocaleString("es-EC", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit"
    })
}

const DetalleReporte = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [reporte, setReporte] = useState(null)
    const [cargando, setCargando] = useState(true)
    const [modalInvalidar, setModalInvalidar] = useState(false)
    const { rol } = storeAuth()

    useEffect(() => {
        const cargar = async () => {
            try {
                const res = await getReporteDetalle(id)
                setReporte(res.data)
            } catch (error) {
                console.error(error)
            }
            setCargando(false)
        }
        cargar()
    }, [id])

    const handleValidar = async () => {
        try {
            await validarReporte(id)
            toast.success("Reporte validado")
            cargar()
        } catch (error) {
            toast.error(error?.response?.data?.msg || "Error al validar")
        }
    }

    const handleInvalidar = async (motivo) => {
        try {
            await invalidarReporte(id, motivo)
            toast.success("Validación retirada")
            setModalInvalidar(false)
            cargar()
        } catch (error) {
            toast.error(error?.response?.data?.msg || "Error")
        }
    }

    if (cargando) return <p className="text-slate-400">Cargando...</p>
    if (!reporte) return <p className="text-slate-500">Reporte no encontrado.</p>

    const enlacesYoutube = reporte.enlaces?.filter((e) => e.tipo === "youtube") || []
    const enlacesExternos = reporte.enlaces?.filter((e) => e.tipo === "externo") || []

    return (
        <div className="max-w-4xl mx-auto">
            <button onClick={() => navigate(-1)} className="text-blue-700 hover:underline mb-4 text-sm">
                ← Volver
            </button>

            {/* Datos principales */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">
                            {reporte.vehiculo?.marca} {reporte.vehiculo?.modelo}
                        </h1>
                        <p className="text-slate-500">Año {reporte.vehiculo?.anio}</p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                            {reporte.vehiculo?.tipo && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">
                                    {reporte.vehiculo.tipo}
                                </span>
                            )}
                            {reporte.vehiculo?.combustible && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 capitalize">
                                    {reporte.vehiculo.combustible}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Badge tipo={reporte.gravedad} />
                        <Badge tipo={reporte.validado ? "validado" : "pendiente"} />
                    </div>
                </div>

                <div className="mt-4 border-t pt-4">
                    <p className="text-sm text-slate-400 mb-1">Tipo de falla</p>
                    <p className="text-slate-700 font-semibold mb-4">{reporte.falla?.nombre}</p>

                    {reporte.descripcion && (
                        <>
                            <p className="text-sm text-slate-400 mb-1">Descripción</p>
                            <p className="text-slate-700">{reporte.descripcion}</p>
                        </>
                    )}

                    {reporte.usuario && (
                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-1">
                            <p className="text-xs text-slate-400">
                                <span className="font-semibold">Reportado por:</span> {reporte.usuario.nombre} ({reporte.usuario.email})
                            </p>
                            {(reporte.usuario.region || reporte.usuario.provincia) && (
                                <p className="text-xs text-slate-400">
                                    <span className="font-semibold">Ubicación:</span>{" "}
                                    {[reporte.usuario.region, reporte.usuario.provincia].filter(Boolean).join(", ")}
                                </p>
                            )}
                            <p className="text-xs text-slate-400">
                                <span className="font-semibold">Fecha de reporte:</span> {formatearFechaHora(reporte.createdAt)}
                            </p>
                            {reporte.validado && reporte.validadoEn && (
                                <p className="text-xs text-green-600">
                                    <span className="font-semibold">Validado el:</span> {formatearFechaHora(reporte.validadoEn)}
                                    {reporte.validadoPor && ` por ${reporte.validadoPor.nombre}`}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Acciones del admin — dentro de la tarjeta principal */}
                    {rol === "admin" && (
                        <div className="mt-4 pt-4 border-t border-slate-100 flex gap-3 flex-wrap items-center">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Acciones de administrador</span>
                            {!reporte.validado ? (
                                <button
                                    type="button"
                                    onClick={handleValidar}
                                    className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                                >
                                    ✅ Validar reporte
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setModalInvalidar(true)}
                                    className="bg-amber-500 hover:bg-amber-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                                >
                                    ⚠️ Retirar validación
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Imágenes */}
            {reporte.imagenes?.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <h2 className="text-xl font-bold text-slate-700 mb-4">Fotos de la falla</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {reporte.imagenes.map((img) => (
                            <a key={img._id} href={img.url} target="_blank" rel="noreferrer">
                                <img src={img.url} alt={img.nombre} className="w-full h-40 object-cover rounded-lg hover:opacity-90 transition-opacity" />
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Documentos */}
            {reporte.documentos?.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <h2 className="text-xl font-bold text-slate-700 mb-4">Documentos de respaldo</h2>
                    <ul className="space-y-2">
                        {reporte.documentos.map((doc) => (
                            <li key={doc._id}>
                                <a href={doc.url} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline flex items-center gap-2">
                                    📄 {doc.nombre || "Ver documento"}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Videos de YouTube */}
            {enlacesYoutube.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <h2 className="text-xl font-bold text-slate-700 mb-4">Videos de referencia</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {enlacesYoutube.map((e) => {
                            const embed = getYoutubeEmbedUrl(e.url)
                            return embed ? (
                                <div key={e._id}>
                                    <div className="aspect-video">
                                        <iframe
                                            src={embed}
                                            title={e.titulo || "Video"}
                                            className="w-full h-full rounded-lg"
                                            allowFullScreen
                                        ></iframe>
                                    </div>
                                    {e.titulo && <p className="text-sm text-slate-500 mt-2">{e.titulo}</p>}
                                </div>
                            ) : null
                        })}
                    </div>
                </div>
            )}

            {/* Enlaces externos */}
            {enlacesExternos.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <h2 className="text-xl font-bold text-slate-700 mb-4">Fuentes externas</h2>
                    <ul className="space-y-2">
                        {enlacesExternos.map((e) => (
                            <li key={e._id}>
                                <a href={e.url} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline flex items-center gap-2">
                                    🔗 {e.titulo || e.url}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        {modalInvalidar && (
                <ModalMotivo
                    titulo="Retirar validación"
                    descripcion="El usuario recibirá un correo explicando el motivo."
                    colorBoton="bg-amber-500 hover:bg-amber-600"
                    onConfirmar={handleInvalidar}
                    onCancelar={() => setModalInvalidar(false)}
                />
            )}
            <ToastContainer />
        </div>
    )
}

export default DetalleReporte
