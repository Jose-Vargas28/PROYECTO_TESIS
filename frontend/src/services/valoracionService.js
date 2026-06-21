import axios from "axios"

const API = import.meta.env.VITE_BACKEND_URL

const authHeaders = () => {
    const stored = JSON.parse(localStorage.getItem("auth-token"))
    return {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${stored?.state?.token}`
        }
    }
}

const authHeadersOpcional = () => {
    try {
        const stored = JSON.parse(localStorage.getItem("auth-token"))
        const token = stored?.state?.token
        if (!token) return {}
        return { headers: { Authorization: `Bearer ${token}` } }
    } catch { return {} }
}

export const getRanking = (params = {}) => {
    const query = new URLSearchParams()
    if (params.tipo) query.append("tipo", params.tipo)
    if (params.marca) query.append("marca", params.marca)
    if (params.minValoraciones) query.append("minValoraciones", params.minValoraciones)
    return axios.get(`${API}/valoraciones/ranking?${query}`)
}

export const getValoracionesVehiculo = (vehiculoId, pagina = 1) =>
    axios.get(`${API}/vehiculos/${vehiculoId}/valoraciones?pagina=${pagina}`, authHeadersOpcional())

export const crearValoracion = (vehiculoId, data) =>
    axios.post(`${API}/vehiculos/${vehiculoId}/valoraciones`, data, authHeaders())

export const eliminarValoracion = (id) =>
    axios.delete(`${API}/valoraciones/${id}`, authHeaders())
