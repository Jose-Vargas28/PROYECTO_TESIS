import Valoracion from "../models/Valoracion.js"
import Vehiculo from "../models/Vehiculo.js"

const ASPECTOS = ["confiabilidad", "seguridad", "consumo", "precio", "comodidad", "mantenimiento", "repuestos"]
const DIAS_EDICION = 30

// Calcular puntaje general de una valoración
const calcularPuntaje = (aspectos) => {
    const suma = ASPECTOS.reduce((acc, a) => acc + (aspectos[a] || 0), 0)
    return Math.round((suma / ASPECTOS.length) * 10) / 10
}

// Calcular promedio de valoraciones para un vehículo
const calcularPromedios = (valoraciones) => {
    if (valoraciones.length === 0) return null
    const sumas = {}
    ASPECTOS.forEach(a => sumas[a] = 0)
    valoraciones.forEach(v => ASPECTOS.forEach(a => sumas[a] += v.aspectos[a] || 0))
    const promedios = {}
    ASPECTOS.forEach(a => promedios[a] = Math.round((sumas[a] / valoraciones.length) * 10) / 10)
    const puntajeGeneral = Math.round(
        (ASPECTOS.reduce((acc, a) => acc + promedios[a], 0) / ASPECTOS.length) * 10
    ) / 10
    return { promedios, puntajeGeneral }
}

// CREAR O ACTUALIZAR VALORACIÓN
export const crearOActualizarValoracion = async (req, res) => {
    try {
        const { aspectos, comentario } = req.body
        const vehiculoId = req.params.vehiculoId

        // Validar que exista el vehículo
        const vehiculo = await Vehiculo.findById(vehiculoId)
        if (!vehiculo) return res.status(404).json({ msg: "Vehículo no encontrado" })

        // Validar aspectos
        for (const a of ASPECTOS) {
            const val = Number(aspectos?.[a])
            if (!val || val < 1 || val > 5) {
                return res.status(400).json({ msg: `El aspecto "${a}" debe ser entre 1 y 5` })
            }
        }

        // Verificar si ya existe valoración del usuario para este vehículo
        const existente = await Valoracion.findOne({
            vehiculo: vehiculoId,
            usuario: req.userBDD._id
        })

        if (existente) {
            // Verificar ventana de 30 días para editar
            const diasDesdeActualizacion = (new Date() - new Date(existente.updatedAt)) / (1000 * 60 * 60 * 24)
            if (diasDesdeActualizacion < DIAS_EDICION) {
                const diasRestantes = Math.ceil(DIAS_EDICION - diasDesdeActualizacion)
                return res.status(400).json({
                    msg: `Ya valoraste este vehículo. Podrás actualizar tu valoración en ${diasRestantes} día(s).`,
                    diasRestantes
                })
            }
            // Actualizar
            existente.aspectos = aspectos
            existente.comentario = comentario?.trim()?.slice(0, 500) || ""
            await existente.save()
            return res.status(200).json({ msg: "Valoración actualizada correctamente", valoracion: existente })
        }

        // Crear nueva
        const valoracion = new Valoracion({
            vehiculo: vehiculoId,
            usuario: req.userBDD._id,
            aspectos,
            comentario: comentario?.trim()?.slice(0, 500) || ""
        })
        await valoracion.save()
        res.status(201).json({ msg: "Valoración registrada correctamente", valoracion })

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ msg: "Ya tienes una valoración para este vehículo" })
        }
        console.error(error)
        res.status(500).json({ msg: "Error al guardar la valoración" })
    }
}

