import axios from "axios"

// =============================================================
//  SERVICIO DE AUTENTICACIÓN
//  Todas las llamadas relacionadas a auth en un solo lugar.
// =============================================================

const API = import.meta.env.VITE_BACKEND_URL

export const registerUser = (data) => axios.post(`${API}/registro`, data)

export const loginUser = (data) => axios.post(`${API}/login`, data)

export const confirmAccount = (token) => axios.get(`${API}/confirmar/${token}`)

export const recoverPassword = (data) => axios.post(`${API}/recuperarpassword`, data)

export const verifyRecoveryToken = (token) => axios.get(`${API}/recuperarpassword/${token}`)

export const setNewPassword = (token, data) => axios.post(`${API}/nuevopassword/${token}`, data)
