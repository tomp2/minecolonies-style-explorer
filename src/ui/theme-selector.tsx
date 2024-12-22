import { CheckboxButton } from "@/components/checkbox-button.tsx";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
    SidebarGroupLabel,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar.tsx";
import { useDelayedCaptureEvent } from "@/hooks/delayed-capture-event.ts";
import { selectedThemesAtom, selectionsAtom } from "@/lib/state-atoms.ts";
import { Theme } from "@/lib/theme-data.ts";
import { useAtomValue } from "jotai";
import { useAtom } from "jotai/index";
import { ChevronDown } from "lucide-react";

function ThemSubCategoryButton({ path }: { path: [string, string] }) {
    const delayedCapture = useDelayedCaptureEvent();
    const [selections, setSelections] = useAtom(selectionsAtom);

    const [theme, category] = path;
    const isSelected = selections[theme]![category]!;

    // Send an event when the category is selected to determine which themes/categories are most popular.
    function toggleCategory() {
        setSelections(prev => {
            const newSelections = { ...prev };
            newSelections[theme][category] = !isSelected;

            const selectedThemesWithCategories = Object.entries(newSelections)
                .filter(([, categories]) => Object.values(categories).some(value => value))
                .map(([theme, categories]) => ({
                    theme,
                    categories: Object.entries(categories)
                        .filter(([, selected]) => selected)
                        .map(([category]) => category),
                }));
            delayedCapture(10_000, "select_categories", { categories: selectedThemesWithCategories });

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
    const delayedCapture = useDelayedCaptureEvent();
    const [selections, setSelections] = useAtom(selectionsAtom);
    const isSelected = Object.values(selections[theme.name]).some(value => value);

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

            const selectedThemes = Object.entries(newSelections)
                .filter(([, categories]) => Object.values(categories).some(value => value))
                .map(([theme]) => theme);
            delayedCapture(10_000, "select_themes", { themes: selectedThemes });

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
                <div className="mb-0.5 flex flex-wrap gap-x-1.5 leading-none">
                    <p>{theme.displayName}</p>
                    <p className="text-muted-foreground">({theme.authors.join(", ")})</p>
                </div>
            </CheckboxButton>
        </SidebarMenuButton>
    );
}

export function ThemeSelector({ theme }: { theme: Theme }) {
    const selectedThemes = useAtomValue(selectedThemesAtom);
    const isSelected = selectedThemes.has(theme.name);
    return (
        <Collapsible defaultOpen={isSelected} className="group/collapsible">
            <SidebarMenuItem className="p-0">
                <div className="flex items-center">
                    <SidebarGroupLabel asChild>
                        <ThemeButton theme={theme} />
                    </SidebarGroupLabel>
                    <CollapsibleTrigger className="ml-auto flex size-8 shrink-0 items-center justify-center">
                        <ChevronDown className="transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </CollapsibleTrigger>
                </div>
                <CollapsibleContent>
                    <SidebarMenuSub>
                        {[...theme.categories.values()].map(category => (
                            <SidebarMenuSubItem key={category.name}>
                                <ThemSubCategoryButton
                                    key={category.name}
                                    path={[theme.name, category.name]}
                                />
                            </SidebarMenuSubItem>
                        ))}
                    </SidebarMenuSub>
                </CollapsibleContent>
            </SidebarMenuItem>
        </Collapsible>
    );
}
