import { InstantModeToggleButton, ModeToggleDropdown } from "@/components/mode-toggle.tsx";
import { Button } from "@/components/ui/button";
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
import { useAtomValue, useSetAtom } from "jotai";
import { selectedThemesAtom, updateTabAtomSelections } from "@/lib/state-atoms.ts";
import { CheckCheck, X } from "lucide-react";
import { setTitleAndDescriptionFrom } from "@/lib/page-meta.ts";

function ImageColumnsNumber() {
    return useAtomValue(sliderColumnsAtom);
}

export function FullSidebar() {
    const setSelectedStyles = useSetAtom(selectedThemesAtom);
    const updateTab = useSetAtom(updateTabAtomSelections);
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
                <SidebarGroup className="pb-0 px-0">
                    <SidebarGroupLabel>Search</SidebarGroupLabel>
                    <SearchBar />
                </SidebarGroup>
                <SidebarGroup className="pt-0 pb-2">
                    <SidebarGroupLabel>Image columns: {ImageColumnsNumber()}</SidebarGroupLabel>
                    <ImageSizeSlider />
                </SidebarGroup>
                <Separator />
                <SidebarGroup className="space-y-2 py-0">
                    <Button
                        variant="outline"
                        className="h-7 w-full bg-transparent"
                        onClick={() => {
                            const styles = new Set<string>();
                            setSelectedStyles(styles);
                            setTitleAndDescriptionFrom([...styles]);
                        }}
                    >
                        <X className="size-4" />
                        Clear all selections
                    </Button>
                    <Button
                        variant="outline"
                        className="h-7 w-full bg-transparent"
                        onClick={() => {
                            const styles = new Set<string>(styleInfoMap.keys());
                            setSelectedStyles(styles);
                            updateTab(styles);
                            setTitleAndDescriptionFrom([...styles]);
                        }}
                    >
                        <CheckCheck className="size-4" />
                        Select all styles
                    </Button>
                </SidebarGroup>
                <SidebarGroup className="pt-0">
                    <SidebarGroupLabel>Minecolonies</SidebarGroupLabel>
                    <SidebarMenu className="gap-0">
                        {[...styleInfoMap.values()]
                            .filter(style => style.type === "minecolonies")
                            .map(style => (
                                <ThemeSelectable style={style} key={style.name} />
                            ))}
                    </SidebarMenu>
                </SidebarGroup>
                <SidebarGroup className="py-0">
                    <SidebarGroupLabel>Stylecolonies</SidebarGroupLabel>
                    <SidebarMenu className="gap-0">
                        {[...styleInfoMap.values()]
                            .filter(style => style.type === "stylecolonies")
                            .map(style => (
                                <ThemeSelectable style={style} key={style.name} />
                            ))}
                    </SidebarMenu>
                </SidebarGroup>
                <SidebarGroup className="pt-0">
                    <SidebarGroupLabel>Other</SidebarGroupLabel>
                    <SidebarMenu className="gap-0">
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
