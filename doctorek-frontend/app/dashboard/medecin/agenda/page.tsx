import { redirect } from 'next/navigation'

export default function AgendaRedirect() {
  redirect('/dashboard/medecin/disponibilites')
}
