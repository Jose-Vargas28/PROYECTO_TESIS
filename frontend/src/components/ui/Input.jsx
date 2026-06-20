// =============================================================
//  INPUT REUTILIZABLE (compatible con react-hook-form)
//  Muestra label, campo y mensaje de error.
// =============================================================

const Input = ({
    label,
    type = "text",
    placeholder = "",
    register,        // función register de react-hook-form
    name,
    error,           // objeto de error de react-hook-form
    ...rest
}) => {
    return (
        <div className="mb-4">
            {label && (
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {label}
                </label>
            )}
            <input
                type={type}
                placeholder={placeholder}
                className="block w-full rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 py-2 px-3 text-slate-700"
                {...(register && name ? register(name) : {})}
                {...rest}
            />
            {error && <p className="text-red-700 text-sm mt-1">{error.message}</p>}
        </div>
    )
}

export default Input
