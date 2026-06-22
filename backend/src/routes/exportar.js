import { Router } from "express"
import {
    exportarReportesExcel,
    exportarBoletinPDF,
    exportarReportePDF
} from "../controllers/exportController.js"
import { verificarTokenJWT, soloAdmin } from "../middlewares/JWT.js"

const router = Router()

// Por ahora solo el administrador puede generar estas exportaciones.
router.get("/exportar/reportes-excel", verificarTokenJWT, soloAdmin, exportarReportesExcel)
router.get("/exportar/boletin-pdf", verificarTokenJWT, soloAdmin, exportarBoletinPDF)
router.get("/exportar/reporte/:id/pdf", verificarTokenJWT, soloAdmin, exportarReportePDF)

export default router