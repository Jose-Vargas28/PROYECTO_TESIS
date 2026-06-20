import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { useParams, useNavigate } from "react-router"
import { ToastContainer, toast } from "react-toastify"
import {
    getReporteDetalle,
    subirImagenes,
    subirDocumentos,
    agregarEnlace,
    eliminarImagen,
    eliminarDocumento,
    eliminarEnlace,
} from "../services/reporteService"
import useFetch from "../hooks/useFetch"
import { esYoutube } from "../helpers/youtube"

const EditarReporte = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { register, handleSubmit, reset } = useForm()
    const { fetchDataBackend } = useFetch()
    const [cargando, setCargando] = useState(true)
    const [reporte, setReporte] = useState(null)

    // Estados para nuevas evidencias
    const [imagenes, setImagenes] = useState([])
    const [documentos, setDocumentos] = useState([])
    const [enlaceUrl, setEnlaceUrl] = useState("")
    const [enlaceTitulo, setEnlaceTitulo] = useState("")
    const [subiendoImagenes, setSubiendoImagenes] = useState(false)
    const [subiendoDocumentos, setSubiendoDocumentos] = useState(false)

    const cargar = async () => {
        try {
            const res = await getReporteDetalle(id)
            setReporte(res.data)
            reset({
                gravedad: res.data.gravedad,
                descripcion: res.data.descripcion,
            })
        } catch (error) {
            console.error(error)
        }
        setCargando(false)
    }

    useEffect(() => {
        cargar()
    }, [id])

    // ---- Guardar datos de texto ----
    const onSubmit = async (data) => {
        const payload = { descripcion: data.descripcion, gravedad: data.gravedad }
        const storedUser = JSON.parse(localStorage.getItem("auth-token"))
        const url = `${import.meta.env.VITE_BACKEND_URL}/reportes/${id}`
        const headers = { Authorization: `Bearer ${storedUser?.state?.token}` }
        const res = await fetchDataBackend(url, payload, "PUT", headers)
        if (res) {
            setTimeout(() => navigate("/dashboard/mis-reportes"), 1500)
        }
    }

    // ---- Subir imágenes ----
    const handleSubirImagenes = async () => {
        if (imagenes.length === 0) return toast.error("Selecciona al menos una imagen")
        setSubiendoImagenes(true)
        const formData = new FormData()
        imagenes.forEach((img) => formData.append("imagenes", img))
        try {
            await subirImagenes(id, formData)
            toast.success("Imágenes subidas")
            setImagenes([])
            cargar()
        } catch (error) {
            toast.error(error?.response?.data?.msg || "Error al subir imágenes")
        }
        setSubiendoImagenes(false)
    }

    // ---- Subir documentos ----
    const handleSubirDocumentos = async () => {
        if (documentos.length === 0) return toast.error("Selecciona al menos un documento")
        setSubiendoDocumentos(true)
        const formData = new FormData()
        documentos.forEach((doc) => formData.append("documentos", doc))
        try {
            await subirDocumentos(id, formData)
            toast.success("Documentos subidos")
            setDocumentos([])
            cargar()
        } catch (error) {
            toast.error(error?.response?.data?.msg || "Error al subir documentos")
        }
        setSubiendoDocumentos(false)
    }

    // ---- Agregar enlace ----
    const handleAgregarEnlace = async () => {
        if (!enlaceUrl) return toast.error("Ingresa una URL")
        const tipo = esYoutube(enlaceUrl) ? "youtube" : "externo"
        try {
            await agregarEnlace(id, { url: enlaceUrl, tipo, titulo: enlaceTitulo })
            toast.success("Enlace agregado")
            setEnlaceUrl("")
            setEnlaceTitulo("")
            cargar()
        } catch (error) {
            toast.error(error?.response?.data?.msg || "Error al agregar enlace")
        }
    }

    // ---- Eliminar evidencias ----
    const handleEliminarImagen = async (imagenId) => {
        if (!confirm("¿Eliminar esta imagen?")) return
        try {
            await eliminarImagen(id, imagenId)
            toast.success("Imagen eliminada")
            cargar()
        } catch (error) {
            toast.error(error?.response?.data?.msg || "Error")
        }
    }

    const handleEliminarDocumento = async (docId) => {
        if (!confirm("¿Eliminar este documento?")) return
        try {
            await eliminarDocumento(id, docId)
            toast.success("Documento eliminado")
            cargar()
        } catch (error) {
            toast.error(error?.response?.data?.msg || "Error")
        }
    }

    const handleEliminarEnlace = async (enlaceId) => {
        if (!confirm("¿Eliminar este enlace?")) return
        try {
            await eliminarEnlace(id, enlaceId)
            toast.success("Enlace eliminado")
            cargar()
        } catch (error) {
            toast.error(error?.response?.data?.msg || "Error")
        }
    }

    const inputClass = "block w-full rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 py-2 px-3 text-slate-700"
    const labelClass = "mb-2 block text-sm font-semibold text-slate-700"

    if (cargando) return <p className="text-slate-400">Cargando...</p>

    return (
        <div className="max-w-3xl mx-auto">
            <ToastContainer />
            <button onClick={() => navigate(-1)} className="text-blue-700 hover:underline mb-4 text-sm">
                ← Volver
            </button>
            <h1 className="text-3xl font-bold text-slate-800 mb-6">Editar reporte</h1>

            {/* ---- Datos del reporte ---- */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 className="text-lg font-bold text-slate-700 mb-4">Datos del reporte</h2>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-slate-500">Vehículo y falla (no editables)</p>
                    <p className="font-semibold text-slate-700">
                        {reporte?.vehiculo?.marca} {reporte?.vehiculo?.modelo} {reporte?.vehiculo?.anio} — {reporte?.falla?.nombre}
                    </p>
                </div>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="mt-4">
                        <label className={labelClass}>Nivel de gravedad</label>
                        <select className={inputClass} {...register("gravedad")}>
                            <option value="baja">Baja</option>
                            <option value="media">Media</option>
                            <option value="alta">Alta</option>
                        </select>
                    </div>

                    <div className="mt-4">
                        <label className={labelClass}>Descripción</label>
                        <textarea className={`${inputClass} h-28 resize-none`} {...register("descripcion")} />
                    </div>

                    <button type="submit" className="mt-6 w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2.5 rounded-lg transition-colors">
                        Guardar cambios
                    </button>
                </form>
            </div>

            {/* ---- Imágenes actuales ---- */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 className="text-lg font-bold text-slate-700 mb-4">Fotos de la falla</h2>

                {reporte?.imagenes?.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                        {reporte.imagenes.map((img) => (
                            <div key={img._id} className="relative group">
                                <img src={img.url} alt={img.nombre} className="w-full h-32 object-cover rounded-lg" />
                                <button
                                    type="button"
                                    onClick={() => handleEliminarImagen(img._id)}
                                    className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded"
                                >
                                    Quitar
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-400 text-sm mb-4">No hay imágenes aún.</p>
                )}

                <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => setImagenes(Array.from(e.target.files))}
                    className={inputClass}
                />
                {imagenes.length > 0 && <p className="text-sm text-slate-500 mt-2">{imagenes.length} nueva(s) seleccionada(s)</p>}
                <button type="button" onClick={handleSubirImagenes} disabled={subiendoImagenes} className="mt-3 bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50">
                    {subiendoImagenes ? "Subiendo..." : "Subir imágenes"}
                </button>
            </div>

            {/* ---- Documentos actuales ---- */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 className="text-lg font-bold text-slate-700 mb-4">Documentos</h2>

                {reporte?.documentos?.length > 0 ? (
                    <ul className="space-y-2 mb-4">
                        {reporte.documentos.map((doc) => (
                            <li key={doc._id} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg">
                                <a href={doc.url} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline text-sm">
                                    📄 {doc.nombre || "Documento"}
                                </a>
                                <button
                                    type="button"
                                    onClick={() => handleEliminarDocumento(doc._id)}
                                    className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded"
                                >
                                    Quitar
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-slate-400 text-sm mb-4">No hay documentos aún.</p>
                )}

                <input
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={(e) => setDocumentos(Array.from(e.target.files))}
                    className={inputClass}
                />
                {documentos.length > 0 && <p className="text-sm text-slate-500 mt-2">{documentos.length} nuevo(s) seleccionado(s)</p>}
                <button type="button" onClick={handleSubirDocumentos} disabled={subiendoDocumentos} className="mt-3 bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50">
                    {subiendoDocumentos ? "Subiendo..." : "Subir documentos"}
                </button>
            </div>

            {/* ---- Enlaces actuales ---- */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 className="text-lg font-bold text-slate-700 mb-4">Enlaces de referencia</h2>

                {reporte?.enlaces?.length > 0 ? (
                    <ul className="space-y-2 mb-4">
                        {reporte.enlaces.map((e) => (
                            <li key={e._id} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg">
                                <span className="text-sm flex items-center gap-2">
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${e.tipo === "youtube" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
                                        {e.tipo === "youtube" ? "YouTube" : "Externo"}
                                    </span>
                                    <a href={e.url} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">
                                        {e.titulo || e.url}
                                    </a>
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleEliminarEnlace(e._id)}
                                    className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded"
                                >
                                    Quitar
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-slate-400 text-sm mb-4">No hay enlaces aún.</p>
                )}

                <div className="space-y-3">
                    <input
                        className={inputClass}
                        placeholder="https://..."
                        value={enlaceUrl}
                        onChange={(e) => setEnlaceUrl(e.target.value)}
                    />
                    <input
                        className={inputClass}
                        placeholder="Título o descripción (opcional)"
                        value={enlaceTitulo}
                        onChange={(e) => setEnlaceTitulo(e.target.value)}
                    />
                    <button type="button" onClick={handleAgregarEnlace} className="bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                        Agregar enlace
                    </button>
                </div>
            </div>
        </div>
    )
}

export default EditarReporte
