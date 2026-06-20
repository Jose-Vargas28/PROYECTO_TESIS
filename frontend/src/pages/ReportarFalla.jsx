import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import { ToastContainer, toast } from "react-toastify"
import {
    crearReporte,
    subirImagenes,
    subirDocumentos,
    agregarEnlace,
} from "../services/reporteService"
import {
    getVehiculos, crearVehiculo,
    getFallas, crearFalla,
} from "../services/catalogoService"
import { esYoutube } from "../helpers/youtube"
import SeccionEvidencia from "../components/ui/SeccionEvidencia"
import { tiposCombustible, tiposVehiculo, aniosVehiculo } from "../config/ecuador"

const ReportarFalla = () => {
    const navigate = useNavigate()

    // Catálogos desde la BD
    const [vehiculos, setVehiculos] = useState([])
    const [fallas, setFallas] = useState([])

    // Selección del vehículo
    const [marca, setMarca] = useState("")
    const [modelo, setModelo] = useState("")
    const [anio, setAnio] = useState("")
    const [fallaId, setFallaId] = useState("")
    const [gravedad, setGravedad] = useState("media")
    const [descripcion, setDescripcion] = useState("")

    // Modales de creación
    const [nuevoVehiculo, setNuevoVehiculo] = useState({ marca: "", modelo: "", anio: "", tipo: "automóvil", combustible: "gasolina" })
    const [anioManual, setAnioManual] = useState(false)
    const [nuevaFalla, setNuevaFalla] = useState({ nombre: "", descripcion: "", gravedad: "media" })
    const [mostrarFormVehiculo, setMostrarFormVehiculo] = useState(false)
    const [mostrarFormFalla, setMostrarFormFalla] = useState(false)

    // Flujo
    const [reporteId, setReporteId] = useState(null)
    const [paso, setPaso] = useState(1)

    // Evidencias
    const [imagenes, setImagenes] = useState([])
    const [documentos, setDocumentos] = useState([])
    const [enlaceUrl, setEnlaceUrl] = useState("")
    const [enlaceTitulo, setEnlaceTitulo] = useState("")
    const [enlacesAgregados, setEnlacesAgregados] = useState([])
    const [subiendoImagenes, setSubiendoImagenes] = useState(false)
    const [subiendoDocumentos, setSubiendoDocumentos] = useState(false)

    const cargarCatalogos = async () => {
        try {
            const [v, f] = await Promise.all([getVehiculos(), getFallas()])
            setVehiculos(v.data.vehiculos || v.data || [])
            setFallas(f.data.fallas || f.data || [])
        } catch (error) {
            console.error(error)
        }
    }

    useEffect(() => {
        cargarCatalogos()
    }, [])

    // Derivados para los combos dependientes
    const marcas = [...new Set(vehiculos.map(v => v.marca))].sort()
    const modelosDeMarca = [...new Set(vehiculos.filter(v => v.marca === marca).map(v => v.modelo))].sort()
    const aniosDeModelo = vehiculos
        .filter(v => v.marca === marca && v.modelo === modelo)
        .map(v => ({ id: v._id, anio: v.anio, combustible: v.combustible, tipo: v.tipo }))
        .sort((a, b) => b.anio - a.anio)

    // El vehículo seleccionado (su _id) se obtiene del año elegido
    const vehiculoIdSeleccionado = anio // aquí 'anio' guarda el _id del vehículo

    const inputClass = "block w-full rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 py-2 px-3 text-slate-700"
    const labelClass = "mb-2 block text-sm font-semibold text-slate-700"

    // ---- Crear vehículo nuevo ----
    const handleCrearVehiculo = async () => {
        if (!nuevoVehiculo.marca || !nuevoVehiculo.modelo || !nuevoVehiculo.anio) {
            return toast.error("Completa marca, modelo y año")
        }
        try {
            const res = await crearVehiculo({
                marca: nuevoVehiculo.marca,
                modelo: nuevoVehiculo.modelo,
                anio: Number(nuevoVehiculo.anio)
            })
            toast.success(res.data.msg)
            await cargarCatalogos()
            // Seleccionar automáticamente el recién creado
            setMarca(res.data.vehiculo.marca)
            setModelo(res.data.vehiculo.modelo)
            setAnio(res.data.vehiculo._id)
            setNuevoVehiculo({ marca: "", modelo: "", anio: "" })
            setMostrarFormVehiculo(false)
        } catch (error) {
            toast.error(error?.response?.data?.msg || "Error al crear vehículo")
        }
    }

    // ---- Crear falla nueva ----
    const handleCrearFalla = async () => {
        if (!nuevaFalla.nombre) return toast.error("Ingresa el nombre de la falla")
        try {
            const res = await crearFalla(nuevaFalla)
            toast.success(res.data.msg)
            await cargarCatalogos()
            setFallaId(res.data.falla._id)
            setNuevaFalla({ nombre: "", descripcion: "" })
            setMostrarFormFalla(false)
        } catch (error) {
            toast.error(error?.response?.data?.msg || "Error al crear falla")
        }
    }

    // ---- Crear el reporte ----
    const handleCrearReporte = async () => {
        if (!vehiculoIdSeleccionado) return toast.error("Selecciona el vehículo completo (marca, modelo y año)")
        if (!fallaId) return toast.error("Selecciona una falla")
        try {
            const res = await crearReporte({
                vehiculo: vehiculoIdSeleccionado,
                falla: fallaId,
                descripcion,
                gravedad
            })
            toast.success("Reporte creado. Ahora puedes agregar evidencias (opcional).")
            if (res?.data?.reporteId) setReporteId(res.data.reporteId)
            setPaso(2)
        } catch (error) {
            toast.error(error?.response?.data?.msg || "Error al crear el reporte")
        }
    }

    // ---- Evidencias ----
    const handleSubirImagenes = async () => {
        if (imagenes.length === 0) return toast.error("Selecciona al menos una imagen")
        setSubiendoImagenes(true)
        const formData = new FormData()
        imagenes.forEach((img) => formData.append("imagenes", img))
        try {
            await subirImagenes(reporteId, formData)
            toast.success("Imágenes subidas correctamente")
            setImagenes([])
        } catch (error) {
            toast.error(error?.response?.data?.msg || "Error al subir imágenes")
        }
        setSubiendoImagenes(false)
    }

    const handleSubirDocumentos = async () => {
        if (documentos.length === 0) return toast.error("Selecciona al menos un documento")
        setSubiendoDocumentos(true)
        const formData = new FormData()
        documentos.forEach((doc) => formData.append("documentos", doc))
        try {
            await subirDocumentos(reporteId, formData)
            toast.success("Documentos subidos correctamente")
            setDocumentos([])
        } catch (error) {
            toast.error(error?.response?.data?.msg || "Error al subir documentos")
        }
        setSubiendoDocumentos(false)
    }

    const handleAgregarEnlace = async () => {
        if (!enlaceUrl) return toast.error("Ingresa una URL")
        const tipo = esYoutube(enlaceUrl) ? "youtube" : "externo"
        try {
            await agregarEnlace(reporteId, { url: enlaceUrl, tipo, titulo: enlaceTitulo })
            setEnlacesAgregados([...enlacesAgregados, { url: enlaceUrl, tipo, titulo: enlaceTitulo }])
            toast.success("Enlace agregado")
            setEnlaceUrl(""); setEnlaceTitulo("")
        } catch (error) {
            toast.error(error?.response?.data?.msg || "Error al agregar enlace")
        }
    }

    return (
        <div className="max-w-3xl mx-auto">
            <ToastContainer />
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Reportar una falla</h1>
            <p className="text-slate-500 mb-8">
                Selecciona el vehículo y la falla. Si no están en la lista, puedes registrarlos.
            </p>

            {/* Indicador de pasos */}
            <div className="flex items-center gap-4 mb-8">
                <div className={`flex items-center gap-2 ${paso >= 1 ? "text-blue-900" : "text-slate-400"}`}>
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${paso >= 1 ? "bg-blue-900 text-white" : "bg-slate-200"}`}>1</span>
                    <span className="font-semibold">Datos</span>
                </div>
                <div className="flex-1 h-0.5 bg-slate-200"></div>
                <div className={`flex items-center gap-2 ${paso >= 2 ? "text-blue-900" : "text-slate-400"}`}>
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${paso >= 2 ? "bg-blue-900 text-white" : "bg-slate-200"}`}>2</span>
                    <span className="font-semibold">Evidencias</span>
                </div>
            </div>

            {/* PASO 1 */}
            {paso === 1 && (
                <div className="bg-white rounded-xl shadow-lg p-6 space-y-5">

                    {/* Selección de vehículo */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-bold text-slate-700">Vehículo</h3>
                            <button
                                onClick={() => setMostrarFormVehiculo(!mostrarFormVehiculo)}
                                className="text-sm text-blue-700 hover:underline"
                            >
                                {mostrarFormVehiculo ? "Cancelar" : "+ Registrar nuevo vehículo"}
                            </button>
                        </div>

                        {mostrarFormVehiculo ? (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                                <input className={inputClass} placeholder="Marca (Ej. Chevrolet)" value={nuevoVehiculo.marca} onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, marca: e.target.value })} />
                                <input className={inputClass} placeholder="Modelo (Ej. Aveo)" value={nuevoVehiculo.modelo} onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, modelo: e.target.value })} />
                                {!anioManual ? (
                                    <div className="flex gap-2">
                                        <select className={inputClass} value={nuevoVehiculo.anio}
                                            onChange={(e) => {
                                                if (e.target.value === "otro") {
                                                    setAnioManual(true)
                                                    setNuevoVehiculo({ ...nuevoVehiculo, anio: "" })
                                                } else {
                                                    setNuevoVehiculo({ ...nuevoVehiculo, anio: e.target.value })
                                                }
                                            }}>
                                            <option value="">Seleccionar año</option>
                                            {aniosVehiculo.map(a => <option key={a} value={a}>{a}</option>)}
                                            <option value="otro">Otro año...</option>
                                        </select>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <input type="number" className={inputClass} placeholder="Ej. 2027"
                                            value={nuevoVehiculo.anio}
                                            onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, anio: e.target.value })}
                                            min="1900" max="2100" />
                                        <button type="button" onClick={() => { setAnioManual(false); setNuevoVehiculo({ ...nuevoVehiculo, anio: "" }) }}
                                            className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 border border-slate-300 rounded-md whitespace-nowrap">
                                            ← Volver
                                        </button>
                                    </div>
                                )}
                                <select className={inputClass} value={nuevoVehiculo.tipo} onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, tipo: e.target.value })}>
                                    {tiposVehiculo.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                                <select className={inputClass} value={nuevoVehiculo.combustible} onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, combustible: e.target.value })}>
                                    {tiposCombustible.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                                <button onClick={handleCrearVehiculo} className="bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2 px-4 rounded-lg w-full">
                                    Registrar vehículo
                                </button>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-3 gap-3">
                                {/* Marca */}
                                <div>
                                    <label className={labelClass}>Marca</label>
                                    <select className={inputClass} value={marca} onChange={(e) => { setMarca(e.target.value); setModelo(""); setAnio("") }}>
                                        <option value="">Seleccionar</option>
                                        {marcas.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                                {/* Modelo */}
                                <div>
                                    <label className={labelClass}>Modelo</label>
                                    <select className={inputClass} value={modelo} onChange={(e) => { setModelo(e.target.value); setAnio("") }} disabled={!marca}>
                                        <option value="">Seleccionar</option>
                                        {modelosDeMarca.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                                {/* Año */}
                                <div>
                                    <label className={labelClass}>Año</label>
                                    <select className={inputClass} value={anio} onChange={(e) => setAnio(e.target.value)} disabled={!modelo}>
                                        <option value="">Seleccionar</option>
                                        {aniosDeModelo.map(a => <option key={a.id} value={a.id}>{a.anio}</option>)}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Selección de falla */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-bold text-slate-700">Tipo de falla</h3>
                            <button
                                onClick={() => setMostrarFormFalla(!mostrarFormFalla)}
                                className="text-sm text-blue-700 hover:underline"
                            >
                                {mostrarFormFalla ? "Cancelar" : "+ Registrar nueva falla"}
                            </button>
                        </div>

                        {mostrarFormFalla ? (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                                <input className={inputClass} placeholder="Nombre de la falla (Ej. Falla de frenos)" value={nuevaFalla.nombre} onChange={(e) => setNuevaFalla({ ...nuevaFalla, nombre: e.target.value })} />
                                <input className={inputClass} placeholder="Descripción breve (opcional)" value={nuevaFalla.descripcion} onChange={(e) => setNuevaFalla({ ...nuevaFalla, descripcion: e.target.value })} />
                                <select className={inputClass} value={nuevaFalla.gravedad} onChange={(e) => setNuevaFalla({ ...nuevaFalla, gravedad: e.target.value })}>
                                    <option value="baja">Baja (no afecta el funcionamiento)</option>
                                    <option value="media">Media (funciona con fallas)</option>
                                    <option value="alta">Alta (riesgo o falla grave)</option>
                                </select>
                                <button onClick={handleCrearFalla} className="bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2 px-4 rounded-lg w-full">
                                    Registrar falla
                                </button>
                            </div>
                        ) : (
                            <select className={inputClass} value={fallaId} onChange={(e) => {
                                setFallaId(e.target.value)
                                // Pre-llenar gravedad según la falla seleccionada
                                const fallaSeleccionada = fallas.find(f => f._id === e.target.value)
                                if (fallaSeleccionada?.gravedad) setGravedad(fallaSeleccionada.gravedad)
                            }}>
                                <option value="">Seleccionar falla</option>
                                {fallas.map(f => (
                                    <option key={f._id} value={f._id}>
                                        {f.nombre} ({f.gravedad || "media"})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Gravedad */}
                    <div>
                        <label className={labelClass}>Nivel de gravedad</label>
                        <select className={inputClass} value={gravedad} onChange={(e) => setGravedad(e.target.value)}>
                            <option value="baja">Baja (no afecta el funcionamiento)</option>
                            <option value="media">Media (funciona con fallas)</option>
                            <option value="alta">Alta (riesgo o falla grave)</option>
                        </select>
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className={labelClass}>Descripción del problema</label>
                        <textarea className={`${inputClass} h-28 resize-none`} placeholder="Describe la falla con detalle..." value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
                    </div>

                    <button onClick={handleCrearReporte} className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2.5 rounded-lg transition-colors">
                        Crear reporte y continuar
                    </button>
                </div>
            )}

            {/* PASO 2 - Evidencias */}
            {paso === 2 && (
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h3 className="text-lg font-bold text-slate-700 mb-1">Fotos de la falla</h3>
                        <p className="text-slate-400 text-sm mb-4">Sube una o varias imágenes.</p>
                        <input type="file" multiple accept="image/*" onChange={(e) => setImagenes(Array.from(e.target.files))} className={inputClass} />
                        {imagenes.length > 0 && <p className="text-sm text-slate-500 mt-2">{imagenes.length} imagen(es)</p>}
                        <button type="button" onClick={handleSubirImagenes} disabled={subiendoImagenes} className="mt-3 bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50">
                            {subiendoImagenes ? "Subiendo..." : "Subir imágenes"}
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h3 className="text-lg font-bold text-slate-700 mb-1">Documentos (facturas, recibos)</h3>
                        <p className="text-slate-400 text-sm mb-4">Sube comprobantes que respalden tu reporte.</p>
                        <input type="file" multiple accept="image/*,application/pdf" onChange={(e) => setDocumentos(Array.from(e.target.files))} className={inputClass} />
                        {documentos.length > 0 && <p className="text-sm text-slate-500 mt-2">{documentos.length} documento(s)</p>}
                        <button type="button" onClick={handleSubirDocumentos} disabled={subiendoDocumentos} className="mt-3 bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50">
                            {subiendoDocumentos ? "Subiendo..." : "Subir documentos"}
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h3 className="text-lg font-bold text-slate-700 mb-1">Enlaces de referencia</h3>
                        <p className="text-slate-400 text-sm mb-4">YouTube (reseñas/fallas) o fuentes externas (Consumer Reports, Latin NCAP...).</p>
                        <div className="space-y-3">
                            <input className={inputClass} placeholder="https://..." value={enlaceUrl} onChange={(e) => setEnlaceUrl(e.target.value)} />
                            <input className={inputClass} placeholder="Título o descripción (opcional)" value={enlaceTitulo} onChange={(e) => setEnlaceTitulo(e.target.value)} />
                            <button onClick={handleAgregarEnlace} className="bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2 px-4 rounded-lg">
                                Agregar enlace
                            </button>
                        </div>
                        {enlacesAgregados.length > 0 && (
                            <ul className="mt-4 space-y-2">
                                {enlacesAgregados.map((e, i) => (
                                    <li key={i} className="text-sm text-slate-600 flex items-center gap-2">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${e.tipo === "youtube" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
                                            {e.tipo === "youtube" ? "YouTube" : "Externo"}
                                        </span>
                                        {e.titulo || e.url}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                        <p className="text-blue-800 mb-4">Tu reporte quedará pendiente de verificación por un administrador antes de publicarse.</p>
                        <button onClick={() => navigate("/dashboard/mis-reportes")} className="bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2.5 px-8 rounded-lg">
                            Finalizar e ir a mis reportes
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ReportarFalla
