// ============================================================
//  seedDatos.js — Carga masiva de datos de prueba
//  AutoReporta EC
//
//  Uso: node seedDatos.js
//  ⚠️  Solo ejecutar en entorno de desarrollo
//  ⚠️  Elimina todos los usuarios (no admin), vehículos,
//      fallas y reportes existentes antes de insertar
// ============================================================

import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import dotenv from "dotenv"
import User from "./src/models/User.js"
import Vehiculo from "./src/models/Vehiculo.js"
import Falla from "./src/models/Falla.js"
import Reporte from "./src/models/Reporte.js"

dotenv.config()

// ---- Utilidades ----
const aleatorio = (arr) => arr[Math.floor(Math.random() * arr.length)]
const aleatorioN = (arr, n) => [...arr].sort(() => 0.5 - Math.random()).slice(0, n)
const num = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const fechaAleatoria = (diasAtras = 120) => {
    const d = new Date()
    d.setDate(d.getDate() - num(0, diasAtras))
    d.setHours(num(7, 22), num(0, 59))
    return d
}

// ---- Usuarios de prueba ----
const USUARIOS_DATA = [
    // Sierra (mayoría)
    { nombre: "Carlos Andrade", email: "candrade@mail.com", region: "Sierra", provincia: "Pichincha" },
    { nombre: "María Salazar", email: "msalazar@mail.com", region: "Sierra", provincia: "Pichincha" },
    { nombre: "Jorge Mosquera", email: "jmosquera@mail.com", region: "Sierra", provincia: "Pichincha" },
    { nombre: "Daniela Ortiz", email: "dortiz@mail.com", region: "Sierra", provincia: "Pichincha" },
    { nombre: "Sebastián Ríos", email: "srios@mail.com", region: "Sierra", provincia: "Tungurahua" },
    { nombre: "Valeria Cárdenas", email: "vcardenas@mail.com", region: "Sierra", provincia: "Tungurahua" },
    { nombre: "Pablo Herrera", email: "pherrera@mail.com", region: "Sierra", provincia: "Azuay" },
    { nombre: "Sofía Mora", email: "smora@mail.com", region: "Sierra", provincia: "Azuay" },
    { nombre: "Diego Castillo", email: "dcastillo@mail.com", region: "Sierra", provincia: "Imbabura" },
    { nombre: "Gabriela Vega", email: "gvega@mail.com", region: "Sierra", provincia: "Cotopaxi" },
    { nombre: "Andrés Tapia", email: "atapia@mail.com", region: "Sierra", provincia: "Chimborazo" },
    { nombre: "Camila Paredes", email: "cparedes@mail.com", region: "Sierra", provincia: "Loja" },
    { nombre: "Ricardo Espinoza", email: "respinoza@mail.com", region: "Sierra", provincia: "Carchi" },
    { nombre: "Fernanda Lara", email: "flara@mail.com", region: "Sierra", provincia: "Cañar" },
    { nombre: "Mateo Guevara", email: "mguevara@mail.com", region: "Sierra", provincia: "Bolívar" },
    // Costa
    { nombre: "Luis Mendoza", email: "lmendoza@mail.com", region: "Costa", provincia: "Guayas" },
    { nombre: "Ana Torres", email: "atorres@mail.com", region: "Costa", provincia: "Guayas" },
    { nombre: "Roberto Freire", email: "rfreire@mail.com", region: "Costa", provincia: "Manabí" },
    { nombre: "Patricia Suárez", email: "psuarez@mail.com", region: "Costa", provincia: "El Oro" },
    { nombre: "Miguel Alvarado", email: "malvarado@mail.com", region: "Costa", provincia: "Esmeraldas" },
    // Oriente (menos)
    { nombre: "José Pintado", email: "jpintado@mail.com", region: "Oriente", provincia: "Napo" },
    { nombre: "Carmen Aguirre", email: "caguirre@mail.com", region: "Oriente", provincia: "Pastaza" },
    { nombre: "Nelson Shiguango", email: "nshiguango@mail.com", region: "Oriente", provincia: "Orellana" },
    // Galápagos (pocos)
    { nombre: "Iván Granja", email: "igranja@mail.com", region: "Galápagos", provincia: "Galápagos" },
    { nombre: "Rosa Cedeño", email: "rcedeno@mail.com", region: "Galápagos", provincia: "Galápagos" },
]

