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
                <Sidebar variant="inset">
                    <SidebarHeader>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton size="lg" asChild>
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
                <SidebarInset className="flex-1 overflow-auto">
                    <PageHeader />
                    <PageContent />
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}

export default App;
