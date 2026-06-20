import { Router } from "express"
import { crearVehiculo, listarVehiculos, eliminarVehiculo, actualizarVehiculo } from "../controllers/vehiculoController.js"
import { verificarTokenJWT, soloAdmin } from "../middlewares/JWT.js"

const router = Router()

router.get("/vehiculos", listarVehiculos)                                  // público (para combo box)
router.post("/vehiculos", verificarTokenJWT, crearVehiculo)                // usuario logueado
router.put("/vehiculos/:id", verificarTokenJWT, soloAdmin, actualizarVehiculo)
router.delete("/vehiculos/:id", verificarTokenJWT, soloAdmin, eliminarVehiculo)  // solo admin

export default router
