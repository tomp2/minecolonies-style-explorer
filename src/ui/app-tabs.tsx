import ErrorBoundary from "@/components/error-boundary";
import { HomeArticle } from "@/ui/home-article.tsx";
import { FavoritesSection, PageContent } from "@/ui/page-content.tsx";
import { Loader } from "lucide-react";
import React, { Suspense, useRef } from "react";
import { useAtomValue } from "jotai";
import { favoritePaths, hasInitialUrlRelevantParams, pageContentAtom } from "@/lib/state-atoms.ts";
import { SidebarTrigger } from "@/components/ui/sidebar.tsx";
import { FeedbackDialog } from "@/ui/feedback.tsx";
import { InstantModeToggleButton } from "@/components/mode-toggle.tsx";
import { Footer } from "@/ui/footer.tsx";

function Loading() {
    return (
        <div className="flex h-screen w-full items-center justify-center space-x-2">
            <Loader className="size-5 animate-spin" />
            <span>Loading...</span>
        </div>
    );
}

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

export function TabSelector({ tabsRef }: { tabsRef: React.RefObject<HTMLDivElement> }) {
    return (
        <div className="inline-flex h-[2.375rem] items-center justify-center rounded-lg border bg-muted p-1 text-muted-foreground">
            <div
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-data-[tab=home]:bg-background group-data-[tab=home]:text-foreground group-data-[tab=home]:shadow"
                onClick={() => {
                    if (tabsRef.current) {
                        tabsRef.current.dataset.tab = "home";
                    }
                }}
            >
                Home
            </div>
            <div
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-data-[tab=buildings]:bg-background group-data-[tab=buildings]:text-foreground group-data-[tab=buildings]:shadow"
                onClick={() => {
                    if (tabsRef.current) {
                        tabsRef.current.dataset.tab = "buildings";
                    }
                }}
            >
                Buildings
                <span className="ml-1 min-w-[32px]">
                    <span>(</span>
                    <TotalCount />
                    <span>)</span>
                </span>
            </div>
            <div
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-data-[tab=favorites]:bg-background group-data-[tab=favorites]:text-foreground group-data-[tab=favorites]:shadow"
                onClick={() => {
                    if (tabsRef.current) {
                        tabsRef.current.dataset.tab = "favorites";
                    }
                }}
            >
                Favorites
                <span className="ml-1">
                    <span>(</span>
                    <FavoriteCount />
                    <span>)</span>
                </span>
            </div>
        </div>
    );
}

export function getTab() {
    const tabsContainer = document.getElementById("tabs-container");
    if (!tabsContainer) return "home";
    const tab = tabsContainer.dataset.tab;
    if (tab === "buildings") return "buildings";
    if (tab === "favorites") return "favorites";
    return "home";
}

export function setTab(tab: "home" | "buildings" | "favorites") {
    const tabsContainer = document.getElementById("tabs-container");
    if (!tabsContainer) return;
    if (tab === "buildings") {
        tabsContainer.dataset.tab = "buildings";
    } else if (tab === "favorites") {
        tabsContainer.dataset.tab = "favorites";
    } else {
        tabsContainer.dataset.tab = "home";
    }
}

export function AppTabs() {
    const tabsRef = useRef<HTMLDivElement>(null);
    return (
        <div
            ref={tabsRef}
            id="tabs-container"
            className="group flex grow flex-col"
            data-tab={hasInitialUrlRelevantParams ? "buildings" : "home"}
        >
            <nav className="sticky top-0 z-10 flex h-[--h-navbar] w-full items-center gap-4 overflow-x-clip border-b bg-card px-4">
                <SidebarTrigger />
                <TabSelector tabsRef={tabsRef} />
                <FeedbackDialog className="invisible ml-auto sm:visible" />
                <InstantModeToggleButton className="invisible sm:visible" />
            </nav>
            <div
                id="tab-home"
                className="pointer-events-none invisible h-0 grow group-data-[tab=home]:pointer-events-auto group-data-[tab=home]:visible group-data-[tab=home]:h-fit"
            >
                <ErrorBoundary>
                    <HomeArticle />
                </ErrorBoundary>
            </div>

            <div
                id="tab-buildings"
                className="pointer-events-none invisible h-0 grow group-data-[tab=buildings]:pointer-events-auto group-data-[tab=buildings]:visible group-data-[tab=buildings]:h-fit"
            >
                <ErrorBoundary>
                    <Suspense fallback={<Loading />}>
                        <PageContent />
                    </Suspense>
                </ErrorBoundary>
            </div>

            <div
                id="tab-favorites"
                className="pointer-events-none invisible h-0 grow group-data-[tab=favorites]:pointer-events-auto group-data-[tab=favorites]:visible group-data-[tab=favorites]:h-fit"
            >
                <ErrorBoundary>
                    <FavoritesSection />
                </ErrorBoundary>
            </div>
            <Footer className="group-data-[tab=buildings]:hidden" />
        </div>
    );
}
