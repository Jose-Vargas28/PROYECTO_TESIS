import { useEffect, useState } from "react"
import { getEstadisticas } from "../services/reporteService"
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, CartesianGrid
} from "recharts"

const COLORES_MARCA = ["#1e3a8a", "#1d4ed8", "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#1e40af", "#1e3a8a", "#172554", "#1d4ed8"]
const COLORES_FALLA = ["#7c3aed", "#6d28d9", "#8b5cf6", "#a78bfa", "#c4b5fd", "#7c3aed", "#5b21b6", "#4c1d95", "#8b5cf6", "#7c3aed"]
const COLORES_GRAVEDAD = { baja: "#3b82f6", media: "#f59e0b", alta: "#dc2626" }

const TooltipPersonalizado = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-2">
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                <p className="text-sm font-bold text-slate-800">{payload[0].value} reporte(s)</p>
            </div>
        )
    }
    return null
}

const TarjetaResumen = ({ titulo, valor, subtitulo, color }) => (
    <div className={`bg-white rounded-xl shadow p-5 border-l-4 ${color}`}>
        <p className="text-sm text-slate-500 mb-1">{titulo}</p>
        <p className="text-3xl font-black text-slate-800">{valor}</p>
        {subtitulo && <p className="text-xs text-slate-400 mt-1">{subtitulo}</p>}
    </div>
)

const Estadisticas = () => {
    const [data, setData] = useState(null)
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        const cargar = async () => {
            try {
                const res = await getEstadisticas()
                setData(res.data)
            } catch (error) {
                console.error(error)
            }
            setCargando(false)
        }
        cargar()
    }, [])

    if (cargando) return <p className="text-slate-400">Cargando estadísticas...</p>
    if (!data) return <p className="text-slate-500">No se pudieron cargar las estadísticas.</p>

    // ---- Preparar datos ----
    const dataMarca = (data.porMarca || []).map(m => ({ nombre: m._id, total: m.total }))
    const dataTipoFalla = (data.porTipoFalla || []).map(t => ({ nombre: t._id, total: t.total }))
    const dataGravedad = (data.porGravedad || []).filter(g => g.total > 0).map(g => ({ nombre: g._id, total: g.total }))
    // Bug fix: _id ya es un string "Marca Modelo"
    const dataModelo = (data.porModelo || []).map(m => ({ nombre: m._id, total: m.total }))

    const totalAlta = dataGravedad.find(g => g.nombre === "alta")?.total || 0
    const totalMedia = dataGravedad.find(g => g.nombre === "media")?.total || 0
    const totalBaja = dataGravedad.find(g => g.nombre === "baja")?.total || 0
    const marcaTop = dataMarca[0]?.nombre || "—"
    const fallaTop = dataTipoFalla[0]?.nombre || "—"

    return (
        <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-1">Estadísticas y tendencias</h1>
            <p className="text-slate-500 mb-6">Análisis basado en {data.total} reporte(s) verificado(s).</p>

            {data.total === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center text-slate-500">
                    Aún no hay reportes verificados para generar estadísticas.
                </div>
            ) : (
                <>
                    {/* Tarjetas resumen */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <TarjetaResumen titulo="Total reportes" valor={data.total} subtitulo="verificados" color="border-blue-900" />
                        <TarjetaResumen titulo="Gravedad alta" valor={totalAlta} subtitulo={`${Math.round(totalAlta / data.total * 100)}% del total`} color="border-red-500" />
                        <TarjetaResumen titulo="Marca más reportada" valor={marcaTop} subtitulo={`${dataMarca[0]?.total || 0} reportes`} color="border-amber-500" />
                        <TarjetaResumen titulo="Falla más frecuente" valor={fallaTop} subtitulo={`${dataTipoFalla[0]?.total || 0} reportes`} color="border-purple-500" />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">

                        {/* Reportes por marca */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-lg font-bold text-slate-700 mb-1">Reportes por marca</h2>
                            <p className="text-xs text-slate-400 mb-4">Top {dataMarca.length} marcas con más reportes</p>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={dataMarca} margin={{ top: 4, right: 8, bottom: 40, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="nombre" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                    <Tooltip content={<TooltipPersonalizado />} />
                                    <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                                        {dataMarca.map((_, i) => <Cell key={i} fill={COLORES_MARCA[i % COLORES_MARCA.length]} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Distribución por gravedad */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-lg font-bold text-slate-700 mb-1">Distribución por gravedad</h2>
                            <p className="text-xs text-slate-400 mb-4">Proporción de reportes según nivel de gravedad</p>
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie data={dataGravedad} dataKey="total" nameKey="nombre"
                                        cx="50%" cy="45%" outerRadius={95} innerRadius={45}
                                        label={({ nombre, total, percent }) =>
                                            `${nombre}: ${total} (${(percent * 100).toFixed(0)}%)`
                                        }
                                        labelLine={true}>
                                        {dataGravedad.map((entry, i) => (
                                            <Cell key={i} fill={COLORES_GRAVEDAD[entry.nombre] || "#94a3b8"} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(val, name) => [val, name]} />
                                    <Legend formatter={(val) => val.charAt(0).toUpperCase() + val.slice(1)} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Fallas más frecuentes */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-lg font-bold text-slate-700 mb-1">Fallas más frecuentes</h2>
                            <p className="text-xs text-slate-400 mb-4">Top {dataTipoFalla.length} tipos de falla reportados</p>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={dataTipoFalla} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                                    <YAxis type="category" dataKey="nombre" tick={{ fontSize: 11 }} width={160} />
                                    <Tooltip content={<TooltipPersonalizado />} />
                                    <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                                        {dataTipoFalla.map((_, i) => <Cell key={i} fill={COLORES_FALLA[i % COLORES_FALLA.length]} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Modelos más reportados */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-lg font-bold text-slate-700 mb-1">Modelos con más reportes</h2>
                            <p className="text-xs text-slate-400 mb-4">Top {dataModelo.length} modelos con mayor incidencia</p>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={dataModelo} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                                    <YAxis type="category" dataKey="nombre" tick={{ fontSize: 11 }} width={160} />
                                    <Tooltip content={<TooltipPersonalizado />} />
                                    <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                                        {dataModelo.map((_, i) => <Cell key={i} fill={COLORES_MARCA[i % COLORES_MARCA.length]} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                    </div>

                    {/* Resumen textual al pie */}
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-5">
                        <h3 className="font-bold text-blue-900 mb-2">Resumen del análisis</h3>
                        <p className="text-sm text-blue-800">
                            Se han analizado <strong>{data.total} reportes verificados</strong>. La marca con más incidencias es <strong>{marcaTop}</strong> y la falla más reportada es <strong>"{fallaTop}"</strong>.
                            El <strong>{Math.round(totalAlta / data.total * 100)}%</strong> de los reportes corresponde a fallas de gravedad alta,
                            el <strong>{Math.round(totalMedia / data.total * 100)}%</strong> a gravedad media
                            y el <strong>{Math.round(totalBaja / data.total * 100)}%</strong> a gravedad baja.
                        </p>
                    </div>
                </>
            )}
        </div>
    )
}

export default Estadisticas