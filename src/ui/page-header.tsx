import { InstantModeToggleButton } from "@/components/mode-toggle.tsx";
import { SidebarTrigger } from "@/components/ui/sidebar.tsx";
import { useTitle } from "@/hooks/use-title.ts";
import { pageContentAtom, searchTermAtom, selectedThemesAtom } from "@/lib/state-atoms.ts";
import { styleInfo } from "@/lib/theme-data.ts";
import { FeedbackDialog } from "@/ui/feedback-dialog.tsx";
import { useAtomValue } from "jotai";
import { Suspense, useEffect } from "react";

function TotalCountLoader() {
    return <span className="ml-2 text-muted-foreground">(Counting...)</span>;
}

function TotalCount() {
    const [data, error] = useAtomValue(pageContentAtom);
    if (error) {
        return <span className="ml-2 text-muted-foreground">(? buildings)</span>;
    }
    return <span className="ml-2 text-muted-foreground">({data.totalBuildingsFound} buildings)</span>;
}

function PageTitle() {
    const { setTitle, resetTitle } = useTitle();
    const selectedThemes = useAtomValue(selectedThemesAtom);
    const searchTerm = useAtomValue(searchTermAtom);

    useEffect(() => {
        if (selectedThemes.size === 0) {
            resetTitle();
            return;
        }
        if (selectedThemes.size === 1) {
            const theme = styleInfo.get([...selectedThemes][0])!;
            const title = `All ${theme.displayName} buildings - Minecolonies style explorer`;
            setTitle(title);
            return;
        }
        const styles = [...selectedThemes].map(theme => styleInfo.get(theme)!.displayName);
        const title = `${styles.join(" and ")} - Minecolonies style explorer`;
        setTitle(title);
    }, [selectedThemes, resetTitle, setTitle]);

    if (searchTerm) {
        return <h1>Results for &#34;{searchTerm}&#34;</h1>;
    }

    if (selectedThemes.size === 0) {
        return <h1>Select a style</h1>;
    }

    if (selectedThemes.size === styleInfo.size) {
        return (
            <h1>
                All styles
                <Suspense fallback={<TotalCountLoader />}>
                    <TotalCount />
                </Suspense>
            </h1>
        );
    }

    if (selectedThemes.size <= 3) {
        const path = [...selectedThemes].map(theme => styleInfo.get(theme)!.displayName);
        return (
            <h1 className="flex flex-wrap gap-x-2 leading-none">
                <span className="hidden text-nowrap sm:block">{path.join(", ")}</span>
                <span className="sm:hidden">
                    {selectedThemes.size}
                    {selectedThemes.size === 1 ? " style" : " styles"}
                    {"  "}
                    selected
                </span>
                <Suspense fallback={<TotalCountLoader />}>
                    <TotalCount />
                </Suspense>
            </h1>
        );
    }

    return (
        <h1>
            {selectedThemes.size} styles selected
            <Suspense fallback={<TotalCountLoader />}>
                <TotalCount />
            </Suspense>
        </h1>
    );
}

export function PageHeader() {
    return (
        <header className="flex items-center gap-4 border-b px-4">
            <SidebarTrigger />
            <div className="flex min-h-12 flex-wrap items-center gap-x-4 text-lg font-semibold">
                <PageTitle />
            </div>
            <FeedbackDialog />
            <InstantModeToggleButton />
        </header>
    );
}
