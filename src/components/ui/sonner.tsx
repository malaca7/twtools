import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      position="top-center"
      offset={80}
      mobileOffset={76}
      richColors
      closeButton
      className="toaster group"
      style={{ zIndex: 99999 }}
      toastOptions={{
        classNames: {
          toast:
            "group toast font-sans group-[.toaster]:bg-card/95 group-[.toaster]:text-foreground group-[.toaster]:border-border/90 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-2xl group-[.toaster]:backdrop-blur-2xl group-[.toaster]:border group-[.toaster]:px-4 group-[.toaster]:py-3 group-[.toaster]:text-xs group-[.toaster]:font-semibold",
          title: "font-bold text-xs",
          description: "group-[.toast]:text-muted-foreground text-xs",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:font-bold group-[.toast]:rounded-xl",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-xl",
          closeButton: "group-[.toast]:bg-card/90 group-[.toast]:border-border/80 group-[.toast]:hover:bg-secondary group-[.toast]:text-muted-foreground group-[.toast]:hover:text-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };

