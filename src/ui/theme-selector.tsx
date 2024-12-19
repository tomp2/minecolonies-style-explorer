import { CheckboxButton } from "@/components/checkbox-button.tsx";
import {
    SidebarGroupLabel,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar.tsx";
import { selectionsAtom } from "@/lib/state-atoms.ts";
import { Theme } from "@/lib/theme-data.ts";
import { useAtom } from "jotai/index";
import { usePostHog } from "posthog-js/react";
import { useRef } from "react";

function ThemSubCategoryButton({ path }: { path: [string, string] }) {
    const posthog = usePostHog();
    const [selections, setSelections] = useAtom(selectionsAtom);
    const sendEventTimeoutId = useRef<NodeJS.Timeout | null>(null);

    const [theme, category] = path;
    const isSelected = selections[theme]![category]!;

    // Send an event when the category is selected to determine which themes/categories are most popular.
    function toggleCategory() {
        setSelections(prev => {
            const newSelections = { ...prev };
            newSelections[theme][category] = !isSelected;

            if (sendEventTimeoutId.current) {
                clearTimeout(sendEventTimeoutId.current);
            }
            sendEventTimeoutId.current = setTimeout(() => {
                const selectedThemesWithCategories = Object.entries(newSelections)
                    .filter(([, categories]) => Object.values(categories).some(value => value))
                    .map(([theme, categories]) => ({
                        theme,
                        categories: Object.entries(categories)
                            .filter(([, selected]) => selected)
                            .map(([category]) => category),
                    }));
                posthog.capture("select_categories", { categories: selectedThemesWithCategories });
            }, 10000);

            return newSelections;
        });
    }

    return (
        <SidebarMenuButton asChild>
            <CheckboxButton
                className="capitalize"
                aria-label={category}
                pressed={isSelected}
                onPressedChange={toggleCategory}
            >
                {category}
            </CheckboxButton>
        </SidebarMenuButton>
    );
}

function ThemeButton({ theme }: { theme: Theme }) {
    const posthog = usePostHog();
    const [selections, setSelections] = useAtom(selectionsAtom);
    const isSelected = Object.values(selections[theme.name]).some(value => value);
    const sendEventTimeoutId = useRef<NodeJS.Timeout | null>(null);

    // Send an event when the theme is selected to determine which themes/categories are most popular.
    function toggleTheme(theme: Theme) {
        setSelections(prev => {
            const newSelections = { ...prev };

            const allAreSelected = Object.values(newSelections[theme.name]).every(value => value);
            if (allAreSelected) {
                for (const category of Object.keys(newSelections[theme.name])) {
                    newSelections[theme.name][category] = false;
                }
                return newSelections;
            }

            for (const category of Object.keys(newSelections[theme.name])) {
                newSelections[theme.name][category] = true;
            }

            if (sendEventTimeoutId.current) clearTimeout(sendEventTimeoutId.current);
            sendEventTimeoutId.current = setTimeout(() => {
                const selectedThemes = Object.entries(newSelections)
                    .filter(([, categories]) => Object.values(categories).some(value => value))
                    .map(([theme]) => theme);
                posthog.capture("select_themes", { themes: selectedThemes });
            }, 10000);

            return newSelections;
        });
    }

    return (
        <SidebarMenuButton asChild>
            <CheckboxButton
                aria-label={theme.displayName}
                pressed={isSelected}
                onPressedChange={() => toggleTheme(theme)}
            >
                {theme.displayName}
                <span className="text-muted-foreground text-sm">({theme.authors.join(", ")})</span>
            </CheckboxButton>
        </SidebarMenuButton>
    );
}

export function ThemeSelector({ theme }: { theme: Theme }) {
    return (
        <SidebarMenuItem className="p-0">
            <SidebarGroupLabel asChild>
                <ThemeButton theme={theme} />
            </SidebarGroupLabel>
            <SidebarMenuSub>
                {[...theme.categories.values()].map(category => (
                    <SidebarMenuSubItem key={category.name}>
                        <ThemSubCategoryButton key={category.name} path={[theme.name, category.name]} />
                    </SidebarMenuSubItem>
                ))}
            </SidebarMenuSub>
        </SidebarMenuItem>
    );
}