// ---- Vehículos ----
const VEHICULOS_DATA = [
    // Chevrolet
    { marca: "Chevrolet", modelo: "Aveo", anio: 2018, tipo: "automóvil", combustible: "gasolina" },
    { marca: "Chevrolet", modelo: "Sail", anio: 2020, tipo: "automóvil", combustible: "gasolina" },
    { marca: "Chevrolet", modelo: "Tracker", anio: 2022, tipo: "suv", combustible: "gasolina" },
    { marca: "Chevrolet", modelo: "D-Max", anio: 2019, tipo: "camioneta", combustible: "diésel" },
    { marca: "Chevrolet", modelo: "Captiva", anio: 2021, tipo: "suv", combustible: "gasolina" },
    // Toyota
    { marca: "Toyota", modelo: "Corolla", anio: 2020, tipo: "automóvil", combustible: "gasolina" },
    { marca: "Toyota", modelo: "Hilux", anio: 2021, tipo: "camioneta", combustible: "diésel" },
    { marca: "Toyota", modelo: "RAV4", anio: 2022, tipo: "suv", combustible: "híbrido" },
    { marca: "Toyota", modelo: "Land Cruiser Prado", anio: 2019, tipo: "suv", combustible: "diésel" },
    // Kia
    { marca: "Kia", modelo: "Sportage", anio: 2021, tipo: "suv", combustible: "gasolina" },
    { marca: "Kia", modelo: "Picanto", anio: 2020, tipo: "automóvil", combustible: "gasolina" },
    { marca: "Kia", modelo: "Rio", anio: 2019, tipo: "automóvil", combustible: "gasolina" },
    // Hyundai
    { marca: "Hyundai", modelo: "Tucson", anio: 2022, tipo: "suv", combustible: "gasolina" },
    { marca: "Hyundai", modelo: "Accent", anio: 2020, tipo: "automóvil", combustible: "gasolina" },
    { marca: "Hyundai", modelo: "Santa Fe", anio: 2021, tipo: "suv", combustible: "gasolina" },
    // Nissan
    { marca: "Nissan", modelo: "Frontier", anio: 2020, tipo: "camioneta", combustible: "diésel" },
    { marca: "Nissan", modelo: "Sentra", anio: 2019, tipo: "automóvil", combustible: "gasolina" },
    { marca: "Nissan", modelo: "X-Trail", anio: 2021, tipo: "suv", combustible: "gasolina" },
    // Mazda
    { marca: "Mazda", modelo: "CX-5", anio: 2021, tipo: "suv", combustible: "gasolina" },
    { marca: "Mazda", modelo: "3", anio: 2020, tipo: "automóvil", combustible: "gasolina" },
    // Marcas chinas
    { marca: "Chery", modelo: "Tiggo 2", anio: 2020, tipo: "suv", combustible: "gasolina" },
    { marca: "Chery", modelo: "Tiggo 7", anio: 2022, tipo: "suv", combustible: "gasolina" },
    { marca: "JAC", modelo: "T8", anio: 2021, tipo: "camioneta", combustible: "gasolina" },
    { marca: "JAC", modelo: "S4", anio: 2020, tipo: "suv", combustible: "gasolina" },
    { marca: "BYD", modelo: "Atto 3", anio: 2023, tipo: "suv", combustible: "eléctrico" },
    { marca: "BYD", modelo: "Dolphin", anio: 2023, tipo: "automóvil", combustible: "eléctrico" },
    { marca: "Changan", modelo: "CS35 Plus", anio: 2022, tipo: "suv", combustible: "gasolina" },
    { marca: "Great Wall", modelo: "Poer", anio: 2022, tipo: "camioneta", combustible: "diésel" },
    { marca: "Jetour", modelo: "X70", anio: 2022, tipo: "suv", combustible: "gasolina" },
    { marca: "DFSK", modelo: "Glory 580", anio: 2021, tipo: "suv", combustible: "gasolina" },
    // Europeas
    { marca: "Volkswagen", modelo: "Golf", anio: 2020, tipo: "automóvil", combustible: "gasolina" },
    { marca: "Volkswagen", modelo: "Tiguan", anio: 2021, tipo: "suv", combustible: "gasolina" },
    { marca: "Renault", modelo: "Duster", anio: 2020, tipo: "suv", combustible: "gasolina" },
    { marca: "Renault", modelo: "Logan", anio: 2019, tipo: "automóvil", combustible: "gasolina" },
    { marca: "Peugeot", modelo: "208", anio: 2021, tipo: "automóvil", combustible: "gasolina" },
    { marca: "Ford", modelo: "Ranger", anio: 2021, tipo: "camioneta", combustible: "diésel" },
    { marca: "Ford", modelo: "Escape", anio: 2020, tipo: "suv", combustible: "gasolina" },
    { marca: "Suzuki", modelo: "Vitara", anio: 2021, tipo: "suv", combustible: "gasolina" },
    { marca: "Suzuki", modelo: "Swift", anio: 2020, tipo: "automóvil", combustible: "gasolina" },
    { marca: "Mitsubishi", modelo: "L200", anio: 2020, tipo: "camioneta", combustible: "diésel" },
    // Comerciales — camiones, buses, furgonetas
    { marca: "Hino", modelo: "300 Series", anio: 2020, tipo: "vehículo comercial", combustible: "diésel" },
    { marca: "Hino", modelo: "500 Series", anio: 2019, tipo: "vehículo comercial", combustible: "diésel" },
    { marca: "Mercedes-Benz", modelo: "Sprinter", anio: 2021, tipo: "vehículo comercial", combustible: "diésel" },
    { marca: "Volkswagen", modelo: "Crafter", anio: 2020, tipo: "vehículo comercial", combustible: "diésel" },
    { marca: "Ford", modelo: "Transit", anio: 2021, tipo: "vehículo comercial", combustible: "diésel" },
    { marca: "Foton", modelo: "Aumark", anio: 2020, tipo: "vehículo comercial", combustible: "diésel" },
    { marca: "Foton", modelo: "View CS2", anio: 2021, tipo: "vehículo comercial", combustible: "gasolina" },
    { marca: "JAC", modelo: "X200", anio: 2020, tipo: "vehículo comercial", combustible: "diésel" },
    { marca: "Hyundai", modelo: "H1", anio: 2020, tipo: "vehículo comercial", combustible: "gasolina" },
    { marca: "Hyundai", modelo: "HD78", anio: 2019, tipo: "vehículo comercial", combustible: "diésel" },
    { marca: "King Long", modelo: "XMQ6900", anio: 2020, tipo: "vehículo comercial", combustible: "diésel" },
    { marca: "Yutong", modelo: "ZK6930H", anio: 2021, tipo: "vehículo comercial", combustible: "diésel" },
    { marca: "Scania", modelo: "F250", anio: 2019, tipo: "vehículo comercial", combustible: "diésel" },
    // Motos
    { marca: "Honda", modelo: "CB160F", anio: 2021, tipo: "moto", combustible: "gasolina" },
    { marca: "Honda", modelo: "XR190L", anio: 2020, tipo: "moto", combustible: "gasolina" },
    { marca: "Yamaha", modelo: "FZ 15", anio: 2021, tipo: "moto", combustible: "gasolina" },
    { marca: "Yamaha", modelo: "MT-03", anio: 2022, tipo: "moto", combustible: "gasolina" },
    { marca: "Suzuki", modelo: "GS150R", anio: 2020, tipo: "moto", combustible: "gasolina" },
    { marca: "Kawasaki", modelo: "Z400", anio: 2022, tipo: "moto", combustible: "gasolina" },
    { marca: "Bajaj", modelo: "Pulsar NS200", anio: 2021, tipo: "moto", combustible: "gasolina" },
    { marca: "Bajaj", modelo: "Rouser 135", anio: 2020, tipo: "moto", combustible: "gasolina" },
    { marca: "AKT", modelo: "TTX 125", anio: 2021, tipo: "moto", combustible: "gasolina" },
    { marca: "Hero", modelo: "Hunk 160R", anio: 2021, tipo: "moto", combustible: "gasolina" },
]

