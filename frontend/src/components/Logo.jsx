import { Link } from "react-router"
import { theme } from "../config/theme"

// =============================================================
//  COMPONENTE LOGO
//  Cuando tengas tu logo, colócalo en src/assets/ y descomenta
//  la línea de la imagen. Mientras tanto muestra un placeholder.
//
//  Prop linkToHome: si es true, al hacer clic lleva al inicio (/).
// =============================================================

// 1. Cuando tengas tu logo, descomenta esta línea y ajusta el nombre del archivo:
// import logoImg from "../assets/logo.png"

const Logo = ({ size = "md", showText = true, light = false, linkToHome = false }) => {
    const sizes = {
        sm: { img: "h-8 w-8", text: "text-lg" },
        md: { img: "h-12 w-12", text: "text-2xl" },
        lg: { img: "h-20 w-20", text: "text-3xl" },
    }

    const textColor = light ? "text-white" : "text-blue-900"

    const contenido = (
        <div className="flex items-center gap-3">
            {/* 2. Cuando tengas el logo, reemplaza este bloque por:
                <img src={logoImg} alt={theme.nombreSistema} className={`${sizes[size].img} object-contain`} />
            */}
            <div className={`${sizes[size].img} bg-blue-900 rounded-lg flex items-center justify-center`}>
                <span className="text-white font-black text-xl">A</span>
            </div>

            {showText && (
                <span className={`${sizes[size].text} font-black ${textColor}`}>
                    {theme.nombreSistema}
                </span>
            )}
        </div>
    )

    // Si linkToHome es true, lo envolvemos en un Link al inicio
    if (linkToHome) {
        return (
            <Link to="/" className="inline-block hover:opacity-80 transition-opacity">
                {contenido}
            </Link>
        )
    }

    return contenido
}

export default Logo
