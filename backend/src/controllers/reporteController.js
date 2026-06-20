import Reporte from "../models/Reporte.js"
import User from "../models/User.js"
import {
    sendMailReporteVerificado,
    sendMailReporteInvalidado,
    sendMailReporteEliminado
} from "../config/nodemailer.js"

const LIMITE_HORAS = 48
const LIMITE_REPORTES_DIARIOS = 5

const dentroDeVentana = (reporte) => {
    const horas = (new Date() - new Date(reporte.createdAt)) / (1000 * 60 * 60)
    return horas <= LIMITE_HORAS
}

// Populate reutilizable para traer vehículo, falla y usuario
const popReporte = (query) =>
    query
        .populate("vehiculo", "marca modelo anio tipo combustible")
        .populate("falla", "nombre descripcion")
        .populate("usuario", "nombre email region provincia")
        .populate("validadoPor", "nombre email")

// CREAR REPORTE
export const crearReporte = async (req, res) => {
    try {
        const { vehiculo, falla, descripcion, gravedad } = req.body

        if (!vehiculo || !falla) {
            return res.status(400).json({ msg: "Debes seleccionar un vehículo y una falla" })
        }

        // Límite diario (solo usuarios normales)
        if (req.userBDD.rol !== "admin") {
            const inicioDelDia = new Date(); inicioDelDia.setHours(0, 0, 0, 0)
            const finDelDia = new Date(); finDelDia.setHours(23, 59, 59, 999)
            const reportesHoy = await Reporte.countDocuments({
                usuario: req.userBDD._id,
                createdAt: { $gte: inicioDelDia, $lte: finDelDia }
            })
            if (reportesHoy >= LIMITE_REPORTES_DIARIOS) {
                return res.status(429).json({
                    msg: `Has alcanzado el límite de ${LIMITE_REPORTES_DIARIOS} reportes por día. Intenta nuevamente mañana.`
                })
            }
        }

        const reporte = new Reporte({
            vehiculo,
            falla,
            descripcion,
            gravedad,
            usuario: req.userBDD._id
        })

        await reporte.save()
        res.status(201).json({
            msg: "Reporte registrado. Quedará visible públicamente una vez sea verificado.",
            reporteId: reporte._id
        })

    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error en el servidor" })
    }
}

