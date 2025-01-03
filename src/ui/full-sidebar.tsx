import { CheckboxButton } from "@/components/checkbox-button.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarTrigger,
} from "@/components/ui/sidebar.tsx";
import { favoritePaths, showFavoritesAtom } from "@/lib/state-atoms.ts";
import { themes } from "@/lib/theme-data.ts";
import { ImageSizeSlider } from "@/ui/image-size-slider.tsx";
import { SearchBar } from "@/ui/search-bar.tsx";
import { ThemeSelector } from "@/ui/theme-selector.tsx";
import { useAtom, useAtomValue } from "jotai";
import { House } from "lucide-react";

function ShowFavorites() {
    const [showFavorites, toggleShowFavorites] = useAtom(showFavoritesAtom);
    const favoriteCount = useAtomValue(favoritePaths).length;

    return (
        <CheckboxButton
            className=""
            aria-label="Favorites"
            pressed={showFavorites}
            onPressedChange={toggleShowFavorites}
        >
            <p className="mb-0.5">Show Favorites</p>
            <p className="ml-auto text-sm text-gray-500">{favoriteCount}</p>
        </CheckboxButton>
    );
}

export function FullSidebar() {
    return (
        <Sidebar>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem className="flex items-center">
                        <SidebarMenuButton asChild>
                            <Button variant="ghost" className="text-md w-full justify-start [&_svg]:size-5">
                                <House className="mt-1" />
                                Minecolonies Styles
                            </Button>
                        </SidebarMenuButton>
                        <SidebarTrigger />
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Search</SidebarGroupLabel>
                    <SearchBar />
                </SidebarGroup>
                <SidebarGroup>
                    <SidebarGroupLabel>Image columns</SidebarGroupLabel>
                    <ImageSizeSlider />
                </SidebarGroup>
                <SidebarGroup>
                    <SidebarGroupLabel className="h-fit">Favorites</SidebarGroupLabel>
                    <ShowFavorites />
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
    );
}
