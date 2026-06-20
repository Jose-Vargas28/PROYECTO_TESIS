// Regiones y provincias del Ecuador
export const regionesEcuador = ["Costa", "Sierra", "Oriente", "Galápagos"]

export const provinciasPorRegion = {
    "Costa": [
        "El Oro", "Esmeraldas", "Guayas", "Los Ríos",
        "Manabí", "Santa Elena", "Santo Domingo de los Tsáchilas"
    ],
    "Sierra": [
        "Azuay", "Bolívar", "Cañar", "Carchi", "Chimborazo",
        "Cotopaxi", "Imbabura", "Loja", "Pichincha", "Tungurahua"
    ],
    "Oriente": [
        "Morona Santiago", "Napo", "Orellana", "Pastaza",
        "Sucumbíos", "Zamora Chinchipe"
    ],
    "Galápagos": ["Galápagos"]
}

export const tiposCombustible = [
    { value: "gasolina", label: "Gasolina" },
    { value: "diésel", label: "Diésel" },
    { value: "eléctrico", label: "Eléctrico" },
    { value: "híbrido", label: "Híbrido" }
]

export const tiposVehiculo = [
    { value: "automóvil", label: "Automóvil (sedán, hatchback, crossover)" },
    { value: "suv", label: "SUV" },
    { value: "camioneta", label: "Camioneta / Pickup" },
    { value: "moto", label: "Moto" },
    { value: "vehículo comercial", label: "Vehículo comercial (camión, bus, furgoneta)" }
]

// Años disponibles para registro de vehículos (1990 - 2026)
export const aniosVehiculo = Array.from(
    { length: 2026 - 1990 + 1 },
    (_, i) => 2026 - i  // de más reciente a más antiguo
)
