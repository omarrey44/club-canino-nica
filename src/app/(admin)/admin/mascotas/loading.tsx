import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-12 rounded-field" />
      <Skeleton className="h-72 rounded-card" />
    </div>
  )
}
