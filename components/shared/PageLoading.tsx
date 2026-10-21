/** Esqueleto mostrado na hora em que a pessoa toca num link, enquanto a página carrega */
export function PageLoading() {
  return (
    <div className="space-y-4 p-4 pt-6" aria-busy="true" aria-label="Carregando">
      <div className="h-7 w-40 animate-pulse rounded-lg bg-gray-200/80" />
      <div className="h-4 w-64 animate-pulse rounded bg-gray-200/60" />
      <div className="grid grid-cols-2 gap-2">
        <div className="h-10 animate-pulse rounded-xl bg-gray-200/60" />
        <div className="h-10 animate-pulse rounded-xl bg-gray-200/60" />
      </div>
      <div className="h-64 animate-pulse rounded-3xl bg-gray-200/50" />
      <div className="h-24 animate-pulse rounded-3xl bg-gray-200/40" />
    </div>
  )
}
