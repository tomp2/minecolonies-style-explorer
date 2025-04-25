import { InstantModeToggleButton, ModeToggleDropdown } from "@/components/mode-toggle.tsx";
import { Separator } from "@/components/ui/separator";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarTrigger,
} from "@/components/ui/sidebar.tsx";
import { categoryNames, styleInfoMap } from "@/lib/theme-data.ts";
import { FeedbackDialog } from "@/ui/feedback.tsx";
import { ImageSizeSlider, sliderColumnsAtom } from "@/ui/image-size-slider.tsx";
import { SearchBar } from "@/ui/search-bar.tsx";
import { CategorySelectable, ThemeSelectable } from "@/ui/selectable.tsx";
import StyleVoting from "@/ui/voting.tsx";
import { useAtomValue } from "jotai";

function ImageColumnsNumber() {
    return useAtomValue(sliderColumnsAtom);
}

export function FullSidebar() {
    return (
        <Sidebar>
            <SidebarHeader className="sm:hidden">
                <SidebarMenu>
                    <SidebarMenuItem className="flex items-center justify-between gap-4">
                        <InstantModeToggleButton className="sm:invisible" />
                        <FeedbackDialog className="sm:invisible" />
                        <SidebarTrigger />
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup className="pb-0">
                    <SidebarGroupLabel>Search</SidebarGroupLabel>
                    <SearchBar />
                </SidebarGroup>
                <SidebarGroup className="pb-2 pt-0">
                    <SidebarGroupLabel>Image columns: {ImageColumnsNumber()}</SidebarGroupLabel>
                    <ImageSizeSlider />
                </SidebarGroup>
                <Separator />
                <SidebarGroup>
                    <SidebarGroupLabel>Minecolonies</SidebarGroupLabel>
                    <SidebarMenu>
                        {[...styleInfoMap.values()]
                            .filter(style => style.type === "minecolonies")
                            .map(style => (
                                <ThemeSelectable style={style} key={style.name} />
                            ))}
                    </SidebarMenu>
                </SidebarGroup>
                <SidebarGroup className="py-0">
                    <SidebarGroupLabel>Stylecolonies</SidebarGroupLabel>
                    <SidebarMenu>
                        {[...styleInfoMap.values()]
                            .filter(style => style.type === "stylecolonies")
                            .map(style => (
                                <ThemeSelectable style={style} key={style.name} />
                            ))}
                    </SidebarMenu>
                </SidebarGroup>
                <SidebarGroup className="pt-0">
                    <SidebarGroupLabel>Other</SidebarGroupLabel>
                    <SidebarMenu>
                        {[...styleInfoMap.values()]
                            .filter(style => style.type === "other")
                            .map(style => (
                                <ThemeSelectable style={style} key={style.name} />
                            ))}
                    </SidebarMenu>
                </SidebarGroup>
                <Separator />
                <SidebarGroup>
                    <SidebarGroupLabel>Category Selections</SidebarGroupLabel>
                    <SidebarMenu className="grid grid-cols-2">
                        {[...categoryNames].map(categoryName => (
                            <CategorySelectable category={categoryName} key={categoryName} />
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
                <Separator />
                <SidebarGroup>
                    <SidebarGroupLabel>Vote for what style I should add next</SidebarGroupLabel>
                    <SidebarMenu>
                        <StyleVoting />
                    </SidebarMenu>
                </SidebarGroup>

                <div className="max-h-full grow" />

                <SidebarGroup>
                    <SidebarGroupLabel>Site theme</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <ModeToggleDropdown />
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}
