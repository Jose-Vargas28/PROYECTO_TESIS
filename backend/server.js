import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import fileUpload from "express-fileupload"
import routerAuth from "./src/routes/auth.js"
import routerReporte from "./src/routes/reporte.js"
import routerEvidencia from "./src/routes/evidencia.js"
import routerVehiculo from "./src/routes/vehiculo.js"
import routerFalla from "./src/routes/falla.js"
import routerUsuario from "./src/routes/usuario.js"

dotenv.config()

const app = express()

app.set("port", process.env.PORT || 5000)
app.use(cors())
app.use(express.json())
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: "./uploads"
}))

app.get("/", (req, res) => res.send("Servidor de AutoReporta EC - OK"))
app.use("/api", routerAuth)
app.use("/api", routerVehiculo)
app.use("/api", routerFalla)
app.use("/api", routerReporte)
app.use("/api", routerEvidencia)
app.use("/api", routerUsuario)

app.use((req, res) => res.status(404).json({ msg: "Endpoint no encontrado" }))

export default app
