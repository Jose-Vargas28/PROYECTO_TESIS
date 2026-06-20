import axios from "axios"

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

export const getUsuarios = () => axios.get(`${API}/usuarios`, authHeaders())
export const banearUsuario = (id) => axios.patch(`${API}/usuarios/${id}/banear`, {}, authHeaders())
export const desbanearUsuario = (id) => axios.patch(`${API}/usuarios/${id}/desbanear`, {}, authHeaders())
