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

function ThemSubCategoryButton({ path }: { path: [string, string] }) {
    const [selections, setSelections] = useAtom(selectionsAtom);

    const [theme, category] = path;

    const isSelected = selections[theme]![category]!;

    function toggleCategory() {
        setSelections(prev => {
            const newSelections = { ...prev };
            newSelections[theme][category] = !isSelected;
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
    const [selections, setSelections] = useAtom(selectionsAtom);

    const isSelected = Object.values(selections[theme.name]).some(value => value);

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
