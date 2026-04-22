import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Bot } from 'lucide-react'

export default function TypingIndicator() {
  return (
    <div className="flex gap-3 mb-4 chat-bubble-assistant">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="bg-muted">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
        <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground/60" />
        <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground/60" />
        <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground/60" />
      </div>
    </div>
  )
}