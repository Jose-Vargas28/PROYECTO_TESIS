import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { ToastContainer, toast } from "react-toastify"
import storeProfile from "../context/storeProfile"
import storeAuth from "../context/storeAuth"
import { regionesEcuador, provinciasPorRegion } from "../config/ecuador"
import axios from "axios"

const Perfil = () => {
    const { user, profile } = storeProfile()
    const { rol, token } = storeAuth()
    const [editandoPerfil, setEditandoPerfil] = useState(false)
    const [editandoPassword, setEditandoPassword] = useState(false)
    const [regionSeleccionada, setRegionSeleccionada] = useState("")

    const { register: regPerfil, handleSubmit: hsPerfil, reset: resetPerfil, formState: { errors: errPerfil }, watch } = useForm()
    const { register: regPass, handleSubmit: hsPass, reset: resetPass, formState: { errors: errPass } } = useForm()

    const regionWatch = watch("region")

    useEffect(() => {
        if (user) {
            resetPerfil({
                nombre: user.nombre,
                email: user.email,
                telefono: user.telefono || "",
                region: user.region || "",
                provincia: user.provincia || ""
            })
            setRegionSeleccionada(user.region || "")
        }
    }, [user])

    useEffect(() => {
        setRegionSeleccionada(regionWatch || "")
    }, [regionWatch])

    const authHeaders = () => ({
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    })

    const guardarPerfil = async (data) => {
        try {
            const res = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/perfil`, data, authHeaders())
            toast.success(res.data.msg)
            profile()
            setEditandoPerfil(false)
        } catch (error) {
            toast.error(error?.response?.data?.msg || "Error al actualizar perfil")
        }
    }

    const cambiarPassword = async (data) => {
        try {
            const res = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/perfil/password`, data, authHeaders())
            toast.success(res.data.msg)
            resetPass()
            setEditandoPassword(false)
        } catch (error) {
            toast.error(error?.response?.data?.msg || "Error al cambiar contraseña")
        }
    }

    const inputClass = "block w-full rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 py-2 px-3 text-slate-700"
    const labelClass = "mb-2 block text-sm font-semibold text-slate-700"

    return (
        <div className="max-w-2xl">
            <ToastContainer />
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Mi perfil</h1>
            <p className="text-slate-500 mb-6">Gestiona tu información personal</p>

            {/* Tarjeta de perfil */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-blue-900 rounded-full flex items-center justify-center">
                            <span className="text-white text-3xl font-bold">
                                {user?.nombre?.charAt(0)?.toUpperCase() || "U"}
                            </span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-700">{user?.nombre}</h2>
                            <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${rol === "admin" ? "bg-amber-500 text-white" : "bg-blue-600 text-white"}`}>
                                {rol === "admin" ? "Administrador" : "Usuario"}
                            </span>
                        </div>
                    </div>
                    {!editandoPerfil && (
                        <button type="button" onClick={() => setEditandoPerfil(true)}
                            className="text-blue-700 hover:underline text-sm font-semibold">
                            Editar
                        </button>
                    )}
                </div>

                {editandoPerfil ? (
                    <form onSubmit={hsPerfil(guardarPerfil)}>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Nombre completo</label>
                                <input className={inputClass} {...regPerfil("nombre", { required: "El nombre es obligatorio" })} />
                                {errPerfil.nombre && <p className="text-red-700 text-sm mt-1">{errPerfil.nombre.message}</p>}
                            </div>
                            <div>
                                <label className={labelClass}>Correo electrónico</label>
                                <input type="email" className={inputClass} {...regPerfil("email", { required: "El correo es obligatorio" })} />
                                {errPerfil.email && <p className="text-red-700 text-sm mt-1">{errPerfil.email.message}</p>}
                            </div>
                            <div>
                                <label className={labelClass}>Teléfono <span className="text-slate-400 font-normal">(opcional)</span></label>
                                <input type="tel" className={inputClass} placeholder="0999999999" {...regPerfil("telefono")} />
                            </div>
                            <div>
                                <label className={labelClass}>Región <span className="text-slate-400 font-normal">(opcional)</span></label>
                                <select className={inputClass} {...regPerfil("region")}>
                                    <option value="">Seleccionar región</option>
                                    {regionesEcuador.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className={labelClass}>Provincia <span className="text-slate-400 font-normal">(opcional)</span></label>
                                <select className={inputClass} {...regPerfil("provincia")} disabled={!regionSeleccionada}>
                                    <option value="">Seleccionar provincia</option>
                                    {(provinciasPorRegion[regionSeleccionada] || []).map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button type="submit" className="flex-1 bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2 rounded-lg transition-colors">
                                Guardar cambios
                            </button>
                            <button type="button" onClick={() => { setEditandoPerfil(false); resetPerfil({ nombre: user.nombre, email: user.email, telefono: user.telefono || "", region: user.region || "", provincia: user.provincia || "" }) }}
                                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2 rounded-lg transition-colors">
                                Cancelar
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-3 border-t pt-4">
                        <div className="grid md:grid-cols-2 gap-3">
                            <div>
                                <p className="text-sm text-slate-400">Nombre</p>
                                <p className="text-slate-700 font-semibold">{user?.nombre}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Correo electrónico</p>
                                <p className="text-slate-700 font-semibold">{user?.email}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Teléfono</p>
                                <p className="text-slate-700">{user?.telefono || <span className="text-slate-400 italic">No registrado</span>}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Región</p>
                                <p className="text-slate-700">{user?.region || <span className="text-slate-400 italic">No registrada</span>}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Provincia</p>
                                <p className="text-slate-700">{user?.provincia || <span className="text-slate-400 italic">No registrada</span>}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Cambiar contraseña */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-700">Cambiar contraseña</h3>
                    {!editandoPassword && (
                        <button type="button" onClick={() => setEditandoPassword(true)}
                            className="text-blue-700 hover:underline text-sm font-semibold">
                            Cambiar
                        </button>
                    )}
                </div>

                {editandoPassword ? (
                    <form onSubmit={hsPass(cambiarPassword)}>
                        <div className="mb-4">
                            <label className={labelClass}>Contraseña actual</label>
                            <input type="password" className={inputClass} placeholder="••••••••"
                                {...regPass("passwordActual", { required: "La contraseña actual es obligatoria" })} />
                            {errPass.passwordActual && <p className="text-red-700 text-sm mt-1">{errPass.passwordActual.message}</p>}
                        </div>
                        <div className="mb-4">
                            <label className={labelClass}>Nueva contraseña</label>
                            <input type="password" className={inputClass} placeholder="••••••••"
                                {...regPass("passwordNuevo", { required: "La nueva contraseña es obligatoria", minLength: { value: 6, message: "Mínimo 6 caracteres" } })} />
                            {errPass.passwordNuevo && <p className="text-red-700 text-sm mt-1">{errPass.passwordNuevo.message}</p>}
                        </div>
                        <div className="mb-4">
                            <label className={labelClass}>Confirmar nueva contraseña</label>
                            <input type="password" className={inputClass} placeholder="••••••••"
                                {...regPass("confirmarPassword", { required: "Confirma la contraseña" })} />
                            {errPass.confirmarPassword && <p className="text-red-700 text-sm mt-1">{errPass.confirmarPassword.message}</p>}
                        </div>
                        <div className="flex gap-3">
                            <button type="submit" className="flex-1 bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2 rounded-lg transition-colors">
                                Actualizar contraseña
                            </button>
                            <button type="button" onClick={() => { setEditandoPassword(false); resetPass() }}
                                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2 rounded-lg transition-colors">
                                Cancelar
                            </button>
                        </div>
                    </form>
                ) : (
                    <p className="text-slate-400 text-sm">Tu contraseña está protegida. Haz clic en "Cambiar" para actualizarla.</p>
                )}
            </div>
        </div>
    )
}

export default Perfil