// ---- Fallas ----
const FALLAS_DATA = [
    { nombre: "Falla en frenos", descripcion: "El sistema de frenos no responde correctamente o presenta ruidos", gravedad: "alta" },
    { nombre: "Problemas de dirección", descripcion: "Dificultad para girar o vibración en el volante", gravedad: "alta" },
    { nombre: "Falla en transmisión", descripcion: "Cambios bruscos, resbalones o ruidos en la caja de cambios", gravedad: "alta" },
    { nombre: "Problema en motor", descripcion: "Pérdida de potencia, ruidos inusuales o humo excesivo", gravedad: "alta" },
    { nombre: "Falla en sistema eléctrico", descripcion: "Cortocircuitos, luces que no funcionan o batería que no carga", gravedad: "alta" },
    { nombre: "Banda de distribución", descripcion: "Desgaste prematuro o rotura de la banda de distribución", gravedad: "alta" },
    { nombre: "Sobrecalentamiento", descripcion: "El motor alcanza temperaturas excesivas con frecuencia", gravedad: "alta" },
    { nombre: "Airbag defectuoso", descripcion: "El airbag no se despliega correctamente o lo hace sin motivo", gravedad: "alta" },
    { nombre: "Falla en suspensión", descripcion: "Ruidos, golpes o inestabilidad en la suspensión", gravedad: "media" },
    { nombre: "Consumo excesivo de combustible", descripcion: "El vehículo consume más combustible de lo normal", gravedad: "media" },
    { nombre: "Problema en radiador", descripcion: "Fugas de refrigerante o falla en la disipación de calor", gravedad: "media" },
    { nombre: "Falla en embrague", descripcion: "El embrague resbala, hace ruido o no conecta bien", gravedad: "media" },
    { nombre: "Problema en escape", descripcion: "Ruidos excesivos, fugas de gases o humo anormal", gravedad: "media" },
    { nombre: "Falla en caja automática", descripcion: "Cambios irregulares o impactos al cambiar de marcha", gravedad: "media" },
    { nombre: "Consumo excesivo de aceite", descripcion: "El motor consume aceite en cantidades anormales", gravedad: "media" },
    { nombre: "Carrocería con corrosión", descripcion: "Oxidación prematura en partes de la carrocería", gravedad: "media" },
    { nombre: "Problema en turbo", descripcion: "Pérdida de potencia o ruidos provenientes del turbocompresor", gravedad: "media" },
    { nombre: "Falla en luces", descripcion: "Luces que se apagan solas, parpadean o no encienden", gravedad: "baja" },
    { nombre: "Problema en aire acondicionado", descripcion: "El A/C no enfría correctamente o hace ruidos", gravedad: "baja" },
    { nombre: "Ruido en interiores", descripcion: "Ruidos y vibraciones molestas en el habitáculo", gravedad: "baja" },
    { nombre: "Problema en parabrisas", descripcion: "Fisuras, deslaminación o defectos en el vidrio", gravedad: "baja" },
    { nombre: "Falla en cierre centralizado", descripcion: "Las puertas no se bloquean o desbloquean correctamente", gravedad: "baja" },
    { nombre: "Problema en sensores", descripcion: "Sensores de parqueo, lluvia o temperatura con fallas", gravedad: "baja" },
    { nombre: "Pintura defectuosa", descripcion: "Desprendimiento, burbujas o cambio de color en la pintura", gravedad: "baja" },
]

