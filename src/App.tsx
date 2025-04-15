import { ThemeProvider } from "@/components/theme-provider.tsx";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar.tsx";
import { AppTabs } from "@/ui/app-tabs.tsx";
import { ExpandImageDialog } from "@/ui/expanded-image-dialog.tsx";
import { HiddenDialog, useInitialPersistentIdentity } from "@/ui/hidden-dialog.tsx";
import { FullSidebar } from "@/ui/sidebar.tsx";
import { CustomErrorBoundary } from "./components/error-boundary";

function App() {
    useInitialPersistentIdentity();
    return (
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
            <HiddenDialog />
            <ExpandImageDialog />
            <SidebarProvider>
                <div className="flex w-full">
                    <FullSidebar />
                    <SidebarInset className="w-full overflow-clip bg-gray-100 dark:bg-black">
                        <CustomErrorBoundary>
                            <AppTabs />
                        </CustomErrorBoundary>
                    </SidebarInset>
                </div>
            </SidebarProvider>
        </ThemeProvider>
    );
}

export default App;
