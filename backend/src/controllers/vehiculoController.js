import Vehiculo from "../models/Vehiculo.js"
import Reporte from "../models/Reporte.js"
import cloudinary from "../config/cloudinary.js"
import fs from "fs-extra"

const LIMITE_DIARIO = 5
const MAX_FOTOS = 5

// CREAR VEHÍCULO (cualquier usuario logueado)
export const crearVehiculo = async (req, res) => {
    try {
        let { marca, modelo, anio, version } = req.body

        if (!marca || !modelo || !anio) {
            return res.status(400).json({ msg: "Marca, modelo y año son obligatorios" })
        }

        // Límite diario (solo usuarios normales, admin sin límite)
        if (req.userBDD.rol !== "admin") {
            const inicioDelDia = new Date(); inicioDelDia.setHours(0, 0, 0, 0)
            const finDelDia = new Date(); finDelDia.setHours(23, 59, 59, 999)
            const creadosHoy = await Vehiculo.countDocuments({
                creadoPor: req.userBDD._id,
                createdAt: { $gte: inicioDelDia, $lte: finDelDia }
            })
            if (creadosHoy >= LIMITE_DIARIO) {
                return res.status(429).json({
                    msg: `Has alcanzado el límite de ${LIMITE_DIARIO} vehículos por día. Intenta nuevamente mañana.`
                })
            }
        }

        marca = marca.trim()
        modelo = modelo.trim()
        anio = Number(anio)
        version = (version || "").trim().slice(0, 20)
        const tipo = req.body.tipo || "automóvil"
        const combustible = req.body.combustible || "gasolina"

        // Validar duplicado incluyendo versión
        const existe = await Vehiculo.findOne({
            marca: { $regex: `^${marca}$`, $options: "i" },
            modelo: { $regex: `^${modelo}$`, $options: "i" },
            anio,
            version: { $regex: `^${version}$`, $options: "i" }
        })

        if (existe) {
            const nombreCompleto = version
                ? `${marca} ${modelo} ${anio} ${version}`
                : `${marca} ${modelo} ${anio}`
            return res.status(400).json({ msg: `El vehículo "${nombreCompleto}" ya existe` })
        }

        const vehiculo = new Vehiculo({ marca, modelo, anio, version, tipo, combustible, creadoPor: req.userBDD._id })
        await vehiculo.save()

        res.status(201).json({ msg: "Vehículo registrado correctamente", vehiculo })

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ msg: "Ese vehículo ya existe" })
        }
        console.error(error)
        res.status(500).json({ msg: "Error al crear el vehículo" })
    }
}

// LISTAR TODOS LOS VEHÍCULOS
export const listarVehiculos = async (req, res) => {
    try {
        const pagina = parseInt(req.query.pagina) || 1
        const limite = parseInt(req.query.limite) || 10
        const skip = (pagina - 1) * limite
        const busqueda = req.query.busqueda || ""
        const tipo = req.query.tipo || ""
        const marca = req.query.marca || ""

        const filtro = {}

        if (busqueda) {
            filtro.$or = [
                { marca: { $regex: busqueda, $options: "i" } },
                { modelo: { $regex: busqueda, $options: "i" } }
            ]
        }
        if (tipo) filtro.tipo = tipo
        if (marca) filtro.marca = { $regex: `^${marca}$`, $options: "i" }

        const total = await Vehiculo.countDocuments(filtro)
        const vehiculos = await Vehiculo.find(filtro)
            .populate("creadoPor", "nombre")
            .sort({ marca: 1, modelo: 1, anio: -1 })
            .skip(skip)
            .limit(limite)

        const vehiculosConStats = await Promise.all(vehiculos.map(async (v) => {
            const obj = v.toObject()
            obj.totalReportes = await Reporte.countDocuments({ vehiculo: v._id, activo: true })
            return obj
        }))

        res.status(200).json({
            vehiculos: vehiculosConStats,
            total,
            paginas: Math.ceil(total / limite),
            paginaActual: pagina
        })
    } catch (error) {
        res.status(500).json({ msg: "Error al obtener vehículos" })
    }
}

// ELIMINAR VEHÍCULO (solo admin)
export const eliminarVehiculo = async (req, res) => {
    try {
        const totalReportes = await Reporte.countDocuments({
            vehiculo: req.params.id,
            activo: true
        })

        if (totalReportes > 0) {
            return res.status(400).json({
                msg: `No se puede eliminar: este vehículo tiene ${totalReportes} reporte(s) asociado(s). Usa "Editar" para corregir los datos si hay un error.`
            })
        }

        // Eliminar fotos de Cloudinary antes de borrar el vehículo
        const vehiculo = await Vehiculo.findById(req.params.id)
        if (vehiculo?.fotos?.length > 0) {
            await Promise.all(vehiculo.fotos.map(f => cloudinary.uploader.destroy(f.publicId)))
        }

        await Vehiculo.findByIdAndDelete(req.params.id)
        res.status(200).json({ msg: "Vehículo eliminado correctamente" })
    } catch (error) {
        res.status(500).json({ msg: "Error al eliminar el vehículo" })
    }
}

// ACTUALIZAR VEHÍCULO (solo admin)
export const actualizarVehiculo = async (req, res) => {
    try {
        let { marca, modelo, anio, version } = req.body
        if (!marca || !modelo || !anio) {
            return res.status(400).json({ msg: "Marca, modelo y año son obligatorios" })
        }
        marca = marca.trim()
        modelo = modelo.trim()
        anio = Number(anio)
        version = (version || "").trim().slice(0, 20)

        const existe = await Vehiculo.findOne({
            _id: { $ne: req.params.id },
            marca: { $regex: `^${marca}$`, $options: "i" },
            modelo: { $regex: `^${modelo}$`, $options: "i" },
            anio,
            version: { $regex: `^${version}$`, $options: "i" }
        })
        if (existe) {
            return res.status(400).json({ msg: `Ya existe el vehículo ${marca} ${modelo} ${anio} ${version}`.trim() })
        }

        const tipo = req.body.tipo || "automóvil"
        const combustible = req.body.combustible || "gasolina"
        await Vehiculo.findByIdAndUpdate(req.params.id, { marca, modelo, anio, version, tipo, combustible }, { new: true })
        res.status(200).json({ msg: "Vehículo actualizado correctamente" })

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ msg: "Ese vehículo ya existe" })
        }
        res.status(500).json({ msg: "Error al actualizar el vehículo" })
    }
}

// SUBIR FOTO DE VEHÍCULO (solo admin)
export const subirFotoVehiculo = async (req, res) => {
    try {
        const vehiculo = await Vehiculo.findById(req.params.id)
        if (!vehiculo) return res.status(404).json({ msg: "Vehículo no encontrado" })

        if (!req.files?.foto) return res.status(400).json({ msg: "No se envió ninguna imagen" })

        if (vehiculo.fotos.length >= MAX_FOTOS) {
            return res.status(400).json({ msg: `Solo se permiten hasta ${MAX_FOTOS} fotos por vehículo` })
        }

        const archivo = req.files.foto
        const resultado = await cloudinary.uploader.upload(archivo.tempFilePath, {
            folder: "autoreporta/vehiculos",
            transformation: [{ width: 800, height: 500, crop: "fill", quality: "auto" }]
        })
        await fs.unlink(archivo.tempFilePath)

        // La primera foto que se sube es la principal automáticamente
        const esPrincipal = vehiculo.fotos.length === 0

        vehiculo.fotos.push({
            url: resultado.secure_url,
            publicId: resultado.public_id,
            principal: esPrincipal
        })
        await vehiculo.save()

        res.status(200).json({ msg: "Foto subida correctamente", fotos: vehiculo.fotos })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error al subir la foto" })
    }
}

