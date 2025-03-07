import { InstantModeToggleButton } from "@/components/mode-toggle.tsx";
import { SidebarTrigger } from "@/components/ui/sidebar.tsx";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { favoritePaths, pageContentAtom } from "@/lib/state-atoms.ts";
import { FeedbackDialog } from "@/ui/feedback.tsx";
import { useAtomValue } from "jotai";
import { Loader } from "lucide-react";
import { Suspense } from "react";

function TotalCountLoader() {
    return <Loader className="inline size-4 animate-spin" />;
}

function TotalCountValue() {
    const [data] = useAtomValue(pageContentAtom);
    return data?.totalBuildingsFound ?? "?";
}

function TotalCount() {
    return <Suspense fallback={<TotalCountLoader />}>{<TotalCountValue />}</Suspense>;
}

function FavoriteCount() {
    return useAtomValue(favoritePaths).length;
}

export function Header() {
    return (
        <nav className="sticky top-0 z-10 flex h-[--h-navbar] w-full items-center gap-4 overflow-x-clip border-b bg-card px-4">
            <SidebarTrigger />
            <TabsList className="border">
                <TabsTrigger value="home">Home</TabsTrigger>
                <TabsTrigger value="buildings">
                    Buildings
                    <span className="ml-1 min-w-[32px]">
                        (<TotalCount />)
                    </span>
                </TabsTrigger>
                <TabsTrigger value="favorites">
                    Favorites
                    <span className="ml-1">
                        (<FavoriteCount />)
                    </span>
                </TabsTrigger>
            </TabsList>
            <FeedbackDialog className="invisible ml-auto sm:visible" />
            <InstantModeToggleButton className="invisible sm:visible" />
        </nav>
    );
}
