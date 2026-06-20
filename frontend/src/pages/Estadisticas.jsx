import { useEffect, useState } from "react"
import { getEstadisticas } from "../services/reporteService"
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from "recharts"

const COLORES = ["#1e3a8a", "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"]
const COLORES_GRAVEDAD = { baja: "#3b82f6", media: "#f59e0b", alta: "#dc2626" }

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

    // Preparar datos para los gráficos
    const dataMarca = data.porMarca?.map((m) => ({ nombre: m._id, total: m.total })) || []
    const dataTipoFalla = data.porTipoFalla?.map((t) => ({ nombre: t._id, total: t.total })) || []
    const dataGravedad = data.porGravedad?.map((g) => ({ nombre: g._id, total: g.total })) || []
    const dataModelo = data.porModelo?.map((m) => ({
        nombre: `${m._id.marca} ${m._id.modelo}`,
        total: m.total
    })) || []

    return (
        <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Estadísticas y tendencias</h1>
            <p className="text-slate-500 mb-6">
                Análisis basado en {data.total} reportes verificados.
            </p>

            {data.total === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center text-slate-500">
                    Aún no hay reportes verificados para generar estadísticas.
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Por marca */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-lg font-bold text-slate-700 mb-4">Reportes por marca</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={dataMarca}>
                                <XAxis dataKey="nombre" tick={{ fontSize: 12 }} />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="total" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Modelos más reportados (tendencia) */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-lg font-bold text-slate-700 mb-4">Vehículos con más reportes</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={dataModelo} layout="vertical">
                                <XAxis type="number" allowDecimals={false} />
                                <YAxis type="category" dataKey="nombre" tick={{ fontSize: 11 }} width={120} />
                                <Tooltip />
                                <Bar dataKey="total" fill="#2563eb" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Por tipo de falla */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-lg font-bold text-slate-700 mb-4">Fallas más frecuentes</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={dataTipoFalla}>
                                <XAxis dataKey="nombre" tick={{ fontSize: 12 }} />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Por gravedad */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-lg font-bold text-slate-700 mb-4">Distribución por gravedad</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={dataGravedad}
                                    dataKey="total"
                                    nameKey="nombre"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    label
                                >
                                    {dataGravedad.map((entry, i) => (
                                        <Cell key={i} fill={COLORES_GRAVEDAD[entry.nombre] || COLORES[i % COLORES.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Estadisticas
