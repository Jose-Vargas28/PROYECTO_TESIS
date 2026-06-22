import { useState } from "react"
import { useForm } from "react-hook-form"
import { Link, useNavigate } from "react-router"
import { ToastContainer } from "react-toastify"
import useFetch from "../hooks/useFetch"
import Logo from "../components/Logo"
import MedidorPassword from "../components/ui/MedidorPassword"
import BotonMostrarPassword from "../components/ui/BotonMostrarPassword"
import { theme } from "../config/theme"

const Register = () => {
    const navigate = useNavigate()
    const [showPassword, setShowPassword] = useState(false)
    const { register, handleSubmit, watch, formState: { errors } } = useForm()
    const { fetchDataBackend } = useFetch()
    const passwordActual = watch("password")

    const onSubmit = async (data) => {
        const url = `${import.meta.env.VITE_BACKEND_URL}/registro`
        const response = await fetchDataBackend(url, data, "POST")
        if (response) {
            setTimeout(() => navigate("/login"), 2000)
        }
    }

    return (
        <div className="flex flex-col sm:flex-row h-screen">
            <ToastContainer />

            {/* Panel izquierdo - formulario */}
            <div className="w-full sm:w-1/2 h-screen bg-white flex justify-center items-center overflow-y-auto py-8">
                <div className="md:w-4/5 sm:w-full px-8">
                    <h1 className="text-3xl font-bold mb-2 text-slate-700">Crear cuenta</h1>
                    <p className="text-slate-400 mb-8 text-sm">Regístrate para reportar y consultar fallas vehiculares</p>

                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="mb-4 flex gap-3">
                            <div className="flex-1">
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Nombre</label>
                                <input
                                    type="text"
                                    placeholder="Tu nombre"
                                    className="block w-full rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 py-2 px-3 text-slate-700"
                                    {...register("nombre", {
                                        required: "El nombre es obligatorio",
                                        pattern: {
                                            value: /^[A-Za-zÁÉÍÓÚÑÜáéíóúñü\s]+$/,
                                            message: "El nombre solo puede contener letras"
                                        }
                                    })}
                                />
                                {errors.nombre && <p className="text-red-700 text-sm mt-1">{errors.nombre.message}</p>}
                            </div>
                            <div className="flex-1">
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Apellido</label>
                                <input
                                    type="text"
                                    placeholder="Tu apellido"
                                    className="block w-full rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 py-2 px-3 text-slate-700"
                                    {...register("apellido", {
                                        required: "El apellido es obligatorio",
                                        pattern: {
                                            value: /^[A-Za-zÁÉÍÓÚÑÜáéíóúñü\s]+$/,
                                            message: "El apellido solo puede contener letras"
                                        }
                                    })}
                                />
                                {errors.apellido && <p className="text-red-700 text-sm mt-1">{errors.apellido.message}</p>}
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="mb-2 block text-sm font-semibold text-slate-700">Correo electrónico</label>
                            <input
                                type="email"
                                placeholder="correo@ejemplo.com"
                                className="block w-full rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 py-2 px-3 text-slate-700"
                                {...register("email", { required: "El correo es obligatorio" })}
                            />
                            {errors.email && <p className="text-red-700 text-sm mt-1">{errors.email.message}</p>}
                        </div>

                        <div className="mb-4">
                            <label className="mb-2 block text-sm font-semibold text-slate-700">Contraseña</label>
                            <p className="text-xs text-slate-400 mb-1.5">Mínimo 8 caracteres, con mayúscula, número y carácter especial</p>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="block w-full rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 py-2 px-3 text-slate-700 pr-10"
                                    {...register("password", {
                                        required: "La contraseña es obligatoria",
                                        pattern: {
                                            value: /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
                                            message: "Debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial"
                                        }
                                    })}
                                />
                                <BotonMostrarPassword visible={showPassword} onClick={() => setShowPassword(!showPassword)} />
                            </div>
                            {errors.password && <p className="text-red-700 text-sm mt-1">{errors.password.message}</p>}
                            <MedidorPassword password={passwordActual} />
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                            <p className="text-xs text-blue-800">
                                Tras registrarte recibirás un correo para confirmar tu cuenta antes de poder iniciar sesión.
                            </p>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
                        >
                            Registrarse
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-slate-500">
                        ¿Ya tienes cuenta?{" "}
                        <Link to="/login" className="text-blue-700 font-semibold hover:underline">
                            Inicia sesión
                        </Link>
                    </p>
                    <p className="mt-3 text-center text-sm">
                        <Link to="/" className="text-slate-400 hover:text-slate-600 hover:underline">
                            ← Volver al inicio
                        </Link>
                    </p>
                </div>
            </div>

            {/* Panel derecho - marca */}
            <div className="w-full sm:w-1/2 h-1/3 sm:h-screen bg-blue-900 flex flex-col justify-center items-center text-center px-8 order-first sm:order-last">
                <Logo size="lg" light linkToHome />
                <p className="text-blue-100 mt-6 text-lg max-w-sm">
                    {theme.descripcion}
                </p>
            </div>
        </div>
    )
}

export default Register