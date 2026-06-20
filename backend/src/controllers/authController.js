import User from "../models/User.js"
import { crearTokenJWT } from "../middlewares/JWT.js"
import { sendMailToConfirm, sendMailToRecovery } from "../config/nodemailer.js"

// REGISTRO
export const registro = async (req, res) => {
    try {
        const { nombre, email, password } = req.body

        if (!nombre || !email || !password) {
            return res.status(400).json({ msg: "Todos los campos son obligatorios" })
        }

        const existe = await User.findOne({ email })
        if (existe) {
            return res.status(400).json({ msg: "El correo ya está registrado" })
        }

        const nuevoUser = new User({ nombre, email, password })
        nuevoUser.password = await nuevoUser.encryptPassword(password)
        const token = nuevoUser.crearToken()

        await nuevoUser.save()
        await sendMailToConfirm(email, token)

        res.status(200).json({ msg: "Revisa tu correo para confirmar tu cuenta" })

    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error en el servidor" })
    }
}

// CONFIRMAR EMAIL
export const confirmarEmail = async (req, res) => {
    try {
        const { token } = req.params

        const user = await User.findOne({ token })
        if (!user?.token) {
            return res.status(404).json({ msg: "La cuenta ya fue confirmada" })
        }

        user.token = null
        user.confirmEmail = true
        await user.save()

        res.status(200).json({ msg: "Cuenta confirmada, ya puedes iniciar sesión" })

    } catch (error) {
        res.status(500).json({ msg: "Error en el servidor" })
    }
}

// LOGIN
export const login = async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({ msg: "Todos los campos son obligatorios" })
        }

        const user = await User.findOne({ email })
        if (!user) {
            return res.status(404).json({ msg: "Usuario no encontrado" })
        }

        if (!user.confirmEmail) {
            return res.status(401).json({ msg: "Debes confirmar tu cuenta antes de iniciar sesión" })
        }

        if (user.baneado) {
            return res.status(403).json({ msg: "Tu cuenta ha sido suspendida. Contacta al administrador." })
        }

        const valido = await user.matchPassword(password)
        if (!valido) {
            return res.status(401).json({ msg: "Contraseña incorrecta" })
        }

        const token = crearTokenJWT(user._id, user.rol)

        res.status(200).json({
            token,
            rol: user.rol,
            _id: user._id,
            nombre: user.nombre,
            email: user.email
        })

    } catch (error) {
        res.status(500).json({ msg: "Error en el servidor" })
    }
}

// PERFIL
export const perfil = (req, res) => {
    // Convertimos a objeto plano por seguridad (req.userBDD es un documento Mongoose)
    const userObj = req.userBDD.toObject ? req.userBDD.toObject() : req.userBDD
    const { password, token, confirmEmail, createdAt, updatedAt, __v, ...datos } = userObj
    res.status(200).json(datos)
}

// RECUPERAR CONTRASEÑA - Paso 1: enviar email
export const recuperarPassword = async (req, res) => {
    try {
        const { email } = req.body

        if (!email) {
            return res.status(400).json({ msg: "El correo es obligatorio" })
        }

        const user = await User.findOne({ email })
        if (!user) {
            return res.status(404).json({ msg: "No existe una cuenta con ese correo" })
        }

        const token = user.crearToken()
        await user.save()
        await sendMailToRecovery(email, token)

        res.status(200).json({ msg: "Revisa tu correo para restablecer tu contraseña" })

    } catch (error) {
        res.status(500).json({ msg: "Error en el servidor" })
    }
}

// RECUPERAR CONTRASEÑA - Paso 2: verificar token
export const verificarTokenPassword = async (req, res) => {
    try {
        const { token } = req.params

        const user = await User.findOne({ token })
        if (!user || user.token !== token) {
            return res.status(404).json({ msg: "Token inválido o expirado" })
        }

        res.status(200).json({ msg: "Token válido, ya puedes crear tu nueva contraseña" })

    } catch (error) {
        res.status(500).json({ msg: "Error en el servidor" })
    }
}

// RECUPERAR CONTRASEÑA - Paso 3: nueva contraseña
export const nuevaPassword = async (req, res) => {
    try {
        const { token } = req.params
        const { password, confirmpassword } = req.body

        if (!password || !confirmpassword) {
            return res.status(400).json({ msg: "Todos los campos son obligatorios" })
        }

        if (password !== confirmpassword) {
            return res.status(400).json({ msg: "Las contraseñas no coinciden" })
        }

        const user = await User.findOne({ token })
        if (!user || user.token !== token) {
            return res.status(404).json({ msg: "Token inválido o expirado" })
        }

        user.token = null
        user.password = await user.encryptPassword(password)
        await user.save()

        res.status(200).json({ msg: "Contraseña actualizada correctamente" })

    } catch (error) {
        res.status(500).json({ msg: "Error en el servidor" })
    }
}
