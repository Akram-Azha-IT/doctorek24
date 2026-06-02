'use client'

import LogoLoader from '@/components/LogoLoader'

export default function LoaderTestPage() {
  return (
    <div className="min-h-screen bg-[#F0F2F5] p-8 flex flex-col gap-12 items-center">
      <h1 className="text-2xl font-bold text-[#333333]">LogoLoader debug</h1>

      <section className="flex flex-col items-center gap-3">
        <p className="text-sm text-[#465058]">Default (width 160)</p>
        <div className="bg-white rounded-2xl p-10 border border-[#E2E8F0]">
          <LogoLoader />
        </div>
      </section>

      <section className="flex flex-col items-center gap-3">
        <p className="text-sm text-[#465058]">With label</p>
        <div className="bg-white rounded-2xl p-10 border border-[#E2E8F0]">
          <LogoLoader label="Chargement…" />
        </div>
      </section>

      <section className="flex flex-col items-center gap-3">
        <p className="text-sm text-[#465058]">Small (90)</p>
        <div className="bg-white rounded-2xl p-10 border border-[#E2E8F0]">
          <LogoLoader width={90} />
        </div>
      </section>

      <section className="flex flex-col items-center gap-3">
        <p className="text-sm text-[#465058]">Large (260)</p>
        <div className="bg-white rounded-2xl p-10 border border-[#E2E8F0]">
          <LogoLoader width={260} />
        </div>
      </section>

      <section className="flex flex-col items-center gap-3">
        <p className="text-sm text-[#465058]">On dark bg</p>
        <div className="bg-[#00263C] rounded-2xl p-10">
          <LogoLoader width={180} />
        </div>
      </section>

      <p className="text-xs text-[#465058] mt-8">
        Route: <code className="bg-white px-2 py-1 rounded">/loader-test</code>
      </p>
    </div>
  )
}
