import Image from 'next/image'
import Link from 'next/link'
import { Phone, Mail } from 'lucide-react'
import Logo from '@/components/Logo'

export function Footer() {
  return (
    <footer className="bg-[#00263C] pt-14 pb-0">
      <div className="mx-auto max-w-[1400px] px-4 md:px-8">

        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12">

          {/* Brand */}
          <div className="col-span-1">
            <div className="mb-4">
              <Logo className="h-10 w-auto" width={140} height={47} style={{ filter: 'brightness(0) invert(1)' }} />
            </div>
            <p className="text-[#B6DAF7] text-[13px] leading-relaxed mb-6">
              La première plateforme numérique de santé au Maroc. Votre santé, notre engagement national.
            </p>
            <div className="flex flex-col gap-2">
              <a href="mailto:contact@doctorek.ma" className="flex items-center gap-2 text-[#B6DAF7] text-[13px] hover:text-white transition-colors">
                <Mail className="h-4 w-4 text-[#007DFF]" />
                contact@doctorek.ma
              </a>
              <a href="tel:+212500000000" className="flex items-center gap-2 text-[#B6DAF7] text-[13px] hover:text-white transition-colors">
                <Phone className="h-4 w-4 text-[#007DFF]" />
                +212 5 00 00 00 00
              </a>
            </div>
          </div>

          {/* Specialties */}
          <div>
            <h4 className="font-bold text-white text-[12px] mb-4 tracking-wide uppercase">Spécialités</h4>
            <ul className="space-y-3 text-[13px] text-[#B6DAF7]">
              {[
                { label: 'Médecin généraliste', icon: '/medecin.png' },
                { label: 'Pédiatre', icon: '/therapie.png' },
                { label: 'Gynécologue', icon: '/gynecologue.png' },
                { label: 'Dentiste', icon: '/dentiste.png' },
              ].map((item) => (
                <li key={item.label}>
                  <Link href="/recherche" className="flex items-center gap-2 hover:text-white transition-colors">
                    <Image src={item.icon} alt={item.label} width={16} height={16} className="opacity-70" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Patients */}
          <div>
            <h4 className="font-bold text-white tracking-wide uppercase text-[12px] mb-4">Patients</h4>
            <ul className="space-y-3 text-[13px] text-[#B6DAF7]">
              <li><Link href="/recherche" className="hover:text-white transition-colors">Trouver un praticien</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Se connecter</Link></li>
              <li><Link href="/inscription" className="hover:text-white transition-colors">Créer un compte</Link></li>
              <li><Link href="/help" className="hover:text-white transition-colors">Centre d&apos;aide</Link></li>
            </ul>
          </div>

          {/* Professionals */}
          <div>
            <h4 className="font-bold text-white tracking-wide uppercase text-[12px] mb-4">Professionnels</h4>
            <ul className="space-y-3 text-[13px] text-[#B6DAF7]">
              <li><Link href="/inscription?role=medecin" className="hover:text-white transition-colors">Logiciel Doctorek Pro</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Espace médecin</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom strip */}
        <div className="border-t border-white/10 py-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-[12px] text-[#B6DAF7]">
            © {new Date().getFullYear()} Doctorek. Tous droits réservés.
          </p>
          <div className="flex gap-5 text-[12px] text-[#B6DAF7]">
            <Link href="#" className="hover:text-white transition-colors">Conditions générales</Link>
            <Link href="#" className="hover:text-white transition-colors">Confidentialité</Link>
            <Link href="#" className="hover:text-white transition-colors">Mentions légales</Link>
          </div>
        </div>

      </div>
    </footer>
  )
}
