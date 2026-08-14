'use client'

import { ArrowLeft, ArrowRight, Check, CreditCard } from 'lucide-react'
import { useState, useTransition } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PetAvatar } from '@/components/ui/pet-avatar'
import { business, formatCurrency } from '@/config/business'
import { clubDateInput, clubDateTime, formatDate, formatTime } from '@/lib/datetime'
import { fromCents, quote as computeQuote } from '@/lib/pricing'
import { cn } from '@/lib/utils'
import { checkAvailability, type AvailabilityAnswer } from '@/server/actions/availability'
import { createReservation } from '@/server/actions/reservations'
import { BookingSummary } from './booking-summary'
import { StepDates, StepExtras, StepNotes, StepPet, StepService } from './booking-steps'
import type { BookingDefaults, BookingPet, BookingService } from './booking-types'

const STEPS = ['Mascota', 'Servicio', 'Fechas', 'Adicionales', 'Resumen'] as const

/**
 * Flujo de reserva.
 *
 * Todo el estado vive en el navegador y se guarda una sola vez, al confirmar:
 * un flujo abandonado no debe dejar filas a medias en la base.
 *
 * El total se calcula aqui solo para mostrarlo. El servidor lo vuelve a
 * calcular con los precios vigentes, porque nada que venga del navegador puede
 * decidir cuanto se cobra.
 */
