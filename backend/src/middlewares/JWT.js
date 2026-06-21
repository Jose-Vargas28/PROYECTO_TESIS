import jwt from "jsonwebtoken"
import User from "../models/User.js"

const crearTokenJWT = (id, rol) => {
    return jwt.sign({ id, rol }, process.env.JWT_SECRET, { expiresIn: "1d" })
}

const verificarTokenJWT = async (req, res, next) => {
    const { authorization } = req.headers

    if (!authorization) {
        return res.status(401).json({ msg: "Acceso denegado: token no proporcionado" })
    }

    try {
        const token = authorization.split(" ")[1]
        const { id, rol } = jwt.verify(token, process.env.JWT_SECRET)

        req.userBDD = await User.findById(id).select("-password")
        req.userBDD.rol = rol
        next()

    } catch (error) {
        return res.status(401).json({ msg: "Token inválido o expirado" })
    }
}

// Solo permite acceso a administradores
const soloAdmin = (req, res, next) => {
    if (req.userBDD?.rol !== "admin") {
        return res.status(403).json({ msg: "Acceso denegado: solo administradores" })
    }
    next()
}

// Token opcional — si hay token lo verifica, si no hay continúa igual
const verificarTokenOpcional = async (req, res, next) => {
    const { authorization } = req.headers
    if (!authorization) { req.userBDD = null; return next() }
    try {
        const token = authorization.split(" ")[1]
        const { id, rol } = jwt.verify(token, process.env.JWT_SECRET)
        req.userBDD = await User.findById(id).select("-password")
        if (req.userBDD) req.userBDD.rol = rol
    } catch {
        req.userBDD = null
    }
    next()
}

export { crearTokenJWT, verificarTokenJWT, soloAdmin, verificarTokenOpcional }
