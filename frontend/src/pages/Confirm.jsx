import { useEffect, useState } from "react"
import { Link, useParams } from "react-router"
import axios from "axios"
import Logo from "../components/Logo"

const Confirm = () => {
    const { token } = useParams()
    const [mensaje, setMensaje] = useState("Confirmando tu cuenta...")
    const [exito, setExito] = useState(false)

    useEffect(() => {
        const verify = async () => {
            try {
                const url = `${import.meta.env.VITE_BACKEND_URL}/confirmar/${token}`
                const res = await axios.get(url)
                setMensaje(res?.data?.msg || "Cuenta confirmada")
                setExito(true)
            } catch (error) {
                setMensaje(error?.response?.data?.msg || "No se pudo confirmar la cuenta")
                setExito(false)
            }
        }
        verify()
    }, [token])

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-100 px-4">
            <Logo size="lg" linkToHome />
            <div className="bg-white rounded-xl shadow-lg p-8 mt-8 max-w-md text-center">
                <h1 className="text-2xl font-bold text-slate-700 mb-4">
                    {exito ? "¡Cuenta confirmada!" : "Confirmación"}
                </h1>
                <p className="text-slate-500 mb-6">{mensaje}</p>
                <Link
                    to="/login"
                    className="inline-block bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2.5 px-8 rounded-lg transition-colors"
                >
                    Ir a iniciar sesión
                </Link>
            </div>
        </div>
    )
}

export default Confirm
