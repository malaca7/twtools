import { Check, CheckCheck, Clock, AlertCircle } from "lucide-react";
import type { MessageStatus } from "@/types/chat";
import { cn } from "@/lib/utils";

interface MessageStatusIconProps {
  status?: MessageStatus;
  className?: string;
}

export function MessageStatusIcon({ status = "sent", className }: MessageStatusIconProps) {
  if (status === "sending") {
    return <Clock className={cn("h-3 w-3 text-[#8696a0] animate-spin", className)} />;
  }

  if (status === "failed") {
    return <AlertCircle className={cn("h-3 w-3 text-rose-500 animate-pulse", className)} />;
  }

  if (status === "read") {
    return (
      <CheckCheck
        className={cn(
          "h-3.5 w-3.5 text-[#53bdeb] stroke-[2.5]",
          className
        )}
      />
    );
  }

  if (status === "delivered") {
    return <CheckCheck className={cn("h-3.5 w-3.5 text-[#8696a0] stroke-[2.2]", className)} />;
  }

  // "sent"
  return <Check className={cn("h-3 w-3 text-[#8696a0] stroke-[2.5]", className)} />;
}

