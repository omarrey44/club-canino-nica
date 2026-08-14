'use client'

import { AlertTriangle, Minus, Plus } from 'lucide-react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, Hint, Input, Label, Textarea } from '@/components/ui/field'
import { OptionCard } from '@/components/ui/option-card'
import { PetAvatar } from '@/components/ui/pet-avatar'
import { business, formatCurrency } from '@/config/business'
import { formatDate } from '@/lib/datetime'
import type { AvailabilityAnswer } from '@/server/actions/availability'
import type { BookingPet, BookingService } from './booking-types'

export function StepPet({
  pets,
  value,
  onChange,
}: {
  pets: BookingPet[]
  value: string
  onChange: (id: string) => void
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="sr-only">Elige la mascota</legend>
      {pets.map((pet) => (
        <OptionCard
          key={pet.id}
          name="pet"
          value={pet.id}
          checked={value === pet.id}
          onSelect={onChange}
          title={pet.name}
          description={pet.breed}
          media={<PetAvatar name={pet.name} photoUrl={pet.photoUrl} size="lg" />}
        />
      ))}
    </fieldset>
  )
}

export function StepService({
  services,
  value,
  onChange,
}: {
  services: BookingService[]
  value: string
  onChange: (id: string) => void
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="sr-only">Elige el servicio</legend>
      {services.map((service) => (
        <OptionCard
          key={service.id}
          name="service"
          value={service.id}
          checked={value === service.id}
          onSelect={onChange}
          title={service.name}
          description={service.description}
          aside={
            <div className="shrink-0 text-right">
              <p className="font-extrabold text-navy-900 tabular-nums">
                {formatCurrency(service.basePrice)}
              </p>
              <p className="text-2xs text-ink-subtle">
                {service.kind === 'BOARDING' ? 'por noche' : 'por día'}
              </p>
            </div>
          }
        />
      ))}
    </fieldset>
  )
}

export function StepDates({
  service,
  startDate,
  startTime,
  endDate,
  endTime,
  onChange,
  availability,
  checking,
  minDate,
}: {
  service: BookingService
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  onChange: (patch: Record<string, string>) => void
  availability: AvailabilityAnswer | null
  checking: boolean
  minDate: string
}) {
  // En guardería la salida es el mismo dia: mostrar dos calendarios solo
  // confundiria y permitiria rangos que el servicio no cubre.
  const isBoarding = service.kind === 'BOARDING'

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <Label>{isBoarding ? 'Fecha de entrada' : 'Fecha'}</Label>
          <Input
            type="date"
            min={minDate}
            value={startDate}
            onChange={(event) => onChange({ startDate: event.target.value })}
          />
        </Field>

        <Field>
          <Label>Hora de entrada</Label>
          <Input
            type="time"
            value={startTime}
            onChange={(event) => onChange({ startTime: event.target.value })}
          />
        </Field>

        {isBoarding && (
          <Field>
            <Label>Fecha de salida</Label>
            <Input
              type="date"
              min={startDate || minDate}
              value={endDate}
              onChange={(event) => onChange({ endDate: event.target.value })}
            />
          </Field>
        )}

        <Field className={isBoarding ? undefined : 'sm:col-span-1'}>
          <Label>Hora de salida</Label>
          <Input
            type="time"
            value={endTime}
            onChange={(event) => onChange({ endTime: event.target.value })}
          />
        </Field>
      </div>

      <Hint>
        Horario del club: {business.hours.daycareOpen} a {business.hours.daycareClose}. Estos
        horarios son de demostracion y estan pendientes de confirmar.
      </Hint>

      {checking && <p className="text-sm text-ink-muted">Consultando disponibilidad...</p>}

      {!checking && availability?.fullDays.length ? (
        <Alert tone="danger">
          <span className="flex items-start gap-1.5">
            <AlertTriangle className="sr-only" aria-hidden />
            No hay cupo el{' '}
            {availability.fullDays
              .map((day) => formatDate(new Date(`${day}T12:00:00Z`)))
              .join(', ')}
            . Elige otra fecha.
          </span>
        </Alert>
      ) : null}

      {!checking &&
        availability &&
        availability.fullDays.length === 0 &&
        availability.remaining !== null && (
          <Alert tone={availability.remaining <= 3 ? 'warning' : 'success'}>
            {availability.remaining <= 3
              ? `Quedan ${availability.remaining} lugares para ese día.`
              : 'Hay lugares disponibles para ese día.'}
          </Alert>
        )}
    </div>
  )
}

export function StepExtras({
  addons,
  quantities,
  onChange,
}: {
  addons: BookingService[]
  quantities: Record<string, number>
  onChange: (serviceId: string, quantity: number) => void
}) {
  if (addons.length === 0) {
    return (
      <p className="text-sm text-ink-muted">
        Por ahora no ofrecemos servicios adicionales. Puedes continuar.
      </p>
    )
  }

  return (
    <ul className="space-y-3">
      {addons.map((addon) => {
        const quantity = quantities[addon.id] ?? 0

        return (
          <li
            key={addon.id}
            className="flex items-center gap-3 rounded-card border border-line bg-surface p-4"
          >
            <div className="min-w-0 flex-1">
              <p className="font-bold text-navy-900">{addon.name}</p>
              {addon.description && (
                <p className="mt-0.5 text-sm text-ink-muted">{addon.description}</p>
              )}
              <p className="mt-1 text-sm font-semibold text-brand-600 tabular-nums">
                {formatCurrency(addon.basePrice)}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={`Quitar un ${addon.name}`}
                disabled={quantity === 0}
                onClick={() => onChange(addon.id, quantity - 1)}
              >
                <Minus aria-hidden />
              </Button>
              <span
                className="w-8 text-center font-bold tabular-nums"
                aria-live="polite"
                aria-label={`${quantity} ${addon.name}`}
              >
                {quantity}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={`Agregar un ${addon.name}`}
                disabled={quantity >= 10}
                onClick={() => onChange(addon.id, quantity + 1)}
              >
                <Plus aria-hidden />
              </Button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function StepNotes({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Field>
      <Label>Algo que debamos saber</Label>
      <Textarea
        rows={3}
        value={value}
        maxLength={400}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Llega con su cobija. Se pone nervioso con truenos."
      />
      <Hint>Opcional. Lo lee el equipo que la va a cuidar.</Hint>
    </Field>
  )
}
