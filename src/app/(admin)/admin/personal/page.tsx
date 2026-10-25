import { UserCog } from 'lucide-react'
import type { Metadata } from 'next'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { StaffForm } from '@/components/users/staff-form'
import { ActiveToggle, RoleSelect } from '@/components/users/user-controls'
import { roleLabels } from '@/lib/constants/labels'
import { requireRole } from '@/server/auth/session'
import { getStaff } from '@/server/queries/admin-users'

export const metadata: Metadata = { title: 'Personal' }

export default async function AdminStaffPage() {
  const user = await requireRole('ADMIN', 'SUPER_ADMIN')
  const staff = await getStaff(user.organizationId)

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        eyebrow="Comunidad"
        icon={UserCog}
        title="Personal"
        description="Quién entra al panel y con qué permisos."
      />

      <Card>
        <CardHeader>
          <CardTitle>Agregar al equipo</CardTitle>
          <p className="text-sm text-ink-muted">
            Si el correo ya es de un cliente, se le da acceso al panel con su contraseña de siempre.
          </p>
        </CardHeader>
        <CardContent>
          <StaffForm />
        </CardContent>
      </Card>

      <ul className="stagger-enter divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
        {staff.map((member) => {
          const isSelf = member.id === user.id
          // Nadie edita su propia cuenta ni, sin serlo, la de un super administrador.
          const locked = isSelf || (member.role === 'SUPER_ADMIN' && user.role !== 'SUPER_ADMIN')

          return (
            <li key={member.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-bold text-navy-900">
                  {member.fullName}
                  {isSelf && <span className="text-xs font-semibold text-ink-muted">(tú)</span>}
                  {!member.isActive && <StatusBadge tone="danger">Desactivado</StatusBadge>}
                </p>
                <p className="truncate text-sm text-ink-muted">
                  {[member.email, member.phone].filter(Boolean).join(' · ')}
                </p>
              </div>

              {locked ? (
                <StatusBadge tone="brand">{roleLabels[member.role]}</StatusBadge>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <RoleSelect userId={member.id} role={member.role} name={member.fullName} />
                  <ActiveToggle userId={member.id} active={member.isActive} name={member.fullName} />
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