// ---- Descripciones para reportes ----
const DESCRIPCIONES = [
    "El problema apareció de la nada, sin previo aviso. Ya lo llevé al taller pero no encontraron la falla.",
    "Lo he notado desde hace unos 3 meses aproximadamente. Cada vez empeora más.",
    "El concesionario me dijo que es normal pero no lo creo. Claramente algo está mal.",
    "Sucede especialmente cuando el vehículo está frío, al arrancar en las mañanas.",
    "Tuve que dejar el vehículo en el taller por una semana. El repuesto tardó en llegar.",
    "Varios vecinos tienen el mismo modelo y reportan el mismo problema. Parece ser de fábrica.",
    "Ya cambié las piezas dos veces pero el problema regresa al poco tiempo.",
    "El problema se presentó apenas cumplí la garantía. Muy sospechoso.",
    "Me sucedió en plena carretera, fue muy peligroso. Menos mal pude detenerme a tiempo.",
    "Ya hice el reclamo formal al importador pero no me han dado solución.",
    "El taller me indicó que es un defecto de diseño conocido en este modelo.",
    "Empezó con un pequeño ruido y ahora ya es una falla completa del sistema.",
    "Lo noté en el primer año de uso, con apenas 15.000 km recorridos.",
    "Fui a revisar y me confirmaron que es un problema recurrente en estos vehículos.",
    "El manual no menciona nada al respecto pero claramente no es normal.",
]

