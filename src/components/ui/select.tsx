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
    if (props && String(props["value"]) === String(targetValue)) {
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
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);

  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;

  const handleValueChange = React.useCallback(
    (nextValue: string) => {
      if (!isControlled) {
        setUncontrolledValue(nextValue);
      }
      onValueChange?.(nextValue);
      setOpen(false);
    },
    [isControlled, onValueChange],
  );

  return (
    <SelectContext.Provider
      value={{
        value: value !== undefined ? String(value) : "",
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

export const SelectGroup: React.FC<{ children?: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <div className={cn("py-1", className)}>{children}</div>;

export const SelectValue: React.FC<{ placeholder?: string; children?: React.ReactNode }> = ({
  placeholder,
  children,
}) => {
  const { value, selectChildren } = useSelectContext();
  if (children) return <>{children}</>;

  const label = value !== undefined && value !== "" ? findSelectItemLabel(selectChildren, value) : null;

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

type SelectContentCoords = {
  top: number;
  left: number;
  minWidth: number;
  maxWidth: number;
  maxHeight: number;
  transform: string;
};

export const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, style, ...props }, ref) => {
  const { open, setOpen, triggerRef } = useSelectContext();
  const dropdownRef = React.useRef<HTMLDivElement | null>(null);

  const calculateCoords = React.useCallback((): SelectContentCoords | null => {
    if (!triggerRef.current) return null;
    const rect = triggerRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return null;
    }

    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;

    const spaceBelow = Math.max(0, viewportHeight - rect.bottom - 8);
    const spaceAbove = Math.max(0, rect.top - 8);
    const maxContentHeight = 280;

    // Abre para cima apenas se espaço abaixo for muito apertado (< 160px) e acima tiver mais espaço (> 140px)
    const openUp = spaceBelow < 160 && spaceAbove > spaceBelow && spaceAbove >= 140;

    const minWidth = Math.max(rect.width, 160);
    let left = rect.left;
    if (left + minWidth > viewportWidth - 8) {
      left = Math.max(8, viewportWidth - minWidth - 8);
    }
    if (left < 8) left = 8;

    const maxHeight = Math.max(
      100,
      Math.min(maxContentHeight, openUp ? spaceAbove - 10 : spaceBelow - 10)
    );

    return {
      top: openUp ? Math.round(rect.top - 4) : Math.round(rect.bottom + 4),
      left: Math.round(left),
      minWidth: Math.round(minWidth),
      maxWidth: Math.round(Math.min(viewportWidth - 16, Math.max(rect.width, 380))),
      maxHeight: Math.round(maxHeight),
      transform: openUp ? "translateY(-100%)" : "none",
    };
  }, [triggerRef]);

  const [coords, setCoords] = React.useState<SelectContentCoords | null>(null);

  // Atualização síncrona e em tempo real
  React.useLayoutEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }

    const update = () => {
      const next = calculateCoords();
      if (next) {
        setCoords(next);
      }
    };

    update();
    const rafId = requestAnimationFrame(update);

    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, calculateCoords]);

  // Fechamento seguro ao clicar fora ou pressionar ESC
  React.useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
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

    document.addEventListener("mousedown", handlePointerDown, true);
    document.addEventListener("touchstart", handlePointerDown, true);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown, true);
      document.removeEventListener("touchstart", handlePointerDown, true);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, setOpen, triggerRef]);

  if (!open) return null;

  const currentCoords = coords || calculateCoords();
  if (!currentCoords) return null;

  const contentElement = (
    <div
      ref={(node) => {
        dropdownRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      role="listbox"
      data-radix-select-content=""
      style={{
        position: "fixed",
        top: `${currentCoords.top}px`,
        left: `${currentCoords.left}px`,
        minWidth: `${currentCoords.minWidth}px`,
        maxWidth: `${currentCoords.maxWidth}px`,
        maxHeight: `${currentCoords.maxHeight}px`,
        transform: currentCoords.transform,
        zIndex: 999999,
        backgroundColor: "#13141f",
        ...style,
      }}
      className={cn(
        "popover-content overflow-y-auto rounded-xl border border-white/15 bg-[#13141f] p-1.5 text-foreground shadow-2xl backdrop-blur-2xl focus:outline-none ring-1 ring-white/10 custom-scrollbar-thin animate-in fade-in-0 zoom-in-95 duration-100",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );

  if (typeof document !== "undefined") {
    return createPortal(contentElement, document.body);
  }

  return contentElement;
});
SelectContent.displayName = "SelectContent";

export const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string; disabled?: boolean }
>(({ className, children, value: itemValue, disabled, onClick, ...props }, ref) => {
  const { value, onValueChange, setOpen } = useSelectContext();
  const isSelected = String(value) === String(itemValue);

  return (
    <div
      ref={ref}
      role="option"
      aria-selected={isSelected}
      aria-disabled={disabled}
      onClick={(e) => {
        if (disabled) return;
        e.stopPropagation();
        e.preventDefault();
        onClick?.(e);
        onValueChange(itemValue);
        setOpen(false);
      }}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-md py-1.5 pl-2.5 pr-8 text-sm outline-none transition-colors",
        "hover:bg-primary/20 hover:text-primary text-foreground font-medium",
        isSelected && "bg-primary/15 font-semibold text-primary",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none",
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
