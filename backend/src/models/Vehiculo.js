import { Schema, model } from "mongoose"

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