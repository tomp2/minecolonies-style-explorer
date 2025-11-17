import { Toggle, toggleVariants } from "@/components/ui/toggle.tsx";
import { cn } from "@/lib/utils.ts";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import type { VariantProps } from "class-variance-authority";
import { Check } from "lucide-react";
import * as React from "react";

export const CheckboxButton = React.forwardRef<
    React.ElementRef<typeof TogglePrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>
>(({ className, ...props }, ref) => (
    <Toggle
        className={cn(
            "group justify-start data-[state=on]:bg-transparent data-[state=on]:text-current",
            className,
        )}
        {...props}
        ref={ref}
    >
        <div className="size-4 rounded-sm border border-primary text-primary-foreground shadow-sm group-data-[state=on]:bg-primary">
            <div className="flex items-center justify-center text-current group-data-[state=off]:invisible">
                <Check className="size-4" />
            </div>
        </div>
        {props.children}
    </Toggle>
));

CheckboxButton.displayName = TogglePrimitive.Root.displayName;
