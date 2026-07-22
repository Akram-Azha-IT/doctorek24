import type { Message } from '@/lib/types'
import { AudioMessage } from './AudioMessage'
import { DocumentMessage } from './DocumentMessage'

interface MessageBubbleProps {
  message: Message
  isMine: boolean
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function ReadReceipt({ read }: { read: boolean }) {
  return (
    <svg width="15" height="11" viewBox="0 0 18 12" fill="none" role="img"
         aria-label={read ? 'Lu' : 'Envoyé'}
         className={read ? 'text-white' : 'text-blue-100/70'}>
      <path d="M1 6.5L4.2 9.6L10.5 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.5 9.4L13.8 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity={read ? 1 : 0} />
    </svg>
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
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-1.5`}>
      <div
        className={[
          'group relative max-w-[75%] rounded-2xl text-sm shadow-[0_1px_2px_rgba(1,12,45,0.06)] ring-1',
          isMedia ? 'px-2.5 py-2' : 'px-3.5 py-2',
          isMine
            ? 'rounded-br-md bg-[#007DFF] text-white ring-[#007DFF]'
            : 'rounded-bl-md bg-white text-[#1c2733] ring-[#EAEEF3]',
        ].join(' ')}
      >
        {renderContent()}
        <div
          className={`mt-1 flex items-center justify-end gap-1 text-[10.5px] tabular-nums ${
            isMine ? 'text-blue-50/80' : 'text-[#8A97A6]'
          }`}
        >
          <span>{formatTime(message.sentAt)}</span>
          {isMine && <ReadReceipt read={!!message.readAt} />}
        </div>
      </div>
    </div>
  )
}
