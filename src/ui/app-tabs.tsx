import ErrorBoundary from "@/components/error-boundary";
import { Tabs, TabsContent } from "@/components/ui/tabs.tsx";
import { tabAtom } from "@/lib/state-atoms.ts";
import { Footer } from "@/ui/footer.tsx";
import { Header } from "@/ui/header.tsx";
import { HomeArticle } from "@/ui/home-article.tsx";
import { FavoritesSection, PageContent } from "@/ui/page-content.tsx";
import { useAtom } from "jotai";
import { Loader } from "lucide-react";
import { Suspense } from "react";

function Loading() {
    return (
        <div className="flex h-screen w-full items-center justify-center space-x-2">
            <Loader className="size-5 animate-spin" />
            <span>Loading...</span>
        </div>
    );
}

export function AppTabs() {
    const [value, setValue] = useAtom(tabAtom);

    return (
        <Tabs value={value} onValueChange={setValue} className="flex grow flex-col">
            <Header />

            <TabsContent value="home" className="grow">
                <ErrorBoundary>
                    <HomeArticle />
                </ErrorBoundary>
            </TabsContent>
            <TabsContent value="buildings" className="mt-0 grow">
                <ErrorBoundary>
                    <Suspense fallback={<Loading />}>
                        <PageContent />
                    </Suspense>
                </ErrorBoundary>
            </TabsContent>
            <TabsContent value="favorites" className="grow">
                <ErrorBoundary>
                    <FavoritesSection />
                </ErrorBoundary>
            </TabsContent>
            {value === "home" && <Footer />}
        </Tabs>
    );
}
