import { SidebarTrigger } from "@/components/ui/sidebar.tsx";
import { pageContentAtom, selectedThemesAtom } from "@/lib/state-atoms.ts";
import { themes } from "@/lib/theme-data.ts";
import { FeedbackDialog } from "@/ui/feedback-dialog.tsx";
import { useAtomValue } from "jotai";

export function PageHeader() {
    const selectedThemes = useAtomValue(selectedThemesAtom);
    const { totalBuildingsFound } = useAtomValue(pageContentAtom);

    return (
        <header className="flex items-center border-b px-4">
            <SidebarTrigger />
            <div className="ml-4 flex min-h-12 flex-wrap items-center gap-x-4">
                {selectedThemes.size === 0 ? (
                    <h1 className="text-lg font-semibold">Select a style</h1>
                ) : (
                    <>
                        <h1 className="hidden text-lg font-semibold md:block">
                            {[...selectedThemes].map(theme => themes.get(theme)!.displayName).join(", ")}
                        </h1>
                        <h1 className="text-lg font-semibold md:hidden">
                            {selectedThemes.size}
                            {selectedThemes.size === 1 ? " style" : " styles"}
                            {"  "}
                            selected
                        </h1>
                    </>
                )}
                {selectedThemes.size > 0 && (
                    <h1 className="text-lg font-semibold text-muted-foreground">
                        ({totalBuildingsFound} buildings)
                    </h1>
                )}
            </div>
            <FeedbackDialog />
        </header>
    );
}
