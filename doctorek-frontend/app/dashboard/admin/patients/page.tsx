import { redirect } from 'next/navigation'

// Consolidated into the unified Utilisateurs view (role tabs) to remove duplication.
export default function AdminPatientsRedirect() {
  redirect('/dashboard/admin/utilisateurs?role=PATIENT')
}
