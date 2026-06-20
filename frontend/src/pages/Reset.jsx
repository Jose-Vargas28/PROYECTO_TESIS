import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { useParams, useNavigate } from "react-router"
import { ToastContainer } from "react-toastify"
import useFetch from "../hooks/useFetch"
import Logo from "../components/Logo"

const Reset = () => {
    const { token } = useParams()
    const navigate = useNavigate()
    const [tokenValido, setTokenValido] = useState(false)
    const { register, handleSubmit, formState: { errors }, watch } = useForm()
    const { fetchDataBackend } = useFetch()

    useEffect(() => {
        const verify = async () => {
            const url = `${import.meta.env.VITE_BACKEND_URL}/recuperarpassword/${token}`
            const res = await fetchDataBackend(url, null, "GET")
            if (res) setTokenValido(true)
        }
        verify()
    }, [token])

    const onSubmit = async (data) => {
        const url = `${import.meta.env.VITE_BACKEND_URL}/nuevopassword/${token}`
        const res = await fetchDataBackend(url, data, "POST")
        if (res) {
            setTimeout(() => navigate("/login"), 2000)
        }
    }

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-100 px-4">
            <ToastContainer />
            <Logo size="lg" linkToHome />

            <div className="bg-white rounded-xl shadow-lg p-8 mt-8 max-w-md w-full">
                <h1 className="text-2xl font-bold text-slate-700 mb-6 text-center">Nueva contraseña</h1>

                {tokenValido ? (
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="mb-4">
                            <label className="mb-2 block text-sm font-semibold text-slate-700">Nueva contraseña</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="block w-full rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 py-2 px-3 text-slate-700"
                                {...register("password", {
                                    required: "La contraseña es obligatoria",
                                    minLength: { value: 6, message: "Mínimo 6 caracteres" }
                                })}
                            />
                            {errors.password && <p className="text-red-700 text-sm mt-1">{errors.password.message}</p>}
                        </div>

                        <div className="mb-6">
                            <label className="mb-2 block text-sm font-semibold text-slate-700">Confirmar contraseña</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="block w-full rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 py-2 px-3 text-slate-700"
                                {...register("confirmpassword", {
                                    required: "Confirma la contraseña",
                                    validate: (value) => value === watch("password") || "Las contraseñas no coinciden"
                                })}
                            />
                            {errors.confirmpassword && <p className="text-red-700 text-sm mt-1">{errors.confirmpassword.message}</p>}
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
                        >
                            Cambiar contraseña
                        </button>
                    </form>
                ) : (
                    <p className="text-slate-500 text-center">Verificando enlace...</p>
                )}
            </div>
        </div>
    )
}

export default Reset
