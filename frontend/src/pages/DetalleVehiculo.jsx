import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router"
import { ToastContainer, toast } from "react-toastify"
import { getValoracionesVehiculo, crearValoracion, eliminarValoracion } from "../services/valoracionService"
import LogoMarca from "../components/ui/LogoMarca"
import Paginacion from "../components/ui/Paginacion"
import ModalConfirmar from "../components/ui/ModalConfirmar"
import storeAuth from "../context/storeAuth"

const PEXELS_API_KEY = "OiuVxWLb9nZNUcWR3cuB8b9U5rzj4mSi2ovSNsVfijN1ZYoIBvbAjlWY"

const ASPECTOS = [
    { key: "confiabilidad", label: "Confiabilidad", emoji: "🔧" },
    { key: "seguridad",     label: "Seguridad",     emoji: "🛡️" },
    { key: "consumo",       label: "Consumo de combustible", emoji: "⛽" },
    { key: "precio",        label: "Precio del vehículo",    emoji: "💰" },
    { key: "comodidad",     label: "Comodidad",     emoji: "🛋️" },
    { key: "mantenimiento", label: "Mantenimiento", emoji: "🔩" },
    { key: "repuestos",     label: "Precio de repuestos",    emoji: "🏪" },
]

// Estrellas interactivas
const EstrellasInput = ({ valor, onChange }) => (
    <div className="flex gap-1">
        {[1,2,3,4,5].map(i => (
            <button key={i} type="button" onClick={() => onChange(i)}
                className={`text-2xl transition-transform hover:scale-110 ${i <= valor ? "text-amber-400" : "text-slate-200"}`}>
                ★
            </button>
        ))}
    </div>
)

// Estrellas solo lectura
const Estrellas = ({ valor, size = "sm" }) => {
    const sz = size === "lg" ? "text-2xl" : size === "md" ? "text-lg" : "text-base"
    return (
        <div className={`flex gap-0.5 ${sz}`}>
            {[1,2,3,4,5].map(i => (
                <span key={i} className={i <= Math.round(valor) ? "text-amber-400" : "text-slate-200"}>★</span>
            ))}
        </div>
    )
}

const BarraAspecto = ({ label, emoji, valor }) => {
    const pct = (valor / 5) * 100
    const color = pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-amber-400" : pct >= 40 ? "bg-orange-400" : "bg-red-500"
    return (
        <div className="flex items-center gap-3">
            <span className="text-base w-6 text-center">{emoji}</span>
            <span className="text-sm text-slate-600 w-44 shrink-0">{label}</span>
            <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-sm font-bold text-slate-700 w-8 text-right">{valor}/5</span>
        </div>
    )
}

const formatearFecha = (f) => new Date(f).toLocaleDateString("es-EC", { day: "2-digit", month: "2-digit", year: "numeric" })

