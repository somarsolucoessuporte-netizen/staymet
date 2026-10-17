import { SOMAR_WHATSAPP_URL } from '@/lib/somar'
import { cn } from '@/lib/utils'

const FALE_CONOSCO_TEXT = encodeURIComponent('Olá! Vi o guia do hóspede da Somar e quero saber mais.')

/**
 * Assinatura discreta da Somar — rodapé padrão de todos os produtos.
 * "Somar Soluções Digitais" → site · "Fale conosco" → WhatsApp comercial.
 */
export function SomarFooter({ className, tone = 'light' }: { className?: string; tone?: 'light' | 'dark' }) {
  const base = tone === 'dark' ? 'text-white/30' : 'text-gray-400/80'
  const link = tone === 'dark' ? 'hover:text-white/60' : 'hover:text-gray-600'

  return (
    <footer className={cn('text-center text-[10px] leading-relaxed py-4', base, className)}>
      <p>
        Feito por{' '}
        <a href="https://somar.ia.br" target="_blank" rel="noopener noreferrer" className={cn('font-semibold underline-offset-2 hover:underline', link)}>
          Somar Soluções Digitais
        </a>
        {' · '}
        <a href={`${SOMAR_WHATSAPP_URL}?text=${FALE_CONOSCO_TEXT}`} target="_blank" rel="noopener noreferrer" className={cn('underline-offset-2 hover:underline', link)}>
          Fale conosco
        </a>
      </p>
      <p className="opacity-80">© 2019–2026 Somar.IA — Todos os direitos reservados.</p>
    </footer>
  )
}
