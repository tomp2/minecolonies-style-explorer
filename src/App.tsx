import { ThemeProvider } from "@/components/theme-provider.tsx";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar.tsx";
import { ExpandImageDialog } from "@/ui/expanded-image-dialog.tsx";
import { Footer } from "@/ui/footer.tsx";
import { FullSidebar } from "@/ui/full-sidebar.tsx";
import { HiddenDialog, useInitialPersistentIdentity } from "@/ui/hidden-dialog.tsx";
import { PageContent } from "@/ui/page-content.tsx";
import { PageHeader } from "@/ui/page-header.tsx";
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

function App() {
    useInitialPersistentIdentity();
    return (
        <>
            <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
                <HiddenDialog />
                <ExpandImageDialog />
                <SidebarProvider>
                    <div className="flex h-screen w-full">
                        <FullSidebar />
                        <SidebarInset className="flex min-h-screen w-full flex-col">
                            <PageHeader />
                            <div className="flex grow flex-col overflow-x-auto bg-gray-100 dark:bg-black">
                                <div className="flex flex-col">
                                    <Suspense fallback={<Loading />}>
                                        <PageContent />
                                    </Suspense>
                                </div>
                                <div className="grow" />
                                <Footer />
                            </div>
                        </SidebarInset>
                    </div>
                </SidebarProvider>
            </ThemeProvider>
        </>
    );
}

export default App;
