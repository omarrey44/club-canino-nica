import type { LucideIcon } from 'lucide-react'

import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'

/**
 * Seccion navegable cuya funcionalidad llega en una fase posterior.
 *
 * Existe para que la navegacion completa se pueda recorrer y revisar desde la
 * Fase 1 sin que ningun enlace lleve a un 404 ni a una pantalla en blanco.
 */
export function PhasePlaceholder({
  title,
  description,
  icon,
  emptyTitle,
  emptyDescription,
  phase,
}: {
  title: string
  description: string
  icon: LucideIcon
  emptyTitle: string
  emptyDescription: string
  phase: string
}) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <EmptyState icon={icon} title={emptyTitle} description={emptyDescription} />
      <p className="text-center text-xs text-ink-subtle">
        Modulo en construccion · {phase}
      </p>
    </div>
  )
}
