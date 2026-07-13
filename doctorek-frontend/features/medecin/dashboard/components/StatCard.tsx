interface StatCardProps {
  label: string
  value: number
  sub: string
  icon: React.ReactNode
  /** Kept in the signature for call-site compatibility; accent is uniform now. */
  iconColor?: string
  iconBg?: string
}

/**
 * KPI tile — value first, one brand accent, no decorative meters.
 */
export function StatCard({ label, value, sub, icon }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-[#EEF1F6] bg-white px-4 py-4 md:px-5">
      <div className="flex items-center gap-2 text-[#6B7A99]">
        <span className="[&>svg]:h-4 [&>svg]:w-4 text-[#007DFF]">{icon}</span>
        <p className="text-[12px] font-semibold">{label}</p>
      </div>
      <p className="mt-3 text-[30px] font-extrabold leading-none tabular-nums text-[#010C2D]">
        {value}
      </p>
      <p className="mt-1.5 text-[12px] text-[#A0AEC0]">{sub}</p>
    </div>
  )
}
