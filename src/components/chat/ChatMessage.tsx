import { Bot, User } from 'lucide-react';
import type { ChatMessage } from '../../types';
import { cn } from '../../lib/utils';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  message: ChatMessage;
}

export default function ChatMessageItem({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn(
      "flex gap-3 px-4 py-4",
      isUser ? "justify-end" : "justify-start",
    )}>
      {/* Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
          <Bot className="w-4 h-4 text-accent" />
        </div>
      )}

      {/* Message bubble */}
      <div className={cn(
        "max-w-[80%] rounded-2xl px-4 py-3",
        isUser
          ? "bg-accent text-white rounded-tr-md"
          : "bg-muted/50 text-foreground border border-border/30 rounded-tl-md",
      )}>
        <div className={cn(
          "prose prose-sm max-w-none",
          isUser ? "prose-invert" : "prose-gray",
          "prose-p:leading-relaxed prose-p:my-1",
          "prose-ul:my-1 prose-li:my-0.5",
          "prose-strong:text-inherit",
        )}>
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-foreground/10 flex items-center justify-center shrink-0 mt-0.5">
          <User className="w-4 h-4 text-foreground/60" />
        </div>
      )}
    </div>
  );
}