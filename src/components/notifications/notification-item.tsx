'use client'

import {
  BellRing,
  CalendarCheck,
  Camera,
  CircleCheckBig,
  ClipboardList,
  CreditCard,
  LogIn,
  Syringe,
  Utensils,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useTransition } from 'react'
import type { Route } from 'next'

import { PetAvatar } from '@/components/ui/pet-avatar'
import { markNotificationRead } from '@/server/actions/notifications'
import { relativeTime } from '@/lib/datetime'
import { cn } from '@/lib/utils'
import type { NotificationType } from '@/generated/prisma/client'

const icons: Record<NotificationType, LucideIcon> = {
  RESERVATION_CONFIRMED: CalendarCheck,
  PAYMENT_CONFIRMED: CreditCard,
  CHECK_IN: LogIn,
  NEW_ACTIVITY: Utensils,
  NEW_PHOTO: Camera,
  NEW_REPORT: ClipboardList,
  READY_FOR_PICKUP: CircleCheckBig,
  RESERVATION_REMINDER: BellRing,
  VACCINATION_DUE: Syringe,
}

export type NotificationItemData = {
  id: string
  type: NotificationType
  title: string
  body: string
  linkUrl: string | null
  readAt: Date | null
  createdAt: Date
  pet: { name: string; photoUrl: string | null } | null
}

/**
 * Un aviso de la lista.
 *
 * Al tocarlo se marca como leído y se navega. Si no lleva enlace, el toque
 * solo lo marca: un aviso que no se puede quitar de encima se vuelve ruido.
 */
export function NotificationItem({ notification }: { notification: NotificationItemData }) {
  const [pending, startTransition] = useTransition()
  const Icon = icons[notification.type]
  const unread = notification.readAt === null

  const content = (
    <>
      {notification.pet ? (
        <PetAvatar name={notification.pet.name} photoUrl={notification.pet.photoUrl} />
      ) : (
        <span
          className={cn(
            'flex size-12 shrink-0 items-center justify-center rounded-full',
            unread ? 'bg-brand-50 text-brand-700' : 'bg-navy-50 text-navy-400'
          )}
          aria-hidden
        >
          <Icon className="size-5" />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <p className={cn('flex-1 text-ink', unread ? 'font-extrabold' : 'font-semibold')}>
            {notification.title}
          </p>
          {unread && (
            <span
              className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-500"
              aria-label="Sin leer"
            />
          )}
        </div>
        <p className="mt-0.5 text-sm leading-relaxed text-ink-muted">{notification.body}</p>
        <p className="mt-1 text-2xs text-ink-subtle">{relativeTime(notification.createdAt)}</p>
      </div>
    </>
  )

  const classes = cn(
    'flex w-full items-start gap-3.5 rounded-card border p-4 text-left transition-colors',
    unread ? 'border-brand-200 bg-brand-50/40' : 'border-line bg-surface',
    pending && 'opacity-60'
  )

  function markRead() {
    if (!unread) return
    startTransition(async () => {
      await markNotificationRead(notification.id)
    })
  }

  if (notification.linkUrl) {
    return (
      <Link href={notification.linkUrl as Route} className={classes} onClick={markRead}>
        {content}
      </Link>
    )
  }

  return (
    <button type="button" className={classes} onClick={markRead} disabled={!unread}>
      {content}
    </button>
  )
}
