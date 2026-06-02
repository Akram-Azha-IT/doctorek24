import { STATS } from '../constants'

export function StatsStrip() {
  return (
    <div className="px-4 md:px-8 mt-6">
      <div className="mx-auto max-w-[1400px]">
        <div className="bg-[#EBF4FF] rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#D0E8FF]">
            {STATS.map((s, i) => (
              <div key={i} className="px-6 py-5 text-center">
                <div className="text-[26px] font-bold text-[#007DFF] leading-none mb-1">{s.value}</div>
                <div className="text-[12px] text-[#465058] uppercase tracking-wider font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
