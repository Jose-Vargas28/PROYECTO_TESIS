import { Schema, model } from "mongoose"

const vehiculoSchema = new Schema({
    marca: { type: String, required: true, trim: true },
    modelo: { type: String, required: true, trim: true },
    anio: { type: Number, required: true },
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
    creadoPor: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
}, {
    timestamps: true
})

// Índice único compuesto: no se puede repetir la combinación marca + modelo + año
// Se normaliza a minúsculas vía el controlador para evitar duplicados por mayúsculas
vehiculoSchema.index({ marca: 1, modelo: 1, anio: 1 }, { unique: true })

export default model("Vehiculo", vehiculoSchema)
