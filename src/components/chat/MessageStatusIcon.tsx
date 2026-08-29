import { Check, CheckCheck, Clock } from "lucide-react";
import type { MessageStatus } from "@/types/chat";
import { cn } from "@/lib/utils";

interface MessageStatusIconProps {
  status?: MessageStatus;
  className?: string;
}

export function MessageStatusIcon({ status = "sent", className }: MessageStatusIconProps) {
  if (status === "sending") {
    return <Clock className={cn("h-3 w-3 text-muted-foreground animate-spin", className)} />;
  }

  if (status === "read") {
    return (
      <CheckCheck className={cn("h-3.5 w-3.5 text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]", className)} />
    );
  }

  if (status === "delivered") {
    return <CheckCheck className={cn("h-3.5 w-3.5 text-muted-foreground/80", className)} />;
  }

  // "sent"
  return <Check className={cn("h-3 w-3 text-muted-foreground/80", className)} />;
}
