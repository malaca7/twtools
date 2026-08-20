"use client";

import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type SelectContextType = {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  selectChildren: React.ReactNode;
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
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultValue);
  const [open, setOpen] = React.useState(false);

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
    [isControlled, onOpenChange],
  );

  return (
    <SelectContext.Provider
      value={{
        value: value || "",
        onValueChange: handleValueChange,
        open,
        setOpen,
        selectChildren: children,
      }}
    >
      <div className="relative inline-block w-full">{children}</div>
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
>(({ className, children, onClick, ...props }, ref) => {
  const { open, setOpen } = useSelectContext();

  return (
    <button
      type="button"
      ref={ref}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
        setOpen(!open);
      }}
      className={cn(
        "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-foreground",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
    </button>
  );
});
SelectTrigger.displayName = "SelectTrigger";

export const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { open, setOpen } = useSelectContext();
  const contentRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div
      ref={(node) => {
        contentRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      className={cn(
        "absolute left-0 top-[calc(100%+4px)] z-[10000] max-h-60 w-full min-w-[8rem] overflow-y-auto rounded-md border border-border bg-card p-1 text-card-foreground shadow-xl focus:outline-none",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
});
SelectContent.displayName = "SelectContent";

export const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, children, value: itemValue, onClick, ...props }, ref) => {
  const { value, onValueChange } = useSelectContext();
  const isSelected = value === itemValue;

  return (
    <div
      ref={ref}
      role="option"
      aria-selected={isSelected}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
        onValueChange(itemValue);
      }}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-accent hover:text-accent-foreground text-foreground transition-colors",
        isSelected && "bg-accent/50 font-medium text-accent-foreground",
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
  <div className={cn("px-2 py-1.5 text-xs font-semibold text-muted-foreground", className)} {...props} />
);
SelectLabel.displayName = "SelectLabel";

export const SelectSeparator = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />
);
SelectSeparator.displayName = "SelectSeparator";

export const SelectScrollUpButton = () => null;
export const SelectScrollDownButton = () => null;
