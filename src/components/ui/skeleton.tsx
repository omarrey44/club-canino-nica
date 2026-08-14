import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('skeleton-shimmer relative overflow-hidden rounded-field bg-navy-100', className)}
      aria-hidden
    />
  )
}

export function PageSkeleton({
  variant = 'list',
}: {
  variant?: 'list' | 'dashboard' | 'form'
}) {
  return (
    <div className="space-y-4 sm:space-y-5" role="status" aria-live="polite">
      <span className="sr-only">Cargando contenido…</span>
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-8 w-56 max-w-[75vw]" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      {variant === 'dashboard' && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-28 rounded-card" />
          ))}
        </div>
      )}

      {variant === 'form' ? (
        <div className="max-w-3xl rounded-card border border-line bg-surface p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          {variant === 'dashboard' && <SkeletonCard />}
        </div>
      )}
    </div>
  )
}

/** Placeholder de una card de lista mientras carga el servidor. */
export function SkeletonCard() {
  return (
    <div className="rounded-card border border-line bg-surface p-5">
      <div className="flex items-center gap-3">
        <Skeleton className="size-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  )
}
