import { Link, Outlet, useLocation, useNavigate } from "react-router"
import { useEffect, useState } from "react"
import storeAuth from "../context/storeAuth"
import storeProfile from "../context/storeProfile"
import storeUI from "../context/storeUI"
import Logo from "../components/Logo"
import { theme } from "../config/theme"
import ModalConfirmar from "../components/ui/ModalConfirmar"
import axios from "axios"

const Dashboard = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const url = location.pathname
    const { clearAuth, rol, token } = storeAuth()
    const { user, profile, clearUser } = storeProfile()
    const { formDirty, setFormDirty } = storeUI()
    const [modalLogout, setModalLogout] = useState(false)
    const [modalSalir, setModalSalir] = useState(false)
    const [pendingNav, setPendingNav] = useState(null)

    const handleNavClick = (e, to) => {
        if (formDirty && url !== to) {
            e.preventDefault()
            setPendingNav(to)
            setModalSalir(true)
        }
    }

    const confirmarSalir = () => {
        setFormDirty(false)
        setModalSalir(false)
        navigate(pendingNav)
        setPendingNav(null)
    }

    useEffect(() => {
        profile()
    }, [])

    // Verificar baneo en cada cambio de ruta
    useEffect(() => {
        const verificarEstado = async () => {
            if (!token) return
            try {
                await axios.get(`${import.meta.env.VITE_BACKEND_URL}/perfil`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            } catch (error) {
                const data = error?.response?.data
                if (data?.baneado || data?.eliminado) {
                    clearAuth()
                    clearUser()
                    navigate("/login")
                }
            }
        }
        verificarEstado()
    }, [url])

    const logout = () => {
        clearAuth()
        clearUser()
        navigate("/login")
    }

    const enlacesUsuario = [
        { to: "/dashboard", label: "Inicio", exact: true },
        { to: "/dashboard/reportar", label: "Reportar falla" },
        { to: "/dashboard/reportes", label: "Ver reportes" },
        { to: "/dashboard/mis-reportes", label: "Mis reportes" },
        { to: "/dashboard/vehiculos", label: "Vehículos" },
        { to: "/dashboard/confiabilidad", label: "Confiabilidad" },
        { to: "/dashboard/estadisticas", label: "Estadísticas" },
        { to: "/dashboard/perfil", label: "Mi perfil" },
    ]

    const enlacesAdmin = [
        { to: "/dashboard/admin/pendientes", label: "Validar reportes" },
        { to: "/dashboard/admin/usuarios", label: "Usuarios" },
        { to: "/dashboard/admin/catalogos", label: "Catálogos" },
        { to: "/dashboard/admin/valoraciones", label: "Moderar valoraciones" },
        { to: "/dashboard/admin/eliminados", label: "Papelera / Auditoría" },
    ]

    const linkClass = (to, exact = false) => {
        const esActivo = exact
            ? url === to
            : url.startsWith(to) && to !== "/dashboard"
        return `block px-4 py-2.5 rounded-lg mb-1 transition-colors ${
            esActivo
                ? "bg-blue-900 text-white"
                : "text-slate-300 hover:bg-slate-700 hover:text-white"
        }`
    }

    return (
        <div className="md:flex h-screen overflow-hidden bg-slate-100">
            {/* Sidebar — fijo, scroll propio si hay muchos enlaces */}
            <aside className="md:w-64 bg-slate-800 px-4 py-6 flex flex-col h-full overflow-y-auto shrink-0">
                <div className="mb-8">
                    <Logo size="sm" light />
                </div>

                <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto bg-blue-900 rounded-full flex items-center justify-center mb-2 overflow-hidden">
                        {user?.foto?.url ? (
                            <img src={user.foto.url} alt="Foto de perfil" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-white text-2xl font-bold">
                                {user?.nombre?.charAt(0)?.toUpperCase() || "U"}
                            </span>
                        )}
                    </div>
                    <p className="text-slate-200 text-sm font-semibold">{user?.nombre} {user?.apellido}</p>
                    <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                        rol === "admin" ? "bg-amber-500 text-white" : "bg-blue-600 text-white"
                    }`}>
                        {rol === "admin" ? "Administrador" : "Usuario"}
                    </span>
                </div>

                <nav className="flex-1">
                    {enlacesUsuario.map((e) => (
                        <Link key={e.to} to={e.to} className={linkClass(e.to, e.exact)}
                            onClick={(ev) => handleNavClick(ev, e.to)}>
                            {e.label}
                        </Link>
                    ))}

                    {rol === "admin" && (
                        <>
                            <p className="text-slate-500 text-xs uppercase mt-4 mb-2 px-4">Administración</p>
                            {enlacesAdmin.map((e) => (
                                <Link key={e.to} to={e.to} className={linkClass(e.to)}
                                    onClick={(ev) => handleNavClick(ev, e.to)}>
                                    {e.label}
                                </Link>
                            ))}
                        </>
                    )}
                </nav>

                <button
                    type="button"
                    onClick={() => setModalLogout(true)}
                    className="mt-4 bg-red-700 hover:bg-red-800 text-white py-2 px-4 rounded-lg transition-colors"
                >
                    Cerrar sesión
                </button>
            </aside>

            {/* Contenido principal — scroll propio */}
            <main className="flex-1 flex flex-col overflow-y-auto">
                <div className="flex-1 p-6 md:p-8">
                    <Outlet />
                </div>
                <footer className="bg-slate-800 text-slate-400 text-center text-sm py-3 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
                    <span>{theme.derechos}</span>
                    <a href="/terminos" target="_blank" rel="noreferrer"
                        className="text-slate-500 hover:text-slate-200 hover:underline transition-colors text-xs">
                        Términos y condiciones
                    </a>
                </footer>
            </main>

            {/* Modal advertencia salir del formulario */}
            {modalSalir && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
                        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <span className="text-2xl">⚠️</span>
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg mb-2">¿Salir del formulario?</h3>
                        <p className="text-slate-500 text-sm mb-5">
                            Si sales ahora perderás todos los datos ingresados. El reporte no se guardará.
                        </p>
                        <div className="flex gap-3">
                            <button type="button" onClick={() => { setModalSalir(false); setPendingNav(null) }}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg">
                                Seguir editando
                            </button>
                            <button type="button" onClick={confirmarSalir}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg">
                                Sí, salir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal confirmación cerrar sesión */}
            {modalLogout && (
                <ModalConfirmar
                    titulo="¿Cerrar sesión?"
                    descripcion="¿Estás seguro de que deseas cerrar tu sesión?"
                    textoConfirmar="Sí, cerrar sesión"
                    textoCancelar="Cancelar"
                    colorBoton="bg-red-600 hover:bg-red-700"
                    onConfirmar={logout}
                    onCancelar={() => setModalLogout(false)}
                />
            )}
        </div>
    )
}

export default Dashboard