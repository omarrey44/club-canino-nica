import { redirect } from 'next/navigation'

import { getCurrentUser, isStaff } from '@/server/auth/session'

/** La raiz solo enruta segun rol. La landing publica llegara despues. */
export default async function RootPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  redirect(isStaff(user.role) ? '/admin' : '/inicio')
}
