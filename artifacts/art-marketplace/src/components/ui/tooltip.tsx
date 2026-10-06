import * as React from 'react';
import { cn } from '@/lib/utils';

interface TooltipContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const TooltipContext = React.createContext<TooltipContextType | null>(null);

function TooltipProvider({ children }: { children: React.ReactNode; delayDuration?: number; skipDelayDuration?: number; disableHoverableContent?: boolean }) {
  return <>{children}</>;
}

interface TooltipProps {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  delayDuration?: number;
  disableHoverableContent?: boolean;
}

function Tooltip({ children, open: controlledOpen, defaultOpen = false, onOpenChange }: TooltipProps) {
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
    [isControlled, onOpenChange]
  );

  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-flex">{children}</div>
    </TooltipContext.Provider>
  );
}

interface TooltipTriggerProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean;
  children: React.ReactNode;
}

const TooltipTrigger = React.forwardRef<HTMLElement, TooltipTriggerProps>(
  ({ asChild, children, className, onMouseEnter, onMouseLeave, onFocus, onBlur, ...props }, ref) => {
    const context = React.useContext(TooltipContext);

    const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
      onMouseEnter?.(e);
      context?.setOpen(true);
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
      onMouseLeave?.(e);
      context?.setOpen(false);
    };

    const handleFocus = (e: React.FocusEvent<HTMLElement>) => {
      onFocus?.(e);
      context?.setOpen(true);
    };

    const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
      onBlur?.(e);
      context?.setOpen(false);
    };

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<any>;
      return React.cloneElement(child, {
        ref,
        onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
          child.props?.onMouseEnter?.(e);
          handleMouseEnter(e);
        },
        onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
          child.props?.onMouseLeave?.(e);
          handleMouseLeave(e);
        },
        onFocus: (e: React.FocusEvent<HTMLElement>) => {
          child.props?.onFocus?.(e);
          handleFocus(e);
        },
        onBlur: (e: React.FocusEvent<HTMLElement>) => {
          child.props?.onBlur?.(e);
          handleBlur(e);
        },
        ...props,
      });
    }

    return (
      <span
        ref={ref as React.Ref<HTMLSpanElement>}
        className={cn('inline-flex', className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      >
        {children}
      </span>
    );
  }
);
TooltipTrigger.displayName = 'TooltipTrigger';

interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  sideOffset?: number;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ className, sideOffset = 4, side = 'top', children, ...props }, ref) => {
    const context = React.useContext(TooltipContext);
    if (!context?.open) {
      return null;
    }

    const sideClasses = {
      top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
      bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
      left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
      right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
    }[side];

    return (
      <div
        ref={ref}
        role="tooltip"
        style={{ margin: sideOffset }}
        className={cn(
          'absolute z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground shadow-md animate-in fade-in-0 zoom-in-95 pointer-events-none whitespace-nowrap',
          sideClasses,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TooltipContent.displayName = 'TooltipContent';

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
