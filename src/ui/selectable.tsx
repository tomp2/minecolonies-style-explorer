import { CheckboxButton } from "@/components/checkbox-button.tsx";
import { SidebarGroupLabel, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar.tsx";
import { toggleVariants } from "@/components/ui/toggle.tsx";
import { useDelayedCaptureEvent } from "@/hooks/delayed-capture-event.ts";
import { selectedCategoriesAtom, selectedThemesAtom } from "@/lib/state-atoms.ts";
import { Theme } from "@/lib/theme-data.ts";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import type { VariantProps } from "class-variance-authority";
import { useAtom } from "jotai/index";
import * as React from "react";

export type SelectableProps = React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> &
    VariantProps<typeof toggleVariants> & {};

function Selectable({ children, ...props }: SelectableProps) {
    return (
        <SidebarMenuItem className="p-0">
            <SidebarGroupLabel asChild>
                <SidebarMenuButton asChild>
                    <CheckboxButton {...props}>{children}</CheckboxButton>
                </SidebarMenuButton>
            </SidebarGroupLabel>
        </SidebarMenuItem>
    );
}

export function ThemeSelectable({ theme }: { theme: Theme }) {
    const { capture, cancel } = useDelayedCaptureEvent();
    const [selectedThemes, setSelectedThemes] = useAtom(selectedThemesAtom);
    const isSelected = selectedThemes.has(theme.name);

    function toggleTheme(theme: Theme) {
        setSelectedThemes(prev => {
            const newSelections = new Set(prev);
            if (newSelections.has(theme.name)) {
                newSelections.delete(theme.name);
                cancel();
            } else {
                capture(10_000, "view_style", { style: theme.name });
                newSelections.add(theme.name);
            }
            return newSelections;
        });
    }

    return (
        <Selectable
            aria-label={theme.displayName}
            pressed={isSelected}
            onPressedChange={() => toggleTheme(theme)}
            className="text-sm text-current"
        >
            <div className="mb-0.5 flex flex-wrap gap-x-1.5 leading-none">
                {theme.displayName}
                <p className="text-muted-foreground">({theme.authors.join(", ")})</p>
            </div>
        </Selectable>
    );
}

export function CategorySelectable({ category }: { category: string }) {
    const { capture, cancel } = useDelayedCaptureEvent();
    const [selectedCategories, setSelectedCategories] = useAtom(selectedCategoriesAtom);
    const isSelected = selectedCategories.has(category);

    function toggleCategory(category: string) {
        setSelectedCategories(prev => {
            const newSelections = new Set(prev);
            if (newSelections.has(category)) {
                newSelections.delete(category);
                cancel();
            } else {
                capture(10_000, "view_category", { category });
                newSelections.add(category);
            }
            return newSelections;
        });
    }

    return (
        <Selectable
            aria-label={category}
            pressed={isSelected}
            onPressedChange={() => toggleCategory(category)}
            className="overflow-visible text-sm capitalize"
        >
            {category}
        </Selectable>
    );
}
