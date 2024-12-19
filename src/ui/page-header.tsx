import { SidebarTrigger } from "@/components/ui/sidebar.tsx";
import { pageContentAtom, selectedThemesAtom } from "@/lib/state-atoms.ts";
import { themes } from "@/lib/theme-data.ts";
import { useAtomValue } from "jotai";

export function PageHeader() {
    const selectedThemes = useAtomValue(selectedThemesAtom);
    const { totalBuildingsFound } = useAtomValue(pageContentAtom);

    return (
        <header className="flex min-h-9 items-center border-b px-4">
            <SidebarTrigger />
            <div className="ml-4 flex items-center space-x-4">
                <h1 className="text-lg font-semibold">
                    {selectedThemes.size === 0 && "Select a theme"}
                    {selectedThemes.size > 0 &&
                        `${[...selectedThemes].map(theme => themes.get(theme)!.displayName).join(", ")}`}
                    {selectedThemes.size > 0 && (
                        <span className="text-muted-foreground"> ({totalBuildingsFound} buildings)</span>
                    )}
                </h1>
            </div>
        </header>
    );
}