// REPORTES PÚBLICOS - activos y verificados, con paginación y filtros
export const obtenerReportes = async (req, res) => {
    try {
        const pagina = parseInt(req.query.pagina) || 1
        const limite = 10
        const skip = (pagina - 1) * limite
        const { busqueda, gravedad } = req.query

        // Construir filtro dinámico
        let filtro = { activo: true, validado: true }
        if (gravedad) filtro.gravedad = gravedad

        // Si hay búsqueda, necesitamos filtrar por campos del populate
        // Primero buscamos los IDs de vehículos y fallas que coincidan
        if (busqueda) {
            const Vehiculo = (await import("../models/Vehiculo.js")).default
            const Falla = (await import("../models/Falla.js")).default
            const regex = { $regex: busqueda, $options: "i" }

            const vehiculosMatch = await Vehiculo.find({
                $or: [{ marca: regex }, { modelo: regex }]
            }).select("_id")

            const fallasMatch = await Falla.find({ nombre: regex }).select("_id")

            filtro.$or = [
                { vehiculo: { $in: vehiculosMatch.map(v => v._id) } },
                { falla: { $in: fallasMatch.map(f => f._id) } }
            ]
        }

        const total = await Reporte.countDocuments(filtro)
        const reportes = await popReporte(
            Reporte.find(filtro).sort({ createdAt: -1 }).skip(skip).limit(limite)
        )

        res.status(200).json({
            reportes,
            total,
            paginas: Math.ceil(total / limite),
            paginaActual: pagina
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error al obtener reportes" })
    }
}

// MIS REPORTES con paginación y búsqueda
export const obtenerMisReportes = async (req, res) => {
    try {
        const pagina = parseInt(req.query.pagina) || 1
        const limite = 10
        const skip = (pagina - 1) * limite
        const busqueda = req.query.busqueda || ""

        let filtro = { usuario: req.userBDD._id, activo: true }

        if (busqueda) {
            const Vehiculo = (await import("../models/Vehiculo.js")).default
            const Falla = (await import("../models/Falla.js")).default
            const regex = { $regex: busqueda, $options: "i" }
            const vehiculosMatch = await Vehiculo.find({ $or: [{ marca: regex }, { modelo: regex }] }).select("_id")
            const fallasMatch = await Falla.find({ nombre: regex }).select("_id")
            filtro.$or = [
                { vehiculo: { $in: vehiculosMatch.map(v => v._id) } },
                { falla: { $in: fallasMatch.map(f => f._id) } }
            ]
        }

        const total = await Reporte.countDocuments(filtro)
        const reportes = await popReporte(
            Reporte.find(filtro).sort({ createdAt: -1 }).skip(skip).limit(limite)
        )

        const conPermiso = reportes.map(r => {
            const obj = r.toObject()
            obj.puedeModificar = req.userBDD.rol === "admin" ? true : dentroDeVentana(r)
            obj.estado = r.validado ? "validado" : "pendiente"
            return obj
        })

        res.status(200).json({
            reportes: conPermiso,
            total,
            paginas: Math.ceil(total / limite),
            paginaActual: pagina
        })
    } catch (error) {
        res.status(500).json({ msg: "Error al obtener tus reportes" })
    }
}

// REPORTES PENDIENTES (admin) con paginación y búsqueda
export const obtenerReportesPendientes = async (req, res) => {
    try {
        const pagina = parseInt(req.query.pagina) || 1
        const limite = 10
        const skip = (pagina - 1) * limite
        const busqueda = req.query.busqueda || ""

        let filtro = { activo: true, validado: false }

        if (busqueda) {
            const Vehiculo = (await import("../models/Vehiculo.js")).default
            const Falla = (await import("../models/Falla.js")).default
            const regex = { $regex: busqueda, $options: "i" }
            const vehiculosMatch = await Vehiculo.find({ $or: [{ marca: regex }, { modelo: regex }] }).select("_id")
            const fallasMatch = await Falla.find({ nombre: regex }).select("_id")
            filtro.$or = [
                { vehiculo: { $in: vehiculosMatch.map(v => v._id) } },
                { falla: { $in: fallasMatch.map(f => f._id) } }
            ]
        }

        const total = await Reporte.countDocuments(filtro)
        const reportes = await popReporte(
            Reporte.find(filtro).sort({ createdAt: 1 }).skip(skip).limit(limite)
        )

        res.status(200).json({
            reportes,
            total,
            paginas: Math.ceil(total / limite),
            paginaActual: pagina
        })
    } catch (error) {
        res.status(500).json({ msg: "Error al obtener reportes pendientes" })
    }
}

// DETALLE
export const detalleReporte = async (req, res) => {
    try {
        const reporte = await popReporte(Reporte.findById(req.params.id))
        if (!reporte || !reporte.activo) {
            return res.status(404).json({ msg: "Reporte no encontrado" })
        }
        res.status(200).json(reporte)
    } catch (error) {
        res.status(500).json({ msg: "Error al obtener el reporte" })
    }
}

// ACTUALIZAR
export const actualizarReporte = async (req, res) => {
    try {
        const reporte = await Reporte.findById(req.params.id)
        if (!reporte || !reporte.activo) {
            return res.status(404).json({ msg: "Reporte no encontrado" })
        }
        const esDueno = reporte.usuario.toString() === req.userBDD._id.toString()
        const esAdmin = req.userBDD.rol === "admin"
        if (!esDueno && !esAdmin) {
            return res.status(403).json({ msg: "No tienes permiso para editar este reporte" })
        }
        if (esDueno && !esAdmin && !dentroDeVentana(reporte)) {
            return res.status(403).json({ msg: `Solo puedes editar dentro de las primeras ${LIMITE_HORAS} horas` })
        }

        // Solo se permiten cambiar estos campos
        const { descripcion, gravedad, vehiculo, falla } = req.body
        if (descripcion !== undefined) reporte.descripcion = descripcion
        if (gravedad !== undefined) reporte.gravedad = gravedad
        if (vehiculo !== undefined) reporte.vehiculo = vehiculo
        if (falla !== undefined) reporte.falla = falla

        await reporte.save()
        res.status(200).json({ msg: "Reporte actualizado correctamente" })
    } catch (error) {
        res.status(500).json({ msg: "Error al actualizar" })
    }
}

// ELIMINAR (borrado lógico)
export const eliminarReporte = async (req, res) => {
    try {
        const reporte = await Reporte.findById(req.params.id)
        if (!reporte || !reporte.activo) {
            return res.status(404).json({ msg: "Reporte no encontrado" })
        }
        const esDueno = reporte.usuario.toString() === req.userBDD._id.toString()
        const esAdmin = req.userBDD.rol === "admin"
        if (!esDueno && !esAdmin) {
            return res.status(403).json({ msg: "No tienes permiso para eliminar este reporte" })
        }
        if (esDueno && !esAdmin && !dentroDeVentana(reporte)) {
            return res.status(403).json({ msg: `Solo puedes eliminar dentro de las primeras ${LIMITE_HORAS} horas` })
        }
        // Guardar datos antes de eliminar para el correo
        const reportePoblado = await popReporte(Reporte.findById(req.params.id))

        reporte.activo = false
        reporte.eliminadoEn = new Date()
        reporte.eliminadoPor = req.userBDD._id
        await reporte.save()

        // Si el admin elimina el reporte de OTRO usuario, notificarle por correo
        // Si el admin elimina su propio reporte, solo borrado sin correo
        if (esAdmin && !esDueno) {
            const motivo = req.body?.motivo || "El reporte no cumple con las normas de la plataforma."
            const usuario = await User.findById(reporte.usuario)
            if (usuario?.email) {
                const vehiculo = reportePoblado?.vehiculo
                    ? `${reportePoblado.vehiculo.marca} ${reportePoblado.vehiculo.modelo} ${reportePoblado.vehiculo.anio}`
                    : "Vehículo"
                const falla = reportePoblado?.falla?.nombre || "Falla reportada"
                sendMailReporteEliminado(usuario.email, usuario.nombre, vehiculo, falla, motivo)
            }
        }

        res.status(200).json({ msg: "Reporte eliminado correctamente" })
    } catch (error) {
        res.status(500).json({ msg: "Error al eliminar" })
    }
}

// RESTAURAR (admin)
export const restaurarReporte = async (req, res) => {
    try {
        const reporte = await Reporte.findById(req.params.id)
        if (!reporte) return res.status(404).json({ msg: "Reporte no encontrado" })
        if (reporte.activo) return res.status(400).json({ msg: "El reporte no está eliminado" })
        reporte.activo = true
        reporte.eliminadoEn = null
        reporte.eliminadoPor = null
        await reporte.save()
        res.status(200).json({ msg: "Reporte restaurado correctamente" })
    } catch (error) {
        res.status(500).json({ msg: "Error al restaurar" })
    }
}

// ELIMINADOS (admin) con paginación y búsqueda
export const obtenerReportesEliminados = async (req, res) => {
    try {
        const pagina = parseInt(req.query.pagina) || 1
        const limite = 10
        const skip = (pagina - 1) * limite
        const busqueda = req.query.busqueda || ""

        let filtro = { activo: false }

        if (busqueda) {
            const Vehiculo = (await import("../models/Vehiculo.js")).default
            const Falla = (await import("../models/Falla.js")).default
            const regex = { $regex: busqueda, $options: "i" }
            const vehiculosMatch = await Vehiculo.find({ $or: [{ marca: regex }, { modelo: regex }] }).select("_id")
            const fallasMatch = await Falla.find({ nombre: regex }).select("_id")
            filtro.$or = [
                { vehiculo: { $in: vehiculosMatch.map(v => v._id) } },
                { falla: { $in: fallasMatch.map(f => f._id) } }
            ]
        }

        const total = await Reporte.countDocuments(filtro)
        const reportes = await popReporte(
            Reporte.find(filtro).populate("eliminadoPor", "nombre email").sort({ eliminadoEn: -1 }).skip(skip).limit(limite)
        )

        res.status(200).json({
            reportes,
            total,
            paginas: Math.ceil(total / limite),
            paginaActual: pagina
        })
    } catch (error) {
        res.status(500).json({ msg: "Error al obtener reportes eliminados" })
    }
}

// VALIDAR (admin)
export const validarReporte = async (req, res) => {
    try {
        const reporte = await Reporte.findOne({ _id: req.params.id, activo: true })
        if (!reporte) return res.status(404).json({ msg: "Reporte no encontrado" })
        reporte.validado = true
        reporte.validadoEn = new Date()
        reporte.validadoPor = req.userBDD._id
        await reporte.save()

        // Notificar al usuario por correo
        const usuario = await User.findById(reporte.usuario)
        if (usuario?.email) {
            const vehiculo = reporte.vehiculo
                ? `${reporte.vehiculo.marca} ${reporte.vehiculo.modelo} ${reporte.vehiculo.anio}`
                : "Vehículo"
            const falla = reporte.falla?.nombre || "Falla reportada"
            sendMailReporteVerificado(usuario.email, usuario.nombre, vehiculo, falla, reporte._id)
        }

        res.status(200).json({ msg: "Reporte validado correctamente" })
    } catch (error) {
        res.status(500).json({ msg: "Error al validar" })
    }
}

// INVALIDAR (admin)
export const invalidarReporte = async (req, res) => {
    try {
        const { motivo } = req.body
        if (!motivo) {
            return res.status(400).json({ msg: "Debes indicar el motivo para retirar la verificación" })
        }

        const reporte = await popReporte(Reporte.findOne({ _id: req.params.id, activo: true }))
        if (!reporte) return res.status(404).json({ msg: "Reporte no encontrado" })

        reporte.validado = false
        reporte.validadoEn = null
        reporte.validadoPor = null
        await reporte.save()

        // Notificar al usuario por correo
        const usuario = await User.findById(reporte.usuario)
        if (usuario?.email) {
            const vehiculo = reporte.vehiculo
                ? `${reporte.vehiculo.marca} ${reporte.vehiculo.modelo} ${reporte.vehiculo.anio}`
                : "Vehículo"
            const falla = reporte.falla?.nombre || "Falla reportada"
            sendMailReporteInvalidado(usuario.email, usuario.nombre, vehiculo, falla, motivo)
        }

        res.status(200).json({ msg: "Validación retirada correctamente" })
    } catch (error) {
        res.status(500).json({ msg: "Error al invalidar" })
    }
}

// ESTADÍSTICAS - solo verificados, agrupando por vehículo y falla
export const estadisticas = async (req, res) => {
    try {
        const filtro = { activo: true, validado: true }

        // Traemos los reportes con sus referencias pobladas y agrupamos en JS
        const reportes = await popReporte(Reporte.find(filtro))

        // Por marca
        const marcaMap = {}
        const modeloMap = {}
        const fallaMap = {}
        const gravedadMap = { baja: 0, media: 0, alta: 0 }

        reportes.forEach(r => {
            const marca = r.vehiculo?.marca || "N/D"
            const modelo = r.vehiculo ? `${r.vehiculo.marca} ${r.vehiculo.modelo}` : "N/D"
            const falla = r.falla?.nombre || "N/D"

            marcaMap[marca] = (marcaMap[marca] || 0) + 1
            modeloMap[modelo] = (modeloMap[modelo] || 0) + 1
            fallaMap[falla] = (fallaMap[falla] || 0) + 1
            if (r.gravedad) gravedadMap[r.gravedad] = (gravedadMap[r.gravedad] || 0) + 1
        })

        const aArray = (obj) => Object.entries(obj)
            .map(([k, v]) => ({ _id: k, total: v }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 10)

        res.status(200).json({
            total: reportes.length,
            porMarca: aArray(marcaMap),
            porModelo: aArray(modeloMap),
            porTipoFalla: aArray(fallaMap),
            porGravedad: Object.entries(gravedadMap).map(([k, v]) => ({ _id: k, total: v }))
        })

    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error al obtener estadísticas" })
    }
}
