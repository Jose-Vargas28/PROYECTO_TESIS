import { Link } from "react-router"
import Logo from "../components/Logo"
import { theme } from "../config/theme"

const Home = () => {
    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="container mx-auto px-6 py-4 flex justify-between items-center">
                <Logo size="md" />
                <div className="flex gap-3">
                    <Link
                        to="/login"
                        className="px-5 py-2 text-blue-900 font-semibold hover:underline"
                    >
                        Iniciar sesión
                    </Link>
                    <Link
                        to="/register"
                        className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-lg transition-colors"
                    >
                        Registrarse
                    </Link>
                </div>
            </header>

            {/* Hero */}
            <main className="container mx-auto px-6">
                <section className="py-20 text-center max-w-3xl mx-auto">
                    <h1 className="text-4xl md:text-6xl font-black text-slate-800 mb-6">
                        Reportes vehiculares <span className="text-blue-900">colaborativos</span>
                    </h1>
                    <p className="text-lg text-slate-600 mb-10">
                        {theme.descripcion} Consulta fallas reportadas por otros usuarios y toma decisiones
                        informadas antes de comprar tu próximo vehículo.
                    </p>
                    <div className="flex gap-4 justify-center flex-wrap">
                        <Link
                            to="/register"
                            className="px-8 py-3 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-lg transition-colors"
                        >
                            Comenzar ahora
                        </Link>
                        <Link
                            to="/login"
                            className="px-8 py-3 border-2 border-blue-900 text-blue-900 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
                        >
                            Ya tengo cuenta
                        </Link>
                    </div>
                </section>

                {/* Características */}
                <section className="py-16 grid md:grid-cols-3 gap-8">
                    <div className="bg-slate-50 rounded-xl p-6 text-center">
                        <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-blue-900 text-2xl font-bold">1</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-700 mb-2">Reporta fallas</h3>
                        <p className="text-slate-500 text-sm">
                            Registra problemas mecánicos con evidencia: fotos, documentos y enlaces de referencia.
                        </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-6 text-center">
                        <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-blue-900 text-2xl font-bold">2</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-700 mb-2">Verificación</h3>
                        <p className="text-slate-500 text-sm">
                            Cada reporte es revisado y verificado antes de publicarse, garantizando información confiable.
                        </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-6 text-center">
                        <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-blue-900 text-2xl font-bold">3</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-700 mb-2">Consulta tendencias</h3>
                        <p className="text-slate-500 text-sm">
                            Visualiza estadísticas y patrones de fallas por marca y modelo de vehículo.
                        </p>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-slate-800 text-slate-300 py-8 mt-10">
                <div className="container mx-auto px-6 text-center">
                    <Logo size="sm" light />
                    <p className="mt-4 text-sm">{theme.contacto.email} · {theme.contacto.telefono}</p>
                    <p className="mt-2 text-xs text-slate-500">{theme.derechos}</p>
                </div>
            </footer>
        </div>
    )
}

export default Home
