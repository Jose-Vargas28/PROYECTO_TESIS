import { tiposCombustible, tiposVehiculo, aniosVehiculo } from "../config/ecuador"
import { useEffect, useState } from "react"
import { ToastContainer, toast } from "react-toastify"
import {
    getVehiculos, actualizarVehiculo, eliminarVehiculo,
    getFallas, actualizarFalla, eliminarFalla
} from "../services/catalogoService"

const AdminCatalogos = () => {
    const [vehiculos, setVehiculos] = useState([])
    const [fallas, setFallas] = useState([])
    const [cargando, setCargando] = useState(true)

    // Modal de edición para vehículos
    const [modalVehiculo, setModalVehiculo] = useState(null) // null o el vehículo a editar
    const [formVehiculo, setFormVehiculo] = useState({ marca: "", modelo: "", anio: "" })

    // Modal de edición para fallas
    const [modalFalla, setModalFalla] = useState(null)
    const [anioManualModal, setAnioManualModal] = useState(false) // null o la falla a editar
    const [formFalla, setFormFalla] = useState({ nombre: "", descripcion: "", gravedad: "media" })

    const getHeaders = () => {
        const storedUser = JSON.parse(localStorage.getItem("auth-token"))
        return { Authorization: `Bearer ${storedUser?.state?.token}` }
    }

    const cargar = async () => {
        try {
            const [v, f] = await Promise.all([getVehiculos(), getFallas()])
            setVehiculos(v.data)
            setFallas(f.data)
        } catch (error) {
            console.error(error)
        }
        setCargando(false)
    }

    useEffect(() => {
        cargar()
    }, [])

    // ---- Vehículos ----
    const abrirEditarVehiculo = (v) => {
        setFormVehiculo({ marca: v.marca, modelo: v.modelo, anio: v.anio, tipo: v.tipo || 'auto', combustible: v.combustible || 'gasolina' })
        setModalVehiculo(v)
    }

    const handleGuardarVehiculo = async () => {
        if (!formVehiculo.marca || !formVehiculo.modelo || !formVehiculo.anio) {
            return toast.error("Completa todos los campos")
        }
        try {
            const res = await actualizarVehiculo(modalVehiculo._id, {
                marca: formVehiculo.marca,
                modelo: formVehiculo.modelo,
                anio: Number(formVehiculo.anio),
                tipo: formVehiculo.tipo,
                combustible: formVehiculo.combustible
            })
            toast.success(res.data.msg)
            setModalVehiculo(null)
            cargar()
        } catch (error) {
            toast.error(error?.response?.data?.msg || "Error al actualizar")
        }
    }

    const handleEliminarVehiculo = async (id) => {
        if (!confirm("¿Eliminar este vehículo del catálogo?")) return
        try {
            const res = await eliminarVehiculo(id)
            toast.success(res.data.msg)
            cargar()
        } catch (error) {
            toast.error(error?.response?.data?.msg || "Error al eliminar")
        }
    }

    // ---- Fallas ----
    const abrirEditarFalla = (f) => {
        setFormFalla({ nombre: f.nombre, descripcion: f.descripcion || "", gravedad: f.gravedad || "media" })
        setModalFalla(f)
    }

    const handleGuardarFalla = async () => {
        if (!formFalla.nombre) return toast.error("El nombre es obligatorio")
        try {
            const res = await actualizarFalla(modalFalla._id, formFalla)
            toast.success(res.data.msg)
            setModalFalla(null)
            cargar()
        } catch (error) {
            toast.error(error?.response?.data?.msg || "Error al actualizar")
        }
    }

    const handleEliminarFalla = async (id) => {
        if (!confirm("¿Eliminar esta falla del catálogo?")) return
        try {
            const res = await eliminarFalla(id)
            toast.success(res.data.msg)
            cargar()
        } catch (error) {
            toast.error(error?.response?.data?.msg || "Error al eliminar")
        }
    }

    const inputClass = "block w-full rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 py-2 px-3 text-slate-700"

    if (cargando) return <p className="text-slate-400">Cargando...</p>

    return (
        <div>
            <ToastContainer />
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Catálogos</h1>
            <p className="text-slate-500 mb-6">Gestiona los vehículos y tipos de falla registrados.</p>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Vehículos */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-lg font-bold text-slate-700 mb-4">
                        Vehículos ({vehiculos.length})
                    </h2>
                    {vehiculos.length === 0 ? (
                        <p className="text-slate-400 text-sm">No hay vehículos registrados.</p>
                    ) : (
                        <ul className="space-y-2 max-h-96 overflow-y-auto">
                            {vehiculos.map(v => (
                                <li key={v._id} className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-lg">
                                    <div>
                                        <span className="text-sm text-slate-700 font-medium">{v.marca} {v.modelo} {v.anio}</span>
                                        <div className="flex gap-1 mt-0.5">
                                            <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{v.tipo || 'auto'}</span>
                                            <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">{v.combustible || 'gasolina'}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => abrirEditarVehiculo(v)}
                                            className="text-blue-700 hover:underline text-xs font-semibold"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleEliminarVehiculo(v._id)}
                                            className="text-red-600 hover:underline text-xs"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Fallas */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-lg font-bold text-slate-700 mb-4">
                        Tipos de falla ({fallas.length})
                    </h2>
                    {fallas.length === 0 ? (
                        <p className="text-slate-400 text-sm">No hay fallas registradas.</p>
                    ) : (
                        <ul className="space-y-2 max-h-96 overflow-y-auto">
                            {fallas.map(f => (
                                <li key={f._id} className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-lg">
                                    <div>
                                        <span className="text-sm text-slate-700 font-medium">{f.nombre}</span>
                                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                                            f.gravedad === "alta" ? "bg-red-100 text-red-700" :
                                            f.gravedad === "baja" ? "bg-blue-100 text-blue-700" :
                                            "bg-amber-100 text-amber-700"
                                        }`}>{f.gravedad || "media"}</span>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => abrirEditarFalla(f)}
                                            className="text-blue-700 hover:underline text-xs font-semibold"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleEliminarFalla(f._id)}
                                            className="text-red-600 hover:underline text-xs"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Modal editar vehículo */}
            {modalVehiculo && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
                        <h3 className="text-xl font-bold text-slate-700 mb-4">Editar vehículo</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Marca</label>
                                <input
                                    className={inputClass}
                                    value={formVehiculo.marca}
                                    onChange={(e) => setFormVehiculo({ ...formVehiculo, marca: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Modelo</label>
                                <input
                                    className={inputClass}
                                    value={formVehiculo.modelo}
                                    onChange={(e) => setFormVehiculo({ ...formVehiculo, modelo: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Año</label>
                                {!anioManualModal ? (
                                    <select className={inputClass} value={formVehiculo.anio}
                                        onChange={(e) => {
                                            if (e.target.value === "otro") {
                                                setAnioManualModal(true)
                                                setFormVehiculo({ ...formVehiculo, anio: "" })
                                            } else {
                                                setFormVehiculo({ ...formVehiculo, anio: e.target.value })
                                            }
                                        }}>
                                        <option value="">Seleccionar año</option>
                                        {aniosVehiculo.map(a => <option key={a} value={a}>{a}</option>)}
                                        <option value="otro">Otro año...</option>
                                    </select>
                                ) : (
                                    <div className="flex gap-2">
                                        <input type="number" className={inputClass} placeholder="Ej. 2027"
                                            value={formVehiculo.anio}
                                            onChange={(e) => setFormVehiculo({ ...formVehiculo, anio: e.target.value })}
                                            min="1900" max="2100" />
                                        <button type="button" onClick={() => { setAnioManualModal(false); setFormVehiculo({ ...formVehiculo, anio: "" }) }}
                                            className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 border border-slate-300 rounded-md whitespace-nowrap">
                                            ← Volver
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Tipo de vehículo</label>
                                <select className={inputClass} value={formVehiculo.tipo} onChange={(e) => setFormVehiculo({ ...formVehiculo, tipo: e.target.value })}>
                                    {tiposVehiculo.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Tipo de combustible</label>
                                <select className={inputClass} value={formVehiculo.combustible} onChange={(e) => setFormVehiculo({ ...formVehiculo, combustible: e.target.value })}>
                                    {tiposCombustible.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                type="button"
                                onClick={handleGuardarVehiculo}
                                className="flex-1 bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2 rounded-lg transition-colors"
                            >
                                Guardar cambios
                            </button>
                            <button
                                type="button"
                                onClick={() => setModalVehiculo(null)}
                                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal editar falla */}
            {modalFalla && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
                        <h3 className="text-xl font-bold text-slate-700 mb-4">Editar tipo de falla</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Nombre</label>
                                <input
                                    className={inputClass}
                                    value={formFalla.nombre}
                                    onChange={(e) => setFormFalla({ ...formFalla, nombre: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Descripción (opcional)</label>
                                <input
                                    className={inputClass}
                                    value={formFalla.descripcion}
                                    onChange={(e) => setFormFalla({ ...formFalla, descripcion: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Gravedad</label>
                                <select
                                    className={inputClass}
                                    value={formFalla.gravedad}
                                    onChange={(e) => setFormFalla({ ...formFalla, gravedad: e.target.value })}
                                >
                                    <option value="baja">Baja (no afecta el funcionamiento)</option>
                                    <option value="media">Media (funciona con fallas)</option>
                                    <option value="alta">Alta (riesgo o falla grave)</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                type="button"
                                onClick={handleGuardarFalla}
                                className="flex-1 bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2 rounded-lg transition-colors"
                            >
                                Guardar cambios
                            </button>
                            <button
                                type="button"
                                onClick={() => setModalFalla(null)}
                                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminCatalogos
