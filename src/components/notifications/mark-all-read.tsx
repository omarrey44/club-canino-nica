'use client'

import { CheckCheck } from 'lucide-react'
import { useTransition } from 'react'

import { Button } from '@/components/ui/button'
import { markAllNotificationsRead } from '@/server/actions/notifications'

export function MarkAllReadButton({ disabled }: { disabled: boolean }) {
  const [pending, startTransition] = useTransition()

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={disabled}
      loading={pending}
      loadingLabel="Marcando"
      onClick={() => startTransition(async () => void (await markAllNotificationsRead()))}
    >
      <CheckCheck aria-hidden />
      Marcar todo como leído
    </Button>
  )
}
