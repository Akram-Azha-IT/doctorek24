interface StatCardProps {
  label: string
  value: number
  sub: string
  icon: React.ReactNode
  iconColor: string
  iconBg: string
}

export function StatCard({ label, value, sub, icon, iconColor, iconBg }: StatCardProps) {
  return (
    <div
      className="rounded-2xl p-5 flex items-center gap-4"
      style={{ background: '#FFFFFF', boxShadow: '0 1px 4px rgba(16,30,54,0.06)', border: '1px solid #EEF1F6' }}
    >
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        style={{ background: iconBg }}
      >
        <span style={{ color: iconColor }}>{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-bold leading-none" style={{ color: '#010C2D' }}>{value}</p>
        <p className="mt-1 text-xs font-semibold" style={{ color: '#6B7A99' }}>{label}</p>
        <p className="mt-0.5 text-[11px]" style={{ color: '#A0AEC0' }}>{sub}</p>
      </div>
    </div>
  )
}
