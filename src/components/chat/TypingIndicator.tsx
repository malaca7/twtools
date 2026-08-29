import type { TypingUser } from "@/types/chat";

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (!typingUsers || typingUsers.length === 0) return null;

  let text = "";
  if (typingUsers.length === 1) {
    text = `${typingUsers[0].user_name} está digitando...`;
  } else if (typingUsers.length === 2) {
    text = `${typingUsers[0].user_name} e ${typingUsers[1].user_name} estão digitando...`;
  } else {
    text = `${typingUsers[0].user_name}, ${typingUsers[1].user_name} e outros estão digitando...`;
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground animate-in fade-in-50 duration-200">
      <div className="flex items-center gap-1 bg-secondary/80 px-2 py-1 rounded-full border border-border/50">
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
      </div>
      <span className="text-[11px] font-medium italic">{text}</span>
    </div>
  );
}
