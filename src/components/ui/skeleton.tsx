import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-field bg-navy-100', className)}
      aria-hidden
    />
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
