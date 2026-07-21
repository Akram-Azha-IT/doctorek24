import type { Message } from '@/lib/types'
import { AudioMessage } from './AudioMessage'

interface MessageBubbleProps {
  message: Message
  isMine: boolean
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function MessageBubble({ message, isMine }: MessageBubbleProps) {
  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
          isMine
            ? 'rounded-br-sm bg-[#007DFF] text-white'
            : 'rounded-bl-sm bg-white text-[#333333]'
        }`}
      >
        {message.messageType === 'AUDIO' && message.mediaUrl ? (
          <AudioMessage
            mediaUrl={message.mediaUrl}
            durationSec={message.mediaDurationSec ?? 0}
            mine={isMine}
          />
        ) : (
          <p className="break-words leading-relaxed">{message.content}</p>
        )}
        <div
          className={`mt-1 flex items-center gap-1 text-[10px] ${
            isMine ? 'justify-end text-blue-100' : 'text-gray-400'
          }`}
        >
          <span>{formatTime(message.sentAt)}</span>
          {isMine && (
            <span title={message.readAt ? 'Lu' : 'Envoyé'}>
              {message.readAt ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
