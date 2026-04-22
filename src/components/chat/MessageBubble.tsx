import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Bot, User } from 'lucide-react'

interface Props {
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
}

export default function MessageBubble({ role, content, createdAt }: Props) {
  const isUser = role === 'user'

  return (
    <div className={cn('flex gap-3 mb-4', isUser ? 'flex-row-reverse chat-bubble-user' : 'chat-bubble-assistant')}>
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className={isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      <div className={cn('flex flex-col gap-1 max-w-[75%]', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : 'bg-muted text-foreground rounded-tl-sm'
          )}
        >
          {content}
        </div>
        <span className="text-xs text-muted-foreground px-1">
          {createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  )
}