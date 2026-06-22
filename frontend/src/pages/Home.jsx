import { useState, useEffect } from "react"
import { Link } from "react-router"
import Logo from "../components/Logo"
import LogoMarca from "../components/ui/LogoMarca"
import { theme } from "../config/theme"
import { getEstadisticasHome } from "../services/reporteService"
import { getRanking } from "../services/valoracionService"


//  ÍCONOS DE REDES SOCIALES (footer)
//  Mismo patrón que en Logo.jsx: cuando tengas los logos reales,
//  colócalos en src/assets/ y descomenta las líneas de abajo
//  (una por cada red que vayas a usar).

// import facebookImg from "../assets/facebook.png"
// import instagramImg from "../assets/instagram.png"
// import xImg from "../assets/x.png"
// import whatsappImg from "../assets/whatsapp.png"

// Búsqueda de foto de stock cuando un vehículo no tiene fotos reales subidas
// (misma función y misma key que ya usan Confiabilidad.jsx y CatalogoVehiculos.jsx)
const PEXELS_API_KEY = "OiuVxWLb9nZNUcWR3cuB8b9U5rzj4mSi2ovSNsVfijN1ZYoIBvbAjlWY"
const pexelsCache = {}

const buscarFotoPexels = async (marca, modelo) => {
    const key = `${marca} ${modelo}`.toLowerCase()
    if (pexelsCache[key] !== undefined) return pexelsCache[key]
    try {
        const res = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(`${marca} ${modelo} car`)}&per_page=3&orientation=landscape`,
            { headers: { Authorization: PEXELS_API_KEY } }
        )
        const data = await res.json()
        const urls = data.photos?.map(p => p.src.medium) || []
        pexelsCache[key] = urls
        return urls
    } catch { pexelsCache[key] = []; return [] }
}

// Foto de cada tarjeta del top 3: usa la real si el vehículo tiene una subida,
// si no busca una foto de stock en Pexels automáticamente.
const FotoTarjetaTop = ({ vehiculo }) => {
    const fotoReal = vehiculo.fotos?.find(f => f.principal)?.url || vehiculo.fotos?.[0]?.url
    const [fotoPexels, setFotoPexels] = useState(null)
    const [cargando, setCargando] = useState(!fotoReal)

    useEffect(() => {
        if (fotoReal) return
        let cancelado = false
        setCargando(true)
        buscarFotoPexels(vehiculo.marca, vehiculo.modelo).then(urls => {
            if (!cancelado) {
                setFotoPexels(urls[0] || null)
                setCargando(false)
            }
        })
        return () => { cancelado = true }
    }, [vehiculo._id, fotoReal])

    const foto = fotoReal || fotoPexels

    if (cargando) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
            </div>
        )
    }
    if (!foto) {
        return <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">Sin foto</div>
    }
    return <img src={foto} alt={`${vehiculo.marca} ${vehiculo.modelo}`} className="w-full h-full object-cover" />
}

const Home = () => {
    const [stats, setStats] = useState(null)
    const [topVehiculos, setTopVehiculos] = useState([])

    useEffect(() => {
        getEstadisticasHome()
            .then(res => setStats(res.data))
            .catch(() => setStats(null))

        getRanking({ minValoraciones: 1 })
            .then(res => setTopVehiculos(res.data.ranking.slice(0, 3)))
            .catch(() => setTopVehiculos([]))
    }, [])

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="container mx-auto px-6 py-4 flex justify-between items-center">
                <Logo size="md" />
                <div className="flex items-center gap-6">
                    <a href="#contacto" className="hidden sm:inline text-slate-600 hover:text-blue-900 font-medium">
                        Contacto
                    </a>
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

                {/* Más funciones del sistema */}
                <section className="pb-16">
                    <h2 className="text-2xl font-bold text-slate-800 text-center mb-10">Y eso no es todo</h2>
                    <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                        <div className="bg-slate-50 rounded-xl p-6 text-center">
                            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-blue-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-700 mb-2">Consulta reportes</h3>
                            <p className="text-slate-500 text-sm">
                                Explora el historial de fallas reportadas por otros conductores y filtra por marca,
                                modelo o tipo de falla antes de tomar una decisión.
                            </p>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-6 text-center">
                            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-blue-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 21.03a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-700 mb-2">Ranking de confiabilidad</h3>
                            <p className="text-slate-500 text-sm">
                                Califica vehículos en aspectos como seguridad, consumo y mantenimiento, y descubre
                                cuáles son los mejor evaluados por la comunidad.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Estadísticas reales del sistema */}
                {stats && (stats.totalReportes > 0 || stats.totalVehiculos > 0) && (
                    <section className="py-12 grid grid-cols-3 gap-4 sm:gap-8 text-center border-y border-slate-100">
                        <div>
                            <p className="text-3xl sm:text-5xl font-black text-blue-900">{stats.totalReportes}</p>
                            <p className="text-slate-500 text-xs sm:text-sm mt-1">Reportes verificados</p>
                        </div>
                        <div>
                            <p className="text-3xl sm:text-5xl font-black text-blue-900">{stats.totalVehiculos}</p>
                            <p className="text-slate-500 text-xs sm:text-sm mt-1">Vehículos en el catálogo</p>
                        </div>
                        <div>
                            <p className="text-3xl sm:text-5xl font-black text-blue-900">{stats.totalMarcas}</p>
                            <p className="text-slate-500 text-xs sm:text-sm mt-1">Marcas distintas</p>
                        </div>
                    </section>
                )}

                {/* Top 3 mejor calificados — vista previa del ranking de Confiabilidad */}
                {topVehiculos.length > 0 && (
                    <section className="py-16">
                        <h2 className="text-3xl font-bold text-slate-800 text-center mb-2">Los mejor calificados</h2>
                        <p className="text-slate-500 text-center mb-10">
                            Según las valoraciones reales de nuestra comunidad de conductores.
                        </p>
                        <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
                            {topVehiculos.map((item, i) => (
                                    <div key={item.vehiculo._id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                        <div className="relative w-full h-36 bg-slate-100">
                                            <FotoTarjetaTop vehiculo={item.vehiculo} />
                                            <div className={`absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white shadow ${
                                                i === 0 ? "bg-amber-400" : i === 1 ? "bg-slate-400" : "bg-amber-700"
                                            }`}>
                                                {i + 1}
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <div className="flex items-center gap-1.5">
                                                <LogoMarca marca={item.vehiculo.marca} size={18} />
                                                <span className="text-sm font-semibold text-slate-800 truncate">
                                                    {item.vehiculo.marca} {item.vehiculo.modelo}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-400 mt-0.5">{item.vehiculo.anio} · {item.vehiculo.tipo}</p>
                                            <div className="flex items-center gap-1 mt-2">
                                                <span className="text-amber-500">⭐</span>
                                                <span className="text-sm font-bold text-slate-700">{item.puntajeGeneral}</span>
                                                <span className="text-xs text-slate-400">· {item.totalValoraciones} valoración(es)</span>
                                            </div>
                                        </div>
                                    </div>
                            ))}
                        </div>
                        <p className="text-center mt-8">
                            <Link to="/register" className="text-blue-900 font-semibold hover:underline">
                                Regístrate para ver el ranking completo y dejar tus propias valoraciones →
                            </Link>
                        </p>
                    </section>
                )}

                {/* ¿Qué es AutoReporta EC? */}
                <section className="py-16 grid md:grid-cols-2 gap-6 items-stretch">
                    <div className="bg-slate-50 rounded-xl p-8">
                        <h2 className="text-2xl font-bold text-slate-800 mb-3">¿Qué es AutoReporta EC?</h2>
                        <p className="text-slate-600">
                            Es una plataforma colaborativa donde conductores ecuatorianos comparten experiencias
                            reales sobre fallas mecánicas de sus vehículos. En lugar de depender de opiniones
                            aisladas, aquí encuentras reportes verificados y estadísticas construidas a partir
                            de datos reales de la comunidad, organizados por marca, modelo y año.
                        </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-8">
                        <h2 className="text-2xl font-bold text-slate-800 mb-3">Objetivo del proyecto</h2>
                        <p className="text-slate-600">
                            Este sistema nace como proyecto de tesis con un objetivo concreto: facilitar el
                            acceso a información confiable sobre la confiabilidad de los vehículos que circulan
                            en Ecuador, ayudando a reducir la incertidumbre al momento de comprar un vehículo
                            usado o nuevo.
                        </p>
                    </div>
                </section>

                {/* Contáctanos — formulario visual por ahora (sin conectar al backend) */}
                {/*
                    TODO: para activarlo más adelante:
                    1. Maneja los campos con useState (o react-hook-form, como en el resto del proyecto).
                    2. Crea un endpoint backend público (ej. POST /contacto) que use Nodemailer
                       (ver nodemailer.js) para enviarte el mensaje a tu correo.
                    3. Conecta el onSubmit de este <form> a ese endpoint.
                */}
                <section id="contacto" className="py-16 max-w-xl mx-auto scroll-mt-20">
                    <h2 className="text-3xl font-bold text-slate-800 text-center mb-3">Contáctanos</h2>
                    <p className="text-slate-500 text-center mb-8">
                        ¿Tienes dudas, quejas o sugerencias? Escríbenos y te responderemos lo antes posible.
                    </p>
                    <form className="bg-slate-50 rounded-xl p-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">Nombre</label>
                            <input
                                type="text"
                                placeholder="Tu nombre"
                                className="block w-full rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 py-2 px-3 text-slate-700"
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">Correo electrónico</label>
                            <input
                                type="email"
                                placeholder="tucorreo@ejemplo.com"
                                className="block w-full rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 py-2 px-3 text-slate-700"
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">Mensaje</label>
                            <textarea
                                rows={4}
                                placeholder="Cuéntanos tu duda, queja o sugerencia..."
                                className="block w-full rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 py-2 px-3 text-slate-700 resize-none"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 rounded-lg transition-colors"
                        >
                            Enviar mensaje
                        </button>
                    </form>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-slate-800 text-slate-300 py-6 mt-10">
                <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <Logo size="sm" light />

                    <p className="text-xs text-slate-500 order-last sm:order-none">{theme.derechos}</p>

                    {/*
                        TODO: cuando tengas los logos reales, descomenta los imports de arriba
                        y reemplaza el contenido de cada <a> por:
                        <img src={facebookImg} alt="Facebook" className="w-5 h-5" />
                        (y así con instagramImg, xImg, whatsappImg). También actualiza los
                        enlaces reales en theme.js (theme.contacto.facebook, etc.)
                    */}
                    <div className="flex gap-2">
                        <a href={theme.contacto.facebook} target="_blank" rel="noreferrer" title="Facebook"
                            className="w-8 h-8 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center transition-colors text-xs font-bold">
                            FB
                        </a>
                        <a href={theme.contacto.instagram} target="_blank" rel="noreferrer" title="Instagram"
                            className="w-8 h-8 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center transition-colors text-xs font-bold">
                            IG
                        </a>
                        <a href={theme.contacto.twitter} target="_blank" rel="noreferrer" title="X (Twitter)"
                            className="w-8 h-8 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center transition-colors text-xs font-bold">
                            X
                        </a>
                        <a href={theme.contacto.whatsapp} target="_blank" rel="noreferrer" title="WhatsApp"
                            className="w-8 h-8 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center transition-colors text-xs font-bold">
                            WA
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default Home