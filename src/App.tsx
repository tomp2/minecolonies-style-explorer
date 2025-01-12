import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar.tsx";
import { ExpandImageDialog } from "@/ui/expanded-image-dialog.tsx";
import { Footer } from "@/ui/footer.tsx";
import { FullSidebar } from "@/ui/full-sidebar.tsx";
import { HiddenDialog, useInitialPersistentIdentity } from "@/ui/hidden-dialog.tsx";
import { PageContent } from "@/ui/page-content.tsx";
import { PageHeader } from "@/ui/page-header.tsx";

function App() {
    useInitialPersistentIdentity();
    return (
        <>
            <HiddenDialog />
            <ExpandImageDialog />
            <SidebarProvider>
                <div className="flex h-screen w-full">
                    <FullSidebar />
                    <SidebarInset className="flex min-h-screen w-full flex-col">
                        <PageHeader />
                        <div className="flex grow flex-col overflow-x-auto bg-gray-100">
                            <div className="flex flex-col">
                                <PageContent />
                            </div>
                            <div className="grow" />
                            <Footer />
                        </div>
                    </SidebarInset>
                </div>
            </SidebarProvider>
        </>
    );
}

export default App;
