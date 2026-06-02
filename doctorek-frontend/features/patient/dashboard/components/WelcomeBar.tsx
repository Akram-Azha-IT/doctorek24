interface WelcomeBarProps {
  firstName: string | null
  rdvsAVenir: number
}

export function WelcomeBar({ firstName, rdvsAVenir }: WelcomeBarProps) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-[#333333]">
        Bonjour {firstName ?? 'Patient'},
      </h1>
      <p className="text-sm text-[#465058] mt-1">
        {rdvsAVenir === 0
          ? "Vous n'avez aucun rendez-vous à venir aujourd'hui"
          : `Vous avez ${rdvsAVenir} rendez-vous à venir`}
      </p>
    </div>
  )
}
