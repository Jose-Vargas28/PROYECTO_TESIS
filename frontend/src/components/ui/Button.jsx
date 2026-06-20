// =============================================================
//  BOTÓN REUTILIZABLE
//  Variantes: primario, secundario, peligro, exito
//  Si quieres cambiar el diseño de TODOS los botones, edita aquí.
// =============================================================

const variantes = {
    primario: "bg-blue-900 hover:bg-blue-800 text-white",
    secundario: "bg-slate-200 hover:bg-slate-300 text-slate-700",
    peligro: "bg-red-600 hover:bg-red-700 text-white",
    exito: "bg-green-600 hover:bg-green-700 text-white",
    advertencia: "bg-amber-500 hover:bg-amber-600 text-white",
}

const Button = ({
    children,
    variant = "primario",
    type = "button",
    onClick,
    disabled = false,
    fullWidth = false,
    className = "",
}) => {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`
                ${variantes[variant]}
                ${fullWidth ? "w-full" : ""}
                font-semibold py-2 px-4 rounded-lg
                transition-colors duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                ${className}
            `}
        >
            {children}
        </button>
    )
}

export default Button
