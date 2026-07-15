import { redirect } from 'next/navigation'

// Consolidated into the unified Utilisateurs view (role tabs) to remove duplication.
export default function AdminMedecinsRedirect() {
  redirect('/dashboard/admin/utilisateurs?role=MEDECIN')
}
