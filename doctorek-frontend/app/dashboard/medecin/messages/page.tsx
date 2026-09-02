'use client'

import { MessagesView } from '@/features/messaging/components/MessagesView'

export default function MedecinMessagesPage() {
  return (
    <div className="h-full min-h-[calc(100dvh-8.5rem)] xl:min-h-[calc(100dvh-4rem)]">
      <MessagesView />
    </div>
  )
}