// ============================================================
//  SCRIPT PRINCIPAL
// ============================================================
const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log("✅ Conectado a MongoDB\n")

        // Obtener admin para asignarle algunos reportes
        const admin = await User.findOne({ rol: "admin" })
        if (!admin) {
            console.error("❌ No se encontró un administrador. Ejecuta primero: node seedAdmin.js")
            process.exit(1)
        }

        // ---- Limpiar datos anteriores (no tocar admin) ----
        console.log("🧹 Limpiando datos anteriores...")
        await User.deleteMany({ rol: "usuario" })
        await Vehiculo.deleteMany({})
        await Falla.deleteMany({})
        await Reporte.deleteMany({})
        console.log("   Datos anteriores eliminados\n")

        // ---- Crear usuarios ----
        console.log("👥 Creando usuarios...")
        const salt = await bcrypt.genSalt(10)
        const passwordHash = await bcrypt.hash("Password123", salt)

        const usuariosCreados = await User.insertMany(
            USUARIOS_DATA.map(u => ({
                ...u,
                password: passwordHash,
                confirmEmail: true,
                rol: "usuario"
            }))
        )
        console.log(`   ✅ ${usuariosCreados.length} usuarios creados\n`)

        // ---- Crear vehículos ----
        console.log("🚗 Creando vehículos...")
        const vehiculosCreados = await Vehiculo.insertMany(
            VEHICULOS_DATA.map(v => ({
                ...v,
                creadoPor: aleatorio(usuariosCreados)._id
            }))
        )
        console.log(`   ✅ ${vehiculosCreados.length} vehículos creados\n`)

        // ---- Crear fallas ----
        console.log("⚠️  Creando fallas...")
        const fallasCreadas = await Falla.insertMany(
            FALLAS_DATA.map(f => ({
                ...f,
                creadoPor: aleatorio(usuariosCreados)._id
            }))
        )
        console.log(`   ✅ ${fallasCreadas.length} fallas creadas\n`)

        // ---- Crear reportes ----
        console.log("📋 Creando reportes...")
        const todosLosUsuarios = [...usuariosCreados, admin]
        const reportes = []
        const totalReportes = num(75, 90)

        // Distribución de estados: ~60% validados, ~30% pendientes, ~10% eliminados
        for (let i = 0; i < totalReportes; i++) {
            const vehiculo = aleatorio(vehiculosCreados)
            const falla = aleatorio(fallasCreadas)
            const usuario = aleatorio(todosLosUsuarios)
            const fechaCreacion = fechaAleatoria(150)

            const r = Math.random()
            let validado = false
            let validadoEn = null
            let validadoPor = null
            let activo = true
            let eliminadoEn = null
            let eliminadoPor = null

            if (r < 0.60) {
                // Validado
                validado = true
                validadoEn = new Date(fechaCreacion.getTime() + num(1, 5) * 24 * 60 * 60 * 1000)
                validadoPor = admin._id
            } else if (r < 0.90) {
                // Pendiente
                validado = false
            } else {
                // Eliminado
                activo = false
                eliminadoEn = new Date(fechaCreacion.getTime() + num(1, 3) * 24 * 60 * 60 * 1000)
                eliminadoPor = admin._id
            }

            reportes.push({
                vehiculo: vehiculo._id,
                falla: falla._id,
                descripcion: aleatorio(DESCRIPCIONES),
                gravedad: falla.gravedad, // gravedad coherente con la falla
                usuario: usuario._id,
                validado,
                validadoEn,
                validadoPor,
                activo,
                eliminadoEn,
                eliminadoPor,
                imagenes: [],
                documentos: [],
                enlaces: [],
                createdAt: fechaCreacion,
                updatedAt: fechaCreacion
            })
        }

        await Reporte.insertMany(reportes)
        const validados = reportes.filter(r => r.validado && r.activo).length
        const pendientes = reportes.filter(r => !r.validado && r.activo).length
        const eliminados = reportes.filter(r => !r.activo).length
        console.log(`   ✅ ${reportes.length} reportes creados`)
        console.log(`      → ${validados} validados`)
        console.log(`      → ${pendientes} pendientes`)
        console.log(`      → ${eliminados} eliminados\n`)

        console.log("\n🎉 Seed completado exitosamente")
        console.log("─".repeat(45))
        console.log("📧 Usuarios de prueba creados:")
        console.log("   Contraseña para TODOS: Password123")
        console.log("   Ejemplos de acceso:")
        console.log("   → candrade@mail.com   (Sierra - Pichincha)")
        console.log("   → lmendoza@mail.com   (Costa - Guayas)")
        console.log("   → jpintado@mail.com   (Oriente - Napo)")
        console.log("   → igranja@mail.com    (Galápagos)")
        console.log("─".repeat(45))
        process.exit(0)

    } catch (error) {
        console.error("❌ Error en el seed:", error)
        process.exit(1)
    }
}

seed()
