import { Router } from "express"
import { crearFalla, listarFallas, eliminarFalla, actualizarFalla } from "../controllers/fallaController.js"
import { verificarTokenJWT, soloAdmin } from "../middlewares/JWT.js"

const router = Router()

router.get("/fallas", listarFallas)                              // público (para combo box)
router.post("/fallas", verificarTokenJWT, crearFalla)            // usuario logueado
router.put("/fallas/:id", verificarTokenJWT, soloAdmin, actualizarFalla)
router.delete("/fallas/:id", verificarTokenJWT, soloAdmin, eliminarFalla)  // solo admin

export default router
