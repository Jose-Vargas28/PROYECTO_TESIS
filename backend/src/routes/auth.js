import { Router } from "express"
import rateLimit from "express-rate-limit"
import {
    registro,
    confirmarEmail,
    login,
    loginGoogle,
    perfil,
    recuperarPassword,
    verificarTokenPassword,
    nuevaPassword
} from "../controllers/authController.js"
import { verificarTokenJWT } from "../middlewares/JWT.js"

const router = Router()

// Rate limiter por IP: máximo 10 intentos cada 15 minutos
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { msg: "Demasiados intentos de inicio de sesión desde esta dirección. Intenta nuevamente en 15 minutos." }
})

// Públicas
router.post("/registro", registro)
router.get("/confirmar/:token", confirmarEmail)
router.post("/login", loginLimiter, login)
router.post("/login-google", loginGoogle)
router.post("/recuperarpassword", recuperarPassword)
router.get("/recuperarpassword/:token", verificarTokenPassword)
router.post("/nuevopassword/:token", nuevaPassword)

// Protegida
router.get("/perfil", verificarTokenJWT, perfil)

export default router