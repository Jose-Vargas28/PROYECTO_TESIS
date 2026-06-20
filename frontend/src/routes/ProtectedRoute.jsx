import { Navigate } from "react-router"
import storeAuth from "../context/storeAuth"

// Protege rutas que requieren estar logueado
const ProtectedRoute = ({ children }) => {
    const token = storeAuth((state) => state.token)
    return token ? children : <Navigate to="/login" />
}

export default ProtectedRoute
