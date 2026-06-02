'use client'

import { MessagesView } from '@/features/messaging/components/MessagesView'

export default function MedecinMessagesPage() {
  return (
    <div className="h-full p-6">
      <div className="h-full" style={{ minHeight: 'calc(100vh - 10rem)' }}>
        <MessagesView />
      </div>
    </div>
  )
}
