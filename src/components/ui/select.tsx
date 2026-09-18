"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type SelectContextType = {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  selectChildren: React.ReactNode;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  disabled?: boolean;
};

const SelectContext = React.createContext<SelectContextType | null>(null);

function useSelectContext() {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error("Select components must be used within a <Select>");
  }
  return context;
}

interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

function findSelectItemLabel(children: React.ReactNode, targetValue: string): React.ReactNode {
  let found: React.ReactNode = null;

  React.Children.forEach(children, (child) => {
    if (found) return;
    if (!React.isValidElement(child)) return;

    const props = child.props as Record<string, any>;
    if (props && props["value"] === targetValue) {
      found = props["children"];
      return;
    }

    if (props && props["children"]) {
      const sub = findSelectItemLabel(props["children"], targetValue);
      if (sub) {
        found = sub;
      }
    }
  });

  return found;
}

export const Select: React.FC<SelectProps> = ({
  value: controlledValue,
  defaultValue = "",
  onValueChange,
  children,
  className,
  disabled = false,
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultValue);
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);

  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledOpen;

  const handleValueChange = React.useCallback(
    (nextValue: string) => {
      if (!isControlled) {
        setUncontrolledOpen(nextValue);
      }
      onValueChange?.(nextValue);
      setOpen(false);
    },
    [isControlled, onValueChange],
  );

  return (
    <SelectContext.Provider
      value={{
        value: value || "",
        onValueChange: handleValueChange,
        open,
        setOpen,
        selectChildren: children,
        triggerRef,
        disabled,
      }}
    >
      <div className={cn("relative inline-block", className ?? "w-full")}>{children}</div>
    </SelectContext.Provider>
  );
};

export const SelectGroup: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div className="py-1">{children}</div>
);

export const SelectValue: React.FC<{ placeholder?: string }> = ({ placeholder }) => {
  const { value, selectChildren } = useSelectContext();
  const label = value ? findSelectItemLabel(selectChildren, value) : null;

  if (label) {
    return <span className="truncate">{label}</span>;
  }

  return (
    <span className="text-muted-foreground truncate">{placeholder || "Selecione..."}</span>
  );
};

export const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, onClick, disabled, ...props }, ref) => {
  const { open, setOpen, triggerRef, disabled: contextDisabled } = useSelectContext();
  const isDisabled = disabled || contextDisabled;

  return (
    <button
      type="button"
      ref={(node) => {
        triggerRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
      }}
      disabled={isDisabled}
      onClick={(e) => {
        e.stopPropagation();
        if (isDisabled) return;
        onClick?.(e);
        setOpen(!open);
      }}
      className={cn(
        "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-foreground transition-colors",
        className,
      )}
      {...props}
    >
      <span className="truncate flex-1 text-left">{children}</span>
      <ChevronDown
        className={cn(
          "h-4 w-4 opacity-50 shrink-0 ml-2 transition-transform duration-200",
          open && "rotate-180 opacity-90",
        )}
      />
    </button>
  );
});
SelectTrigger.displayName = "SelectTrigger";

export const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, style, ...props }, ref) => {
  const { open, setOpen, triggerRef } = useSelectContext();
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const [coords, setCoords] = React.useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
    placement: "bottom" | "top";
  } | null>(null);

  const updateCoords = React.useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Se o elemento estiver totalmente fora da tela, fecha o select
    if (rect.bottom < 0 || rect.top > viewportHeight) {
      setOpen(false);
      return;
    }

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Se houver pouco espaço abaixo (< 200px) e mais espaço acima, abre para cima
    const openUp = spaceBelow < 200 && spaceAbove > spaceBelow;

    const width = Math.max(rect.width, 160);

    // Evita transbordamento horizontal nas bordas da viewport
    let left = rect.left;
    if (left + width > viewportWidth - 8) {
      left = Math.max(8, viewportWidth - width - 8);
    }
    if (left < 8) left = 8;

    if (openUp) {
      setCoords({
        bottom: viewportHeight - rect.top + 4,
        left,
        width: rect.width,
        placement: "top",
      });
    } else {
      setCoords({
        top: rect.bottom + 4,
        left,
        width: rect.width,
        placement: "bottom",
      });
    }
  }, [triggerRef, setOpen]);

  React.useLayoutEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }
    updateCoords();

    const handleScrollOrResize = () => {
      updateCoords();
    };

    window.addEventListener("resize", handleScrollOrResize);
    window.addEventListener("scroll", handleScrollOrResize, true);
    return () => {
      window.removeEventListener("resize", handleScrollOrResize);
      window.removeEventListener("scroll", handleScrollOrResize, true);
    };
  }, [open, updateCoords]);

  React.useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        contentRef.current &&
        !contentRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, setOpen, triggerRef]);

  if (!open || !coords) return null;

  const content = (
    <div
      ref={(node) => {
        contentRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      role="listbox"
      data-radix-select-content=""
      data-select-content=""
      style={{
        position: "fixed",
        top: coords.top !== undefined ? `${coords.top}px` : undefined,
        bottom: coords.bottom !== undefined ? `${coords.bottom}px` : undefined,
        left: `${coords.left}px`,
        width: `${Math.max(coords.width, 160)}px`,
        minWidth: `${coords.width}px`,
        maxWidth: "calc(100vw - 16px)",
        zIndex: 100000,
        backgroundColor: "var(--color-popover, var(--popover, #121216))",
        ...style,
      }}
      className={cn(
        "popover-content max-h-60 overflow-y-auto rounded-lg border border-border/80 bg-popover p-1 text-popover-foreground shadow-2xl backdrop-blur-xl focus:outline-none",
        "animate-in fade-in-0 zoom-in-95 duration-100",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );

  if (typeof document !== "undefined") {
    return createPortal(content, document.body);
  }

  return content;
});
SelectContent.displayName = "SelectContent";

export const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, children, value: itemValue, onClick, ...props }, ref) => {
  const { value, onValueChange, setOpen } = useSelectContext();
  const isSelected = value === itemValue;

  return (
    <div
      ref={ref}
      role="option"
      aria-selected={isSelected}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onClick?.(e);
        onValueChange(itemValue);
        setOpen(false);
      }}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-md py-1.5 pl-2.5 pr-8 text-sm outline-none transition-colors",
        "hover:bg-accent hover:text-accent-foreground text-foreground",
        isSelected && "bg-primary/15 font-semibold text-primary",
        className,
      )}
      {...props}
    >
      <span className="truncate">{children}</span>
      {isSelected && (
        <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
          <Check className="h-4 w-4 text-primary" />
        </span>
      )}
    </div>
  );
});
SelectItem.displayName = "SelectItem";

export const SelectLabel = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("px-2.5 py-1.5 text-xs font-semibold text-muted-foreground", className)} {...props} />
);
SelectLabel.displayName = "SelectLabel";

export const SelectSeparator = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("-mx-1 my-1 h-px bg-border/60", className)} {...props} />
);
SelectSeparator.displayName = "SelectSeparator";

export const SelectScrollUpButton = () => null;
export const SelectScrollDownButton = () => null;
