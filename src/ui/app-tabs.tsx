import { CustomErrorBoundary } from "@/components/error-boundary.tsx";
import { Tabs, TabsContent } from "@/components/ui/tabs.tsx";
import { tabAtom } from "@/lib/state-atoms.ts";
import { Footer } from "@/ui/footer.tsx";
import { Header } from "@/ui/header.tsx";
import { HomeArticle } from "@/ui/home-article.tsx";
import { FavoritesSection, PageContent } from "@/ui/page-content.tsx";
import { useAtom } from "jotai/index";
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
            <CustomErrorBoundary>
                <TabsContent value="home" className="grow">
                    <HomeArticle />
                </TabsContent>
                <TabsContent value="buildings" className="mt-0 grow">
                    <Suspense fallback={<Loading />}>
                        <PageContent />
                    </Suspense>
                </TabsContent>
                <TabsContent value="favorites" className="grow">
                    <FavoritesSection />
                </TabsContent>
                {value === "home" && <Footer />}
            </CustomErrorBoundary>
        </Tabs>
    );
}
