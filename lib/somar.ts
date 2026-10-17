// Contato de suporte da Somar — a env var permite trocar sem deploy de código; o fallback garante o botão
export const SOMAR_WHATSAPP = (process.env.SOMAR_WHATSAPP || '5585992556672').replace(/\D/g, '')

export const SOMAR_WHATSAPP_URL = `https://wa.me/${SOMAR_WHATSAPP}`
