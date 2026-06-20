import User from "../models/User.js"
import Reporte from "../models/Reporte.js"

// LISTAR USUARIOS con conteo de reportes y paginación
export const listarUsuarios = async (req, res) => {
    try {
        const pagina = parseInt(req.query.pagina) || 1
        const limite = 10
        const skip = (pagina - 1) * limite
        const busqueda = req.query.busqueda || ""

        const region = req.query.region || ""
        const provincia = req.query.provincia || ""

        const filtro = {
            rol: "usuario",
            eliminado: { $ne: true },
            ...(busqueda && {
                $or: [
                    { nombre: { $regex: busqueda, $options: "i" } },
                    { email: { $regex: busqueda, $options: "i" } }
                ]
            }),
            ...(region && { region }),
            ...(provincia && { provincia })
        }

        const total = await User.countDocuments(filtro)
        const usuarios = await User.find(filtro)
            .select("-password -token -confirmEmail -__v")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limite)

        const usuariosConStats = await Promise.all(
            usuarios.map(async (u) => {
                const obj = u.toObject()
                obj.totalReportes = await Reporte.countDocuments({ usuario: u._id })
                obj.reportesActivos = await Reporte.countDocuments({ usuario: u._id, activo: true })
                obj.reportesVerificados = await Reporte.countDocuments({ usuario: u._id, activo: true, validado: true })
                return obj
            })
        )

        // Filtrar por cantidad de reportes si se especifica
        const minReportes = req.query.minReportes ? parseInt(req.query.minReportes) : null
        const maxReportes = req.query.maxReportes ? parseInt(req.query.maxReportes) : null

        let usuariosFiltrados = usuariosConStats
        if (minReportes !== null) usuariosFiltrados = usuariosFiltrados.filter(u => u.totalReportes >= minReportes)
        if (maxReportes !== null) usuariosFiltrados = usuariosFiltrados.filter(u => u.totalReportes <= maxReportes)

        res.status(200).json({
            usuarios: usuariosFiltrados,
            total: usuariosFiltrados.length,
            paginas: Math.ceil(usuariosFiltrados.length / limite),
            paginaActual: pagina
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error al obtener usuarios" })
    }
}

// BANEAR USUARIO
export const banearUsuario = async (req, res) => {
    try {
        const usuario = await User.findById(req.params.id)
        if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" })
        if (usuario.rol === "admin") return res.status(400).json({ msg: "No se puede suspender a un administrador" })
        if (usuario.baneado) return res.status(400).json({ msg: "El usuario ya está suspendido" })

        usuario.baneado = true
        usuario.baneadoEn = new Date()
        await usuario.save()

        res.status(200).json({ msg: `Usuario ${usuario.nombre} suspendido correctamente` })
    } catch (error) {
        res.status(500).json({ msg: "Error al suspender el usuario" })
    }
}

// DESBANEAR USUARIO
export const desbanearUsuario = async (req, res) => {
    try {
        const usuario = await User.findById(req.params.id)
        if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" })
        if (!usuario.baneado) return res.status(400).json({ msg: "El usuario no está suspendido" })

        usuario.baneado = false
        usuario.baneadoEn = null
        await usuario.save()

        res.status(200).json({ msg: `Usuario ${usuario.nombre} reactivado correctamente` })
    } catch (error) {
        res.status(500).json({ msg: "Error al reactivar el usuario" })
    }
}

// ELIMINAR USUARIO (borrado lógico)
export const eliminarUsuario = async (req, res) => {
    try {
        const usuario = await User.findById(req.params.id)
        if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" })
        if (usuario.rol === "admin") return res.status(400).json({ msg: "No se puede eliminar a un administrador" })

        // Contar reportes activos del usuario
        const totalReportes = await Reporte.countDocuments({ usuario: usuario._id, activo: true })

        usuario.eliminado = true
        usuario.eliminadoEn = new Date()
        // También baneamos para que no pueda entrar si aún tiene token activo
        usuario.baneado = true
        await usuario.save()

        res.status(200).json({
            msg: `Usuario ${usuario.nombre} eliminado correctamente`,
            reportesAsociados: totalReportes
        })
    } catch (error) {
        res.status(500).json({ msg: "Error al eliminar el usuario" })
    }
}

// PERFIL DEL USUARIO LOGUEADO
export const obtenerPerfil = async (req, res) => {
    try {
        const { password, token, confirmEmail, createdAt, updatedAt, __v, ...datos } =
            req.userBDD.toObject ? req.userBDD.toObject() : req.userBDD
        res.status(200).json(datos)
    } catch (error) {
        res.status(500).json({ msg: "Error al obtener perfil" })
    }
}

// ACTUALIZAR PERFIL
export const actualizarPerfil = async (req, res) => {
    try {
        const { nombre, email, telefono, region, provincia } = req.body
        if (!nombre || !email) {
            return res.status(400).json({ msg: "Nombre y correo son obligatorios" })
        }

        const emailExiste = await User.findOne({ email, _id: { $ne: req.userBDD._id } })
        if (emailExiste) {
            return res.status(400).json({ msg: "Ese correo ya está en uso por otro usuario" })
        }

        await User.findByIdAndUpdate(req.userBDD._id, {
            nombre, email,
            telefono: telefono || null,
            region: region || null,
            provincia: provincia || null
        }, { new: true })

        res.status(200).json({ msg: "Perfil actualizado correctamente" })
    } catch (error) {
        res.status(500).json({ msg: "Error al actualizar perfil" })
    }
}

// CAMBIAR CONTRASEÑA
export const cambiarPassword = async (req, res) => {
    try {
        const { passwordActual, passwordNuevo, confirmarPassword } = req.body

        if (!passwordActual || !passwordNuevo || !confirmarPassword) {
            return res.status(400).json({ msg: "Todos los campos son obligatorios" })
        }
        if (passwordNuevo !== confirmarPassword) {
            return res.status(400).json({ msg: "Las contraseñas nuevas no coinciden" })
        }
        if (passwordNuevo.length < 6) {
            return res.status(400).json({ msg: "La contraseña debe tener al menos 6 caracteres" })
        }

        const usuario = await User.findById(req.userBDD._id)
        const valido = await usuario.matchPassword(passwordActual)
        if (!valido) {
            return res.status(400).json({ msg: "La contraseña actual es incorrecta" })
        }

        usuario.password = await usuario.encryptPassword(passwordNuevo)
        await usuario.save()

        res.status(200).json({ msg: "Contraseña actualizada correctamente" })
    } catch (error) {
        res.status(500).json({ msg: "Error al cambiar contraseña" })
    }
}

// LISTAR USUARIOS ELIMINADOS (admin)
export const listarUsuariosEliminados = async (req, res) => {
    try {
        const pagina = parseInt(req.query.pagina) || 1
        const limite = 10
        const skip = (pagina - 1) * limite
        const busqueda = req.query.busqueda || ""

        const filtro = {
            rol: "usuario",
            eliminado: true,
            ...(busqueda && {
                $or: [
                    { nombre: { $regex: busqueda, $options: "i" } },
                    { email: { $regex: busqueda, $options: "i" } }
                ]
            })
        }

        const total = await User.countDocuments(filtro)
        const usuarios = await User.find(filtro)
            .select("-password -token -confirmEmail -__v")
            .sort({ eliminadoEn: -1 })
            .skip(skip)
            .limit(limite)

        res.status(200).json({
            usuarios,
            total,
            paginas: Math.ceil(total / limite),
            paginaActual: pagina
        })
    } catch (error) {
        res.status(500).json({ msg: "Error al obtener usuarios eliminados" })
    }
}

// RESTAURAR USUARIO ELIMINADO (admin)
export const restaurarUsuario = async (req, res) => {
    try {
        const usuario = await User.findById(req.params.id)
        if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" })
        if (!usuario.eliminado) return res.status(400).json({ msg: "El usuario no está eliminado" })

        usuario.eliminado = false
        usuario.eliminadoEn = null
        usuario.baneado = false
        usuario.baneadoEn = null
        await usuario.save()

        res.status(200).json({ msg: `Usuario ${usuario.nombre} restaurado correctamente` })
    } catch (error) {
        res.status(500).json({ msg: "Error al restaurar el usuario" })
    }
}
