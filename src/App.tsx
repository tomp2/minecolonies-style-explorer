import "./App.css";
import { Button } from "@/components/ui/button.tsx";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
} from "@/components/ui/sidebar.tsx";
import { Footer } from "@/Footer.tsx";
import { themes } from "@/lib/theme-data.ts";
import { ImageSizeSlider } from "@/ui/image-size-slider.tsx";
import { PageContent } from "@/ui/page-content.tsx";
import { PageHeader } from "@/ui/page-header.tsx";
import { SearchBar } from "@/ui/search-bar.tsx";
import { ThemeSelector } from "@/ui/theme-selector.tsx";
import { House } from "lucide-react";

function App() {
    return (
        <SidebarProvider>
            <div className="flex h-screen w-full">
                <Sidebar>
                    <SidebarHeader>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-start text-md [&_svg]:size-5"
                                    >
                                        <House className="mt-1" />
                                        Minecolonies Themes
                                    </Button>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                        <SearchBar />
                    </SidebarHeader>
                    <SidebarContent>
                        <SidebarGroup>
                            <SidebarGroupLabel>Image Size</SidebarGroupLabel>
                            <ImageSizeSlider />
                        </SidebarGroup>
                        <SidebarGroup>
                            <SidebarGroupLabel>Building Selections</SidebarGroupLabel>
                            <SidebarMenu>
                                {[...themes.values()].map(theme => (
                                    <ThemeSelector key={theme.name} theme={theme} />
                                ))}
                            </SidebarMenu>
                        </SidebarGroup>
                    </SidebarContent>
                </Sidebar>
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
    );
}

export default App;
