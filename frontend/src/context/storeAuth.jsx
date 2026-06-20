import { create } from "zustand"
import { persist } from "zustand/middleware"

//  STORE DE AUTENTICACIÓN (Zustand con persistencia)

const storeAuth = create(
    persist(
        (set) => ({
            token: null,
            rol: null,
            setToken: (token) => set({ token }),
            setRol: (rol) => set({ rol }),
            clearAuth: () => set({ token: null, rol: null }),
        }),
        { name: "auth-token" }
    )
)

export default storeAuth
