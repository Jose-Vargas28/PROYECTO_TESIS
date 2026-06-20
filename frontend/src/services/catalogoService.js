import axios from "axios"

// =============================================================
//  SERVICIO DE CATÁLOGOS (Vehículos y Fallas)
// =============================================================

const API = import.meta.env.VITE_BACKEND_URL

const authHeaders = () => {
    const storedUser = JSON.parse(localStorage.getItem("auth-token"))
    return {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${storedUser?.state?.token}`,
        },
    }
}

// ---- Vehículos ----
export const getVehiculos = () => axios.get(`${API}/vehiculos`)
export const crearVehiculo = (data) => axios.post(`${API}/vehiculos`, data, authHeaders())
export const actualizarVehiculo = (id, data) => axios.put(`${API}/vehiculos/${id}`, data, authHeaders())
export const eliminarVehiculo = (id) => axios.delete(`${API}/vehiculos/${id}`, authHeaders())

// ---- Fallas ----
export const getFallas = () => axios.get(`${API}/fallas`)
export const crearFalla = (data) => axios.post(`${API}/fallas`, data, authHeaders())
export const actualizarFalla = (id, data) => axios.put(`${API}/fallas/${id}`, data, authHeaders())
export const eliminarFalla = (id) => axios.delete(`${API}/fallas/${id}`, authHeaders())
