/** "Casa Prox. Jericoacoara" → "casa-prox-jericoacoara" (sem acentos, só a-z, 0-9 e hífen) */
export function slugify(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '')
}