export function BookingStepper({
  pets,
  services,
  addons,
  defaults,
}: {
  pets: BookingPet[]
  services: BookingService[]
  addons: BookingService[]
  defaults: BookingDefaults
}) {
  const today = clubDateInput()

  const [step, setStep] = useState(0)
  const [petId, setPetId] = useState(pets.length === 1 ? pets[0].id : '')
  const [serviceId, setServiceId] = useState('')
  const [startDate, setStartDate] = useState(today)
  const [startTime, setStartTime] = useState(defaults.daycareOpen)
  const [endDate, setEndDate] = useState(today)
  const [endTime, setEndTime] = useState(defaults.daycareClose)
  const [extras, setExtras] = useState<Record<string, number>>({})
  const [notes, setNotes] = useState('')

  const [availability, setAvailability] = useState<AvailabilityAnswer | null>(null)
  const [checking, startChecking] = useTransition()
  const [submitting, startSubmitting] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const service = services.find((s) => s.id === serviceId) ?? null
  const pet = pets.find((p) => p.id === petId) ?? null
  const isBoarding = service?.kind === 'BOARDING'

  const startAt = clubDateTime(startDate, startTime)
  const endAt = clubDateTime(isBoarding ? endDate : startDate, endTime)

  const quote = service
    ? computeQuote({
        service: {
          id: service.id,
          name: service.name,
          kind: service.kind,
          basePrice: service.basePrice,
        },
        extras: addons
          .filter((addon) => (extras[addon.id] ?? 0) > 0)
          .map((addon) => ({
            quantity: extras[addon.id],
            service: {
              id: addon.id,
              name: addon.name,
              kind: addon.kind,
              basePrice: addon.basePrice,
            },
          })),
        startAt,
        endAt,
        taxRate: business.billing.taxRate,
      })
    : null

  function refreshAvailability(nextStart = startDate, nextEnd = endDate) {
    if (!serviceId) return
    startChecking(async () => {
      const answer = await checkAvailability(
        serviceId,
        nextStart,
        isBoarding ? nextEnd : nextStart
      )
      setAvailability(answer)
    })
  }

  function patchDates(patch: Record<string, string>) {
    const nextStart = patch.startDate ?? startDate
    let nextEnd = patch.endDate ?? endDate

    if (patch.startDate) {
      setStartDate(patch.startDate)
      // La salida nunca puede quedar antes de la entrada al mover el calendario.
      if (!isBoarding || nextEnd < patch.startDate) {
        nextEnd = patch.startDate
        setEndDate(patch.startDate)
      }
    }
    if (patch.endDate) setEndDate(patch.endDate)
    if (patch.startTime) setStartTime(patch.startTime)
    if (patch.endTime) setEndTime(patch.endTime)

    if (patch.startDate || patch.endDate) refreshAvailability(nextStart, nextEnd)
  }

  function pickService(id: string) {
    setServiceId(id)
    const picked = services.find((s) => s.id === id)
    if (!picked) return

    // Cada servicio trae su horario habitual; el cliente ajusta si hace falta.
    if (picked.kind === 'BOARDING') {
      setStartTime(defaults.boardingCheckIn)
      setEndTime(defaults.boardingCheckOut)
      const tomorrow = clubDateInput(new Date(Date.now() + 86_400_000))
      if (endDate <= startDate) setEndDate(tomorrow > startDate ? tomorrow : startDate)
    } else {
      setStartTime(defaults.daycareOpen)
      setEndTime(defaults.daycareClose)
      setEndDate(startDate)
    }
  }

  const blockedByAvailability = (availability?.fullDays.length ?? 0) > 0
  const datesValid = endAt > startAt

  const canContinue = [
    Boolean(petId),
    Boolean(serviceId),
    datesValid && !blockedByAvailability && !checking,
    true,
    true,
  ][step]

  function next() {
    setError(null)
    if (step === 1) refreshAvailability()
    setStep((current) => Math.min(current + 1, STEPS.length - 1))
  }

  function submit() {
    setError(null)
    startSubmitting(async () => {
      const result = await createReservation({
        petId,
        serviceId,
        startDate,
        startTime,
        endDate: isBoarding ? endDate : startDate,
        endTime,
        extras: Object.entries(extras).map(([id, quantity]) => ({ serviceId: id, quantity })),
        clientNotes: notes,
      })
      // Si todo sale bien la accion redirige y esto no llega a ejecutarse.
      if (result?.status === 'error') setError(result.message ?? 'No fue posible reservar.')
    })
  }

  return (
    <div className="space-y-5 pb-28 md:pb-0">
      <ol className="flex items-center gap-1.5" aria-label="Pasos de la reserva">
        {STEPS.map((label, index) => (
          <li key={label} className="flex-1">
            <div
              className={cn(
                'h-1.5 rounded-pill transition-colors',
                index <= step ? 'bg-brand-500' : 'bg-line'
              )}
            />
            <p
              className={cn(
                'mt-1.5 text-2xs font-semibold',
                index === step ? 'text-brand-600' : 'text-ink-subtle'
              )}
              aria-current={index === step ? 'step' : undefined}
            >
              {label}
            </p>
          </li>
        ))}
      </ol>

      <Card>
        <CardHeader>
          <CardTitle>
            {step === 0 && 'Para quien es la reserva'}
            {step === 1 && 'Que servicio necesitas'}
            {step === 2 && 'Cuando'}
            {step === 3 && 'Servicios adicionales'}
            {step === 4 && 'Revisa y confirma'}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && <Alert tone="danger">{error}</Alert>}

          {step === 0 && <StepPet pets={pets} value={petId} onChange={setPetId} />}

          {step === 1 && (
            <StepService services={services} value={serviceId} onChange={pickService} />
          )}

          {step === 2 && service && (
            <StepDates
              service={service}
              startDate={startDate}
              startTime={startTime}
              endDate={endDate}
              endTime={endTime}
              onChange={patchDates}
              availability={availability}
              checking={checking}
              minDate={today}
            />
          )}

          {step === 3 && (
            <StepExtras
              addons={addons}
              quantities={extras}
              onChange={(id, quantity) =>
                setExtras((current) => ({ ...current, [id]: Math.max(0, quantity) }))
              }
            />
          )}

          {step === 4 && pet && service && quote && (
            <div className="space-y-5">
              <div className="flex items-center gap-3.5 rounded-card bg-canvas-warm p-4">
                <PetAvatar name={pet.name} photoUrl={pet.photoUrl} size="lg" />
                <div className="min-w-0">
                  <p className="font-extrabold text-navy-900">{pet.name}</p>
                  <p className="text-sm text-ink-muted">{service.name}</p>
                  <p className="text-sm text-ink-muted">
                    {isBoarding
                      ? `${formatDate(startAt)} – ${formatDate(endAt)}`
                      : formatDate(startAt)}{' '}
                    · {formatTime(startAt)} a {formatTime(endAt)}
                  </p>
                </div>
              </div>

              <StepNotes value={notes} onChange={setNotes} />

              <BookingSummary quote={quote} taxLabel={business.billing.taxLabel} />

              <Alert tone="info">
                <span className="flex items-start gap-1.5">
                  <CreditCard className="sr-only" aria-hidden />
                  El pago en linea llega pronto. Por ahora apartamos el lugar y coordinamos el
                  pago contigo al confirmar.
                </span>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumen persistente: el precio siempre visible, sin volver atras. */}
      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur md:static md:inset-auto md:rounded-card md:border md:px-5">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-2xs text-ink-subtle">
              {quote ? `${quote.units} ${quote.unitLabel}` : 'Total'}
            </p>
            <p className="text-lg font-extrabold text-navy-900 tabular-nums">
              {quote ? formatCurrency(fromCents(quote.totalCents)) : '—'}
            </p>
          </div>

          {step > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                setError(null)
                setStep((current) => current - 1)
              }}
            >
              <ArrowLeft aria-hidden />
              <span className="sr-only sm:not-sr-only">Atras</span>
            </Button>
          )}

          {step < STEPS.length - 1 ? (
            <Button onClick={next} disabled={!canContinue}>
              Continuar
              <ArrowRight aria-hidden />
            </Button>
          ) : (
            <Button onClick={submit} loading={submitting} loadingLabel="Reservando">
              <Check aria-hidden />
              Confirmar reserva
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