const DetalleVehiculo = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { token } = storeAuth()

    const [datos, setDatos] = useState(null)
    const [cargando, setCargando] = useState(true)
    const [pagina, setPagina] = useState(1)
    const [mostrarFormulario, setMostrarFormulario] = useState(false)
    const [enviando, setEnviando] = useState(false)
    const [modalEliminar, setModalEliminar] = useState(false)
    const [fotoSrc, setFotoSrc] = useState(null)

    const [form, setForm] = useState({
        confiabilidad: 0, seguridad: 0, consumo: 0,
        precio: 0, comodidad: 0, mantenimiento: 0, repuestos: 0,
        comentario: ""
    })

    const cargar = async (pag = 1) => {
        setCargando(true)
        try {
            const res = await getValoracionesVehiculo(id, pag)
            setDatos(res.data)
            // Si tiene mi valoración, pre-llenar el formulario
            if (res.data.miValoracion) {
                const asp = res.data.miValoracion.aspectos
                setForm({ ...asp, comentario: res.data.miValoracion.comentario || "" })
            }
        } catch (e) { console.error(e) }
        setCargando(false)
    }

    useEffect(() => { cargar() }, [id])

    // Cargar foto del vehículo
    useEffect(() => {
        if (!datos?.vehiculo) return
        const v = datos.vehiculo
        const fotoPrincipal = v.fotos?.find(f => f.principal) || v.fotos?.[0]
        if (fotoPrincipal) { setFotoSrc(fotoPrincipal.url); return }
        if (v.ocultarFotoAuto) return
        fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(`${v.marca} ${v.modelo} car`)}&per_page=1&orientation=landscape`,
            { headers: { Authorization: PEXELS_API_KEY } })
            .then(r => r.json())
            .then(d => setFotoSrc(d.photos?.[0]?.src?.large || null))
            .catch(() => {})
    }, [datos?.vehiculo?._id])

    const handleEnviar = async () => {
        // Validar que todos los aspectos tengan valor
        const aspectosFaltantes = ASPECTOS.filter(a => !form[a.key] || form[a.key] < 1)
        if (aspectosFaltantes.length > 0) {
            return toast.error(`Faltan valorar: ${aspectosFaltantes.map(a => a.label).join(", ")}`)
        }
        setEnviando(true)
        try {
            const { comentario, ...aspectos } = form
            await crearValoracion(id, { aspectos, comentario })
            toast.success(datos.miValoracion ? "Valoración actualizada" : "Valoración registrada")
            setMostrarFormulario(false)
            cargar(pagina)
        } catch (e) {
            toast.error(e?.response?.data?.msg || "Error al guardar")
        }
        setEnviando(false)
    }

    const handleEliminar = async () => {
        try {
            await eliminarValoracion(datos.miValoracion._id)
            toast.success("Valoración eliminada")
            setModalEliminar(false)
            setMostrarFormulario(false)
            setForm({ confiabilidad: 0, seguridad: 0, consumo: 0, precio: 0, comodidad: 0, mantenimiento: 0, repuestos: 0, comentario: "" })
            cargar(1)
        } catch (e) {
            toast.error("Error al eliminar")
        }
    }

    if (cargando) return <p className="text-slate-400">Cargando...</p>
    if (!datos) return <p className="text-slate-500">Vehículo no encontrado.</p>

    const { vehiculo, resumen, valoraciones, total, paginas, miValoracion, puedoValorar, diasRestantes } = datos
    const puntajeGeneral = resumen?.puntajeGeneral || 0

    return (
        <div className="max-w-4xl mx-auto">
            <ToastContainer />
            <button onClick={() => navigate(-1)} className="text-blue-700 hover:underline mb-4 text-sm">← Volver</button>

            {/* Header del vehículo */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
                {fotoSrc && <img src={fotoSrc} alt={`${vehiculo.marca} ${vehiculo.modelo}`}
                    className="w-full h-52 object-cover" onError={() => setFotoSrc(null)} />}
                <div className="p-6">
                    <div className="flex justify-between items-start flex-wrap gap-3">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <LogoMarca marca={vehiculo.marca} size={36} />
                                <h1 className="text-2xl font-bold text-slate-800">
                                    {vehiculo.marca} {vehiculo.modelo} {vehiculo.anio}
                                </h1>
                            </div>
                            <div className="flex gap-2 mt-2 flex-wrap">
                                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">{vehiculo.tipo}</span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 capitalize">{vehiculo.combustible}</span>
                                {vehiculo.version && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">{vehiculo.version}</span>
                                )}
                            </div>
                        </div>
                        {resumen && (
                            <div className="text-center">
                                <div className="text-5xl font-black text-blue-900">{puntajeGeneral}</div>
                                <Estrellas valor={puntajeGeneral} size="md" />
                                <p className="text-xs text-slate-400 mt-1">{total} valoración(es)</p>
                            </div>
                        )}
                    </div>

                    {/* Barras por aspecto */}
                    {resumen && (
                        <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
                            <p className="text-sm font-semibold text-slate-600 mb-3">Promedio por aspecto</p>
                            {ASPECTOS.map(a => (
                                <BarraAspecto key={a.key} label={a.label} emoji={a.emoji} valor={resumen.promedios[a.key]} />
                            ))}
                        </div>
                    )}

                    {!resumen && (
                        <div className="mt-4 bg-slate-50 rounded-lg p-4 text-center text-slate-400 text-sm">
                            Este vehículo aún no tiene valoraciones. ¡Sé el primero en valorarlo!
                        </div>
                    )}
                </div>
            </div>

            {/* Formulario de valoración */}
            {token && (
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    {!mostrarFormulario ? (
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div>
                                <p className="font-semibold text-slate-700">
                                    {miValoracion ? "Tu valoración" : "¿Tienes o tuviste este vehículo?"}
                                </p>
                                {miValoracion ? (
                                    <div className="flex items-center gap-2 mt-1">
                                        <Estrellas valor={resumen?.puntajeGeneral || 0} />
                                        <span className="text-xs text-slate-400">Valorado el {formatearFecha(miValoracion.updatedAt)}</span>
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-400">Comparte tu experiencia con otros usuarios</p>
                                )}
                            </div>
                            <div className="flex gap-2">
                                {miValoracion && !puedoValorar && (
                                    <p className="text-xs text-slate-400 italic">Podrás actualizar en {diasRestantes} día(s)</p>
                                )}
                                {(puedoValorar || !miValoracion) && (
                                    <button type="button" onClick={() => setMostrarFormulario(true)}
                                        className="bg-blue-900 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                                        {miValoracion ? "✏️ Actualizar" : "⭐ Valorar"}
                                    </button>
                                )}
                                {miValoracion && (
                                    <button type="button" onClick={() => setModalEliminar(true)}
                                        className="bg-red-100 hover:bg-red-200 text-red-700 text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                                        🗑
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="font-bold text-slate-700 text-lg">
                                    {miValoracion ? "Actualizar valoración" : "Nueva valoración"}
                                </h3>
                                <button type="button" onClick={() => setMostrarFormulario(false)}
                                    className="text-slate-400 hover:text-slate-600 text-xl">×</button>
                            </div>

                            <div className="space-y-4 mb-5">
                                {ASPECTOS.map(a => (
                                    <div key={a.key} className="flex items-center gap-4 flex-wrap">
                                        <span className="text-base w-6">{a.emoji}</span>
                                        <span className="text-sm text-slate-600 w-48 shrink-0">{a.label}</span>
                                        <EstrellasInput valor={form[a.key]} onChange={v => setForm(prev => ({ ...prev, [a.key]: v }))} />
                                        <span className="text-xs text-slate-400 ml-1">
                                            {form[a.key] === 1 ? "Muy malo" : form[a.key] === 2 ? "Malo" : form[a.key] === 3 ? "Regular" : form[a.key] === 4 ? "Bueno" : form[a.key] === 5 ? "Excelente" : "Sin valorar"}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="mb-5">
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Comentario <span className="text-slate-400 font-normal">(opcional, máx. 500 caracteres)</span>
                                </label>
                                <textarea
                                    className="w-full rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 py-2 px-3 text-slate-700 text-sm resize-none"
                                    rows={3}
                                    maxLength={500}
                                    placeholder="Cuéntanos tu experiencia con este vehículo..."
                                    value={form.comentario}
                                    onChange={e => setForm(prev => ({ ...prev, comentario: e.target.value }))}
                                />
                                <p className="text-xs text-slate-400 text-right mt-1">{form.comentario.length}/500</p>
                            </div>

                            <div className="flex gap-3">
                                <button type="button" onClick={handleEnviar} disabled={enviando}
                                    className="flex-1 bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50">
                                    {enviando ? "Guardando..." : miValoracion ? "Actualizar valoración" : "Publicar valoración"}
                                </button>
                                <button type="button" onClick={() => setMostrarFormulario(false)}
                                    className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold py-2.5 rounded-lg transition-colors">
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Lista de reseñas */}
            {total > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-lg font-bold text-slate-700 mb-4">Reseñas de usuarios ({total})</h2>
                    <div className="space-y-4">
                        {valoraciones.map(v => (
                            <div key={v._id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-700">{v.usuario?.nombre}</p>
                                        {(v.usuario?.region || v.usuario?.provincia) && (
                                            <p className="text-xs text-slate-400">
                                                {[v.usuario.provincia, v.usuario.region].filter(Boolean).join(", ")}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right shrink-0">
                                        <Estrellas valor={
                                            Math.round((Object.values(v.aspectos).reduce((a, b) => a + b, 0) / 7) * 10) / 10
                                        } />
                                        <p className="text-xs text-slate-400 mt-0.5">{formatearFecha(v.createdAt)}</p>
                                    </div>
                                </div>
                                {v.comentario && (
                                    <p className="text-sm text-slate-600 italic">"{v.comentario}"</p>
                                )}
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {ASPECTOS.map(a => (
                                        <span key={a.key} className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-slate-500">
                                            {a.emoji} {a.label}: <strong>{v.aspectos[a.key]}</strong>/5
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    {paginas > 1 && (
                        <Paginacion paginaActual={pagina} totalPaginas={paginas}
                            onCambiar={p => { setPagina(p); cargar(p) }} />
                    )}
                </div>
            )}

            {modalEliminar && (
                <ModalConfirmar
                    titulo="¿Eliminar tu valoración?"
                    descripcion="Se eliminará tu valoración de este vehículo permanentemente."
                    textoConfirmar="Sí, eliminar"
                    colorBoton="bg-red-600 hover:bg-red-700"
                    onConfirmar={handleEliminar}
                    onCancelar={() => setModalEliminar(false)}
                />
            )}
        </div>
    )
}

export default DetalleVehiculo