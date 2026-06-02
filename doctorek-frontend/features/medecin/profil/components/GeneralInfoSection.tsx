import { Field } from './Field'
import { INPUT_CLS, SPECIALITES } from '../constants'
import type { ProfilForm } from '../types'

interface GeneralInfoSectionProps {
  form: ProfilForm
  set: (field: keyof ProfilForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
}

export function GeneralInfoSection({ form, set }: GeneralInfoSectionProps) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-5">
      <h2 className="text-base font-semibold text-zinc-800">Informations générales</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Prénom" required>
          <input
            type="text"
            value={form.firstName}
            onChange={set('firstName')}
            required
            className={INPUT_CLS}
            placeholder="Youssef"
          />
        </Field>
        <Field label="Nom" required>
          <input
            type="text"
            value={form.lastName}
            onChange={set('lastName')}
            required
            className={INPUT_CLS}
            placeholder="Bakkali"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Spécialité" required>
          <select value={form.specialite} onChange={set('specialite')} required className={INPUT_CLS}>
            <option value="" disabled>Choisir…</option>
            {SPECIALITES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Téléphone">
          <input
            type="tel"
            value={form.phone}
            onChange={set('phone')}
            className={INPUT_CLS}
            placeholder="+212 6 00 00 00 01"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Ville" required>
          <input
            type="text"
            value={form.ville}
            onChange={set('ville')}
            required
            className={INPUT_CLS}
            placeholder="Casablanca"
          />
        </Field>
        <Field label="Adresse du cabinet">
          <input
            type="text"
            value={form.adresse}
            onChange={set('adresse')}
            className={INPUT_CLS}
            placeholder="123 Rue Hassan II"
          />
        </Field>
      </div>

      <Field label="Langue de consultation">
        <select value={form.lang} onChange={set('lang')} className={INPUT_CLS}>
          <option value="fr">Français</option>
          <option value="ar">Arabe</option>
          <option value="en">Anglais</option>
        </select>
      </Field>
    </section>
  )
}
