import * as React from "react"
import { cn } from "@/shared/lib/utils"

interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, checked = false, onCheckedChange, disabled = false, id, ...props }, ref) => {
    const handleClick = () => {
      if (!disabled && onCheckedChange) {
        onCheckedChange(!checked);
      }
    };

    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        data-state={checked ? "checked" : "unchecked"}
        disabled={disabled}
        id={id}
        onClick={handleClick}
        className={cn(
          "peer relative inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      >
        <span
          data-state={checked ? "checked" : "unchecked"}
          className={cn(
            "pointer-events-none flex h-6 w-10 items-center rounded-full border-2 border-transparent px-0.5 transition-colors",
            checked ? "bg-primary" : "bg-input"
          )}
        >
          <span
            className={cn(
              "block size-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
              checked ? "translate-x-4 rtl:-translate-x-4" : "translate-x-0"
            )}
          />
        </span>
      </button>
    );
  }
);

Switch.displayName = "Switch";

export { Switch }