// ELIMINAR FOTO DE VEHÍCULO (solo admin)
export const eliminarFotoVehiculo = async (req, res) => {
    try {
        const vehiculo = await Vehiculo.findById(req.params.id)
        if (!vehiculo) return res.status(404).json({ msg: "Vehículo no encontrado" })

        const foto = vehiculo.fotos.id(req.params.fotoId)
        if (!foto) return res.status(404).json({ msg: "Foto no encontrada" })

        const eraPrincipal = foto.principal

        await cloudinary.uploader.destroy(foto.publicId)
        vehiculo.fotos.pull(req.params.fotoId)

        // Si se eliminó la principal y quedan fotos, la primera pasa a ser principal
        if (eraPrincipal && vehiculo.fotos.length > 0) {
            vehiculo.fotos[0].principal = true
        }

        await vehiculo.save()
        res.status(200).json({ msg: "Foto eliminada correctamente", fotos: vehiculo.fotos })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error al eliminar la foto" })
    }
}

// REORDENAR FOTOS (solo admin)
export const reordenarFotos = async (req, res) => {
    try {
        const vehiculo = await Vehiculo.findById(req.params.id)
        if (!vehiculo) return res.status(404).json({ msg: "Vehículo no encontrado" })

        const { orden } = req.body
        if (!Array.isArray(orden)) return res.status(400).json({ msg: "Orden inválido" })

        const fotosOrdenadas = orden
            .map(id => vehiculo.fotos.id(id))
            .filter(Boolean)

        // La primera siempre es la principal
        fotosOrdenadas.forEach((f, i) => { f.principal = i === 0 })

        vehiculo.fotos = fotosOrdenadas
        await vehiculo.save()

        res.status(200).json({ msg: "Fotos reordenadas", fotos: vehiculo.fotos })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error al reordenar fotos" })
    }
}

// GUARDAR FOTO DE PEXELS como foto manual (solo admin)
export const guardarFotoPexels = async (req, res) => {
    try {
        const vehiculo = await Vehiculo.findById(req.params.id)
        if (!vehiculo) return res.status(404).json({ msg: "Vehículo no encontrado" })

        if (vehiculo.fotos.length >= MAX_FOTOS) {
            return res.status(400).json({ msg: `Solo se permiten hasta ${MAX_FOTOS} fotos por vehículo` })
        }

        const { url } = req.body
        if (!url) return res.status(400).json({ msg: "URL de la foto requerida" })

        // Cloudinary acepta URLs directamente — no hay que descargar el archivo
        const resultado = await cloudinary.uploader.upload(url, {
            folder: "autoreporta/vehiculos",
            transformation: [{ width: 800, height: 500, crop: "fill", quality: "auto" }]
        })

        const esPrincipal = vehiculo.fotos.length === 0
        vehiculo.fotos.push({
            url: resultado.secure_url,
            publicId: resultado.public_id,
            principal: esPrincipal,
            esPexels: true,
            urlOriginal: url
        })
        await vehiculo.save()

        res.status(200).json({ msg: "Foto guardada correctamente", fotos: vehiculo.fotos })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error al guardar la foto" })
    }
}

// OCULTAR / MOSTRAR FOTO AUTOMÁTICA (solo admin)
export const toggleFotoAuto = async (req, res) => {
    try {
        const vehiculo = await Vehiculo.findById(req.params.id)
        if (!vehiculo) return res.status(404).json({ msg: "Vehículo no encontrado" })

        vehiculo.ocultarFotoAuto = !vehiculo.ocultarFotoAuto
        await vehiculo.save()

        res.status(200).json({
            msg: vehiculo.ocultarFotoAuto
                ? "Foto automática ocultada"
                : "Foto automática activada",
            ocultarFotoAuto: vehiculo.ocultarFotoAuto
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error al actualizar" })
    }
}

// MARCAR FOTO COMO PRINCIPAL (solo admin)
export const marcarFotoPrincipal = async (req, res) => {
    try {
        const vehiculo = await Vehiculo.findById(req.params.id)
        if (!vehiculo) return res.status(404).json({ msg: "Vehículo no encontrado" })

        const foto = vehiculo.fotos.id(req.params.fotoId)
        if (!foto) return res.status(404).json({ msg: "Foto no encontrada" })

        // Quitar principal de todas y asignar a la seleccionada
        vehiculo.fotos.forEach(f => { f.principal = false })
        foto.principal = true

        await vehiculo.save()
        res.status(200).json({ msg: "Foto principal actualizada", fotos: vehiculo.fotos })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error al actualizar la foto principal" })
    }
}