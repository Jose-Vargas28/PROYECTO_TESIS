import { Router } from "express"
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

// Públicas
router.post("/registro", registro)
router.get("/confirmar/:token", confirmarEmail)
router.post("/login", login)
router.post("/login-google", loginGoogle)
router.post("/recuperarpassword", recuperarPassword)
router.get("/recuperarpassword/:token", verificarTokenPassword)
router.post("/nuevopassword/:token", nuevaPassword)

// Protegida
router.get("/perfil", verificarTokenJWT, perfil)

export default router