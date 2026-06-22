import { Schema, model } from "mongoose"

const enlaceSchema = new Schema({
    url:         { type: String, required: true, trim: true },
    titulo:      { type: String, required: true, trim: true, maxlength: 100 },
    descripcion: { type: String, trim: true, maxlength: 200, default: "" },
    creadoPor:   { type: Schema.Types.ObjectId, ref: "User" }
}, { _id: true, timestamps: true })

// Registra cuándo un usuario eliminó su último enlace de este vehículo,
// para aplicar un cooldown antes de poder agregar uno nuevo
const cooldownEnlaceSchema = new Schema({
    usuario: { type: Schema.Types.ObjectId, ref: "User", required: true },
    eliminadoEn: { type: Date, default: Date.now }
}, { _id: false })

const fotoSchema = new Schema({
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    principal: { type: Boolean, default: false },
    esPexels: { type: Boolean, default: false },
    urlOriginal: { type: String }
}, { _id: true })

const vehiculoSchema = new Schema({
    marca: { type: String, required: true, trim: true },
    modelo: { type: String, required: true, trim: true },
    anio: { type: Number, required: true },
    version: {
        type: String,
        trim: true,
        maxlength: 20,
        default: ""
    },
    tipo: {
        type: String,
        enum: ["automóvil", "suv", "camioneta", "moto", "vehículo comercial"],
        default: "automóvil"
    },
    combustible: {
        type: String,
        enum: ["gasolina", "diésel", "eléctrico", "híbrido"],
        default: "gasolina"
    },
    fotos: [fotoSchema],
    enlaces: [enlaceSchema],
    cooldownsEnlaces: [cooldownEnlaceSchema],
    ocultarFotoAuto: { type: Boolean, default: false },
    creadoPor: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
}, {
    timestamps: true
})

// Índice único: marca + modelo + año + versión
vehiculoSchema.index({ marca: 1, modelo: 1, anio: 1, version: 1 }, { unique: true })

export default model("Vehiculo", vehiculoSchema)