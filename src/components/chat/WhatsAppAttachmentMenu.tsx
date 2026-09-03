import React from "react";
import {
  Image as ImageIcon,
  FileText,
  Vote,
  Calendar,
  Music,
  User,
  Plus,
  Paperclip,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WhatsAppAttachmentMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPhotoVideo: () => void;
  onSelectDocument: () => void;
  onSelectAudio: () => void;
  onSelectPoll?: () => void;
  onSelectEvent?: () => void;
  onSelectContact?: () => void;
  disabled?: boolean;
}

export function WhatsAppAttachmentMenu({
  open,
  onOpenChange,
  onSelectPhotoVideo,
  onSelectDocument,
  onSelectAudio,
  onSelectPoll,
  onSelectEvent,
  onSelectContact,
  disabled = false,
}: WhatsAppAttachmentMenuProps) {
  const items = [
    {
      id: "photos",
      label: "Fotos e vídeos",
      icon: ImageIcon,
      gradient: "from-[#ac44cf] to-[#7f2bb3]",
      onClick: () => {
        onOpenChange(false);
        onSelectPhotoVideo();
      },
    },
    {
      id: "document",
      label: "Documento",
      icon: FileText,
      gradient: "from-[#7f66ff] to-[#5942d9]",
      onClick: () => {
        onOpenChange(false);
        onSelectDocument();
      },
    },
    {
      id: "audio",
      label: "Áudio",
      icon: Music,
      gradient: "from-[#f75276] to-[#d82a52]",
      onClick: () => {
        onOpenChange(false);
        onSelectAudio();
      },
    },
    ...(onSelectPoll
      ? [
          {
            id: "poll",
            label: "Enquete",
            icon: Vote,
            gradient: "from-[#ffbc38] to-[#e69b19]",
            onClick: () => {
              onOpenChange(false);
              onSelectPoll();
            },
          },
        ]
      : []),
    ...(onSelectEvent
      ? [
          {
            id: "event",
            label: "Evento",
            icon: Calendar,
            gradient: "from-[#00a884] to-[#008f6f]",
            onClick: () => {
              onOpenChange(false);
              onSelectEvent();
            },
          },
        ]
      : []),
    ...(onSelectContact
      ? [
          {
            id: "contact",
            label: "Contato",
            icon: User,
            gradient: "from-[#027eb5] to-[#015f8a]",
            onClick: () => {
              onOpenChange(false);
              onSelectContact();
            },
          },
        ]
      : []),
  ];

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          className={cn(
            "h-10 w-10 text-[#8696a0] hover:text-[#e9edef] hover:bg-white/10 rounded-full shrink-0 cursor-pointer transition-transform duration-200",
            open && "rotate-45 text-[#00a884]"
          )}
          title="Anexar"
        >
          <Plus className="h-5 w-5 stroke-[2.5]" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        side="top"
        align="start"
        sideOffset={12}
        className="w-auto p-3 bg-[#233138] border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-150"
      >
        <div className="grid grid-cols-3 gap-3 p-1">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/5 transition-all group cursor-pointer"
              >
                <div
                  className={cn(
                    "h-12 w-12 rounded-full bg-gradient-to-tr flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform",
                    item.gradient
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-[11px] font-medium text-[#d1d7db] group-hover:text-white transition-colors text-center leading-tight">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
