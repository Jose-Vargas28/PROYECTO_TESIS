import { Schema, model } from "mongoose"
import bcrypt from "bcryptjs"

const userSchema = new Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    rol: {
        type: String,
        enum: ["usuario", "admin"],
        default: "usuario"
    },
    confirmEmail: {
        type: Boolean,
        default: false
    },
    token: {
        type: String,
        default: null
    },
    // Datos opcionales del usuario
    telefono: { type: String, trim: true, default: null },
    region: {
        type: String,
        enum: ["Costa", "Sierra", "Oriente", "Galápagos"],
        default: null
    },
    provincia: { type: String, trim: true, default: null },

    baneado: {
        type: Boolean,
        default: false
    },
    baneadoEn: {
        type: Date,
        default: null
    },
    eliminado: {
        type: Boolean,
        default: false
    },
    eliminadoEn: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
})

// Cifrar contraseña
userSchema.methods.encryptPassword = async function (password) {
    const salt = await bcrypt.genSalt(10)
    return bcrypt.hash(password, salt)
}

// Verificar contraseña
userSchema.methods.matchPassword = async function (password) {
    return bcrypt.compare(password, this.password)
}

// Generar token aleatorio
userSchema.methods.crearToken = function () {
    this.token = Math.random().toString(32).slice(2)
    return this.token
}

export default model("User", userSchema)
