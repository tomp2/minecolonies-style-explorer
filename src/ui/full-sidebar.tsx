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
            <p className="text-sm text-gray-500 ml-auto">{favoriteCount}</p>
        </CheckboxButton>
    );
}

export function FullSidebar() {
    return (
        <Sidebar>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <Button variant="ghost" className="w-full justify-start text-md [&_svg]:size-5">
                                <House className="mt-1" />
                                Minecolonies Styles
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
