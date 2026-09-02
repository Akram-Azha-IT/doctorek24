import type { Message } from '@/lib/types'
import { AudioMessage } from './AudioMessage'
import { DocumentMessage } from './DocumentMessage'
import { Check, CheckCheck } from 'lucide-react'

interface MessageBubbleProps {
  message: Message
  isMine: boolean
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function ReadReceipt({ read }: { readonly read: boolean }) {
  const Icon = read ? CheckCheck : Check
  return (
    <Icon className="h-4 w-4 text-[#007DFF]" role="img" aria-label={read ? 'Lu' : 'Envoyé'} />
  )
}

export function MessageBubble({ message, isMine }: MessageBubbleProps) {
  const isMedia = message.messageType === 'AUDIO' || message.messageType === 'DOCUMENT'

  function renderContent() {
    if (message.messageType === 'AUDIO' && message.mediaUrl) {
      return <AudioMessage mediaUrl={message.mediaUrl} durationSec={message.mediaDurationSec ?? 0} mine={isMine} />
    }
    if (message.messageType === 'DOCUMENT' && message.mediaUrl) {
      return (
        <DocumentMessage
          mediaUrl={message.mediaUrl}
          filename={message.mediaFilename ?? 'document'}
          size={message.mediaSize ?? 0}
          mine={isMine}
        />
      )
    }
    return <p className="whitespace-pre-wrap break-words text-[13.5px] leading-relaxed">{message.content}</p>
  }

  return (
    <div className={`mb-3 flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={[
          'group relative max-w-[78%] rounded-2xl text-sm ring-1',
          isMedia ? 'px-3 py-2.5' : 'px-4 py-2.5',
          isMine
            ? 'rounded-br-md bg-[#EDF5FF] text-[#17305C] ring-[#CEE1F7]'
            : 'rounded-bl-md bg-white text-[#1C2733] ring-[#DCE3ED]',
        ].join(' ')}
      >
        {renderContent()}
        <div
          className={`mt-1 flex items-center justify-end gap-1 text-[10.5px] tabular-nums ${
            isMine ? 'text-[#5E7EA8]' : 'text-[#8A97A6]'
          }`}
        >
          <span>{formatTime(message.sentAt)}</span>
          {isMine && <ReadReceipt read={!!message.readAt} />}
        </div>
      </div>
    </div>
  )
}
