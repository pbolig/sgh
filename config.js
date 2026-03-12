// config.js — Lógica de configuración del frontend
const CONFIG = {
    API_BASE: "/api",           // El proxy de Nginx redirigirá esto al backend local
    APP_VERSION: "1.0.0",
    SESSION_TIMEOUT: 28800000,  // 8 horas en milisegundos
    JWT_SECRET: "[cadena-aleatoria-generada-en-servidor]"
};
