// =============================================================
//  CARD REUTILIZABLE - contenedor con sombra
// =============================================================

export const Card = ({ children, className = "" }) => {
    return (
        <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
            {children}
        </div>
    )
}

export default Card
