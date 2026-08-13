import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Skeleton className="h-64 rounded-card sm:h-56" />
      <Skeleton className="h-24 rounded-card" />
      <Skeleton className="h-48 rounded-card" />
    </div>
  )
}
