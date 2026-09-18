"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type DialogContextType = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const DialogContext = React.createContext<DialogContextType | null>(null);

function useDialogContext() {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error("Dialog components must be used within a <Dialog>");
  }
  return context;
}

interface DialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
  children?: React.ReactNode;
}

const Dialog: React.FC<DialogProps> = ({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange],
  );

  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
};

interface DialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const DialogTrigger = React.forwardRef<HTMLButtonElement, DialogTriggerProps>(
  ({ asChild, children, onClick, ...props }, ref) => {
    const { setOpen } = useDialogContext();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      onClick?.(e);
      setOpen(true);
    };

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<any>;
      return React.cloneElement(child, {
        ref,
        onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
          child.props?.onClick?.(e);
          handleClick(e);
        },
      });
    }

    return (
      <button type="button" ref={ref} onClick={handleClick} {...props}>
        {children}
      </button>
    );
  },
);
DialogTrigger.displayName = "DialogTrigger";

interface DialogPortalProps {
  children?: React.ReactNode;
}

const DialogPortal: React.FC<DialogPortalProps> = ({ children }) => {
  const { open } = useDialogContext();
  if (!open || typeof document === "undefined") return null;
  return <>{children}</>;
};
DialogPortal.displayName = "DialogPortal";

const DialogOverlay = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, onClick, ...props }, ref) => {
  const { setOpen } = useDialogContext();
  const mouseDownTargetRef = React.useRef<EventTarget | null>(null);

  return (
    <div
      ref={ref}
      onMouseDown={(e) => {
        mouseDownTargetRef.current = e.target;
      }}
      onClick={(e) => {
        if (
          mouseDownTargetRef.current === e.currentTarget &&
          e.target === e.currentTarget
        ) {
          e.stopPropagation();
          onClick?.(e);
          setOpen(false);
        }
      }}
      className={cn(
        "fixed inset-0 z-[10050] bg-black/80 backdrop-blur-md transition-opacity duration-200 cursor-pointer pointer-events-auto animate-in fade-in-0",
        className,
      )}
      {...props}
    />
  );
});
DialogOverlay.displayName = "DialogOverlay";

const DialogContentInner = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { hideClose?: boolean }
>(({ className, children, hideClose = false, ...props }, ref) => {
  const { open, setOpen } = useDialogContext();

  // Trava o scroll do body enquanto o modal estiver aberto
  React.useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  // Fechamento com tecla ESC
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setOpen]);

  return (
    <>
      <DialogOverlay />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "fixed left-[50%] top-[50%] z-[10051] grid w-[calc(100%-1.25rem)] sm:w-[calc(100%-2rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-white/15 bg-[#13141f] text-foreground shadow-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 opacity-100 scale-100 pointer-events-auto transition-all duration-150 max-h-[90dvh] overflow-y-auto overflow-x-hidden overscroll-contain ring-1 ring-white/10 scrollbar-none animate-in fade-in-0 zoom-in-95",
          className,
        )}
        {...props}
      >
        {children}
        {!hideClose && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
            className="absolute right-3 top-3 sm:right-4 sm:top-4 rounded-xl p-2 opacity-70 hover:opacity-100 hover:bg-secondary transition-all cursor-pointer text-muted-foreground hover:text-foreground z-10 active:scale-90"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Fechar</span>
          </button>
        )}
      </div>
    </>
  );
});
DialogContentInner.displayName = "DialogContentInner";

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { hideClose?: boolean }
>((props, ref) => {
  const { open } = useDialogContext();

  if (!open || typeof document === "undefined") return null;

  return createPortal(<DialogContentInner ref={ref} {...props} />, document.body);
});
DialogContent.displayName = "DialogContent";

interface DialogCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const DialogClose = React.forwardRef<HTMLButtonElement, DialogCloseProps>(
  ({ asChild, children, onClick, ...props }, ref) => {
    const { setOpen } = useDialogContext();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      onClick?.(e);
      setOpen(false);
    };

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<any>;
      return React.cloneElement(child, {
        ref,
        onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
          child.props?.onClick?.(e);
          handleClick(e);
        },
      });
    }

    return (
      <button type="button" ref={ref} onClick={handleClick} {...props}>
        {children}
      </button>
    );
  },
);
DialogClose.displayName = "DialogClose";

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className,
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className,
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight text-foreground",
      className,
    )}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
