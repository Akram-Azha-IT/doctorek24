import { Field } from './Field'
import { INPUT_CLS, SPECIALITES } from '../constants'
import type { ProfilForm } from '../types'
import { UserRound } from 'lucide-react'

interface GeneralInfoSectionProps {
  form: ProfilForm
  set: (field: keyof ProfilForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
}

export function GeneralInfoSection({ form, set }: GeneralInfoSectionProps) {
  return (
    <section className="space-y-6 rounded-2xl border border-[#DCE3ED] bg-white p-5 shadow-[0_2px_10px_rgba(15,39,73,0.05)] sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEF6FF] text-[#007DFF]">
          <UserRound className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 className="text-lg font-bold tracking-[-0.02em] text-[#101A38]">Informations professionnelles</h2>
      </div>

      <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
        <Field label="Prénom" htmlFor="profile-first-name" required>
          <input
            id="profile-first-name"
            type="text"
            value={form.firstName}
            onChange={set('firstName')}
            required
            className={INPUT_CLS}
            placeholder="Youssef"
          />
        </Field>
        <Field label="Nom" htmlFor="profile-last-name" required>
          <input
            id="profile-last-name"
            type="text"
            value={form.lastName}
            onChange={set('lastName')}
            required
            className={INPUT_CLS}
            placeholder="Bakkali"
          />
        </Field>
        <Field label="Spécialité" htmlFor="profile-speciality" required>
          <select id="profile-speciality" value={form.specialite} onChange={set('specialite')} required className={INPUT_CLS}>
            <option value="" disabled>Choisir…</option>
            {SPECIALITES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Téléphone" htmlFor="profile-phone">
          <input
            id="profile-phone"
            type="tel"
            value={form.phone}
            onChange={set('phone')}
            className={INPUT_CLS}
            placeholder="+212 6 00 00 00 01"
          />
        </Field>
        <Field label="Ville" htmlFor="profile-city" required>
          <input
            id="profile-city"
            type="text"
            value={form.ville}
            onChange={set('ville')}
            required
            className={INPUT_CLS}
            placeholder="Casablanca"
          />
        </Field>
        <Field label="Adresse du cabinet" htmlFor="profile-address">
          <input
            id="profile-address"
            type="text"
            value={form.adresse}
            onChange={set('adresse')}
            className={INPUT_CLS}
            placeholder="123 Rue Hassan II"
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Langue de consultation" htmlFor="profile-language">
            <select id="profile-language" value={form.lang} onChange={set('lang')} className={INPUT_CLS}>
              <option value="fr">Français</option>
              <option value="ar">Arabe</option>
              <option value="en">Anglais</option>
            </select>
          </Field>
        </div>
      </div>
    </section>
  )
}
