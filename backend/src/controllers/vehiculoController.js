import Vehiculo from "../models/Vehiculo.js"
import Reporte from "../models/Reporte.js"

const LIMITE_DIARIO = 5

// CREAR VEHÍCULO (cualquier usuario logueado)
export const crearVehiculo = async (req, res) => {
    try {
        let { marca, modelo, anio } = req.body

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

        // Normalizamos para evitar duplicados por mayúsculas/espacios
        marca = marca.trim()
        modelo = modelo.trim()
        anio = Number(anio)
        const tipo = req.body.tipo || 'automóvil'
        const combustible = req.body.combustible || 'gasolina'

        // Validar que no exista la misma combinación (insensible a mayúsculas)
        const existe = await Vehiculo.findOne({
            marca: { $regex: `^${marca}$`, $options: "i" },
            modelo: { $regex: `^${modelo}$`, $options: "i" },
            anio
        })

        if (existe) {
            return res.status(400).json({ msg: `El vehículo ${marca} ${modelo} ${anio} ya existe` })
        }

        const vehiculo = new Vehiculo({ marca, modelo, anio, tipo, combustible, creadoPor: req.userBDD._id })
        await vehiculo.save()

        res.status(201).json({ msg: "Vehículo registrado correctamente", vehiculo })

    } catch (error) {
        // Error de índice único duplicado
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
        const limite = 10
        const skip = (pagina - 1) * limite
        const busqueda = req.query.busqueda || ""

        const filtro = busqueda ? {
            $or: [
                { marca: { $regex: busqueda, $options: "i" } },
                { modelo: { $regex: busqueda, $options: "i" } }
            ]
        } : {}

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
        // Verificar si hay reportes asociados a este vehículo
        const totalReportes = await Reporte.countDocuments({
            vehiculo: req.params.id,
            activo: true
        })

        if (totalReportes > 0) {
            return res.status(400).json({
                msg: `No se puede eliminar: este vehículo tiene ${totalReportes} reporte(s) asociado(s). Usa "Editar" para corregir los datos si hay un error.`
            })
        }

        await Vehiculo.findByIdAndDelete(req.params.id)
        res.status(200).json({ msg: "Vehículo eliminado correctamente" })
    } catch (error) {
        res.status(500).json({ msg: "Error al eliminar el vehículo" })
    }
}

// ACTUALIZAR VEHÍCULO
export const actualizarVehiculo = async (req, res) => {
    try {
        let { marca, modelo, anio } = req.body
        if (!marca || !modelo || !anio) {
            return res.status(400).json({ msg: "Marca, modelo y año son obligatorios" })
        }
        marca = marca.trim()
        modelo = modelo.trim()
        anio = Number(anio)

        // Verificar que no exista otro vehículo con los mismos datos (excluyendo el actual)
        const existe = await Vehiculo.findOne({
            _id: { $ne: req.params.id },
            marca: { $regex: `^${marca}$`, $options: "i" },
            modelo: { $regex: `^${modelo}$`, $options: "i" },
            anio
        })
        if (existe) {
            return res.status(400).json({ msg: `Ya existe el vehículo ${marca} ${modelo} ${anio}` })
        }

        const tipo = req.body.tipo || 'automóvil'
        const combustible = req.body.combustible || 'gasolina'
        await Vehiculo.findByIdAndUpdate(req.params.id, { marca, modelo, anio, tipo, combustible }, { new: true })
        res.status(200).json({ msg: "Vehículo actualizado correctamente" })

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ msg: "Ese vehículo ya existe" })
        }
        res.status(500).json({ msg: "Error al actualizar el vehículo" })
    }
}