// OBTENER VALORACIONES DE UN VEHÍCULO
export const obtenerValoracionesVehiculo = async (req, res) => {
    try {
        const { vehiculoId } = req.params
        const pagina = parseInt(req.query.pagina) || 1
        const limite = 10
        const skip = (pagina - 1) * limite

        const vehiculo = await Vehiculo.findById(vehiculoId)
            .select("marca modelo anio tipo combustible fotos")
        if (!vehiculo) return res.status(404).json({ msg: "Vehículo no encontrado" })

        const total = await Valoracion.countDocuments({ vehiculo: vehiculoId })
        const valoraciones = await Valoracion.find({ vehiculo: vehiculoId })
            .populate("usuario", "nombre region provincia")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limite)

        // Calcular promedios con todas las valoraciones (no solo la página)
        const todasLasValoraciones = await Valoracion.find({ vehiculo: vehiculoId }).select("aspectos")
        const resumen = calcularPromedios(todasLasValoraciones)

        // Si el usuario está logueado, ver si ya valoró
        let miValoracion = null
        let puedoValorar = true
        let diasRestantes = 0

        if (req.userBDD) {
            miValoracion = await Valoracion.findOne({
                vehiculo: vehiculoId,
                usuario: req.userBDD._id
            })
            if (miValoracion) {
                const dias = (new Date() - new Date(miValoracion.updatedAt)) / (1000 * 60 * 60 * 24)
                puedoValorar = dias >= DIAS_EDICION
                diasRestantes = puedoValorar ? 0 : Math.ceil(DIAS_EDICION - dias)
            }
        }

        res.status(200).json({
            vehiculo,
            resumen,
            total,
            paginas: Math.ceil(total / limite),
            paginaActual: pagina,
            valoraciones,
            miValoracion,
            puedoValorar,
            diasRestantes
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error al obtener valoraciones" })
    }
}

// RANKING DE VEHÍCULOS POR CONFIABILIDAD
export const rankingConfiabilidad = async (req, res) => {
    try {
        const { tipo, marca, minValoraciones = 1 } = req.query

        // Agrupar valoraciones por vehículo
        const pipeline = [
            {
                $group: {
                    _id: "$vehiculo",
                    totalValoraciones: { $sum: 1 },
                    confiabilidad:  { $avg: "$aspectos.confiabilidad" },
                    seguridad:      { $avg: "$aspectos.seguridad" },
                    consumo:        { $avg: "$aspectos.consumo" },
                    precio:         { $avg: "$aspectos.precio" },
                    comodidad:      { $avg: "$aspectos.comodidad" },
                    mantenimiento:  { $avg: "$aspectos.mantenimiento" },
                    repuestos:      { $avg: "$aspectos.repuestos" }
                }
            },
            { $match: { totalValoraciones: { $gte: parseInt(minValoraciones) } } },
            {
                $addFields: {
                    puntajeGeneral: {
                        $round: [{
                            $avg: ["$confiabilidad", "$seguridad", "$consumo",
                                   "$precio", "$comodidad", "$mantenimiento", "$repuestos"]
                        }, 1]
                    }
                }
            },
            { $sort: { puntajeGeneral: -1 } }
        ]

        const resultados = await Valoracion.aggregate(pipeline)

        // Popular datos del vehículo
        const vehiculoIds = resultados.map(r => r._id)
        let filtroVehiculo = { _id: { $in: vehiculoIds } }
        if (tipo) filtroVehiculo.tipo = tipo
        if (marca) filtroVehiculo.marca = { $regex: marca, $options: "i" }

        const vehiculos = await Vehiculo.find(filtroVehiculo)
            .select("marca modelo anio tipo combustible fotos")

        const vehiculoMap = {}
        vehiculos.forEach(v => vehiculoMap[v._id.toString()] = v)

        const ranking = resultados
            .filter(r => vehiculoMap[r._id.toString()])
            .map(r => ({
                vehiculo: vehiculoMap[r._id.toString()],
                totalValoraciones: r.totalValoraciones,
                puntajeGeneral: Math.round(r.puntajeGeneral * 10) / 10,
                aspectos: {
                    confiabilidad:  Math.round(r.confiabilidad * 10) / 10,
                    seguridad:      Math.round(r.seguridad * 10) / 10,
                    consumo:        Math.round(r.consumo * 10) / 10,
                    precio:         Math.round(r.precio * 10) / 10,
                    comodidad:      Math.round(r.comodidad * 10) / 10,
                    mantenimiento:  Math.round(r.mantenimiento * 10) / 10,
                    repuestos:      Math.round(r.repuestos * 10) / 10
                }
            }))

        res.status(200).json({ ranking, total: ranking.length })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error al obtener el ranking" })
    }
}

// ELIMINAR VALORACIÓN PROPIA
export const eliminarValoracion = async (req, res) => {
    try {
        const valoracion = await Valoracion.findOne({
            _id: req.params.id,
            usuario: req.userBDD._id
        })
        if (!valoracion) return res.status(404).json({ msg: "Valoración no encontrada" })
        await valoracion.deleteOne()
        res.status(200).json({ msg: "Valoración eliminada" })
    } catch (error) {
        res.status(500).json({ msg: "Error al eliminar" })
    }
}
