import { STATS } from '../constants'

export function StatsStrip() {
  return (
    <div className="px-4 md:px-8 mt-4 md:mt-6">
      <div className="mx-auto max-w-[1400px]">
        <div className="bg-[#EBF4FF] rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-[#D0E8FF] divide-y md:divide-y-0 divide-x md:divide-x">
            {STATS.map((s, i) => (
              <div key={i} className={`px-3 md:px-6 py-4 md:py-5 text-center ${i >= 2 ? 'md:border-t-0' : ''}`}>
                <div className="text-[20px] md:text-[26px] font-bold text-[#007DFF] leading-none mb-0.5 md:mb-1">{s.value}</div>
                <div className="text-[10px] md:text-[12px] text-[#465058] uppercase tracking-wider font-medium leading-tight">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
