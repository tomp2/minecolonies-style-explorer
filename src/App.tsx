import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar.tsx";
import { Footer } from "@/Footer.tsx";
import { FullSidebar } from "@/ui/full-sidebar.tsx";
import { HiddenDialog, useInitialPersistentIdentity } from "@/ui/hidden-dialog.tsx";
import { PageContent } from "@/ui/page-content.tsx";
import { PageHeader } from "@/ui/page-header.tsx";

function App() {
    useInitialPersistentIdentity();
    return (
        <>
            <HiddenDialog />
            <SidebarProvider>
                <div className="flex h-screen w-full">
                    <FullSidebar />
                    <SidebarInset className="w-full flex flex-col min-h-screen">
                        <PageHeader />
                        <div className="bg-gray-100 flex flex-col grow overflow-x-auto">
                            <PageContent />
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
