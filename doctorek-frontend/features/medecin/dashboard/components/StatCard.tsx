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
      className="rounded-2xl px-4 py-4 md:px-5 md:py-5 flex flex-col gap-3"
      style={{ background: '#FFFFFF', boxShadow: '0 1px 4px rgba(16,30,54,0.06)', border: '1px solid #EEF1F6' }}
    >
      <div className="flex items-center justify-between">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: iconBg }}
        >
          <span style={{ color: iconColor }}>{icon}</span>
        </div>
        <div
          className="h-1 w-12 rounded-full overflow-hidden"
          style={{ background: iconBg }}
        >
          <div className="h-full rounded-full" style={{ width: '60%', background: iconColor, opacity: 0.7 }} />
        </div>
      </div>
      <div>
        <p className="text-[28px] font-extrabold leading-none tabular-nums" style={{ color: '#010C2D' }}>{value}</p>
        <p className="mt-1.5 text-[12px] font-semibold" style={{ color: '#6B7A99' }}>{label}</p>
        <p className="mt-0.5 text-[11px]" style={{ color: '#B0BAC9' }}>{sub}</p>
      </div>
    </div>
  )
}
