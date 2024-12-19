import "./App.css";
import { Button } from "@/components/ui/button.tsx";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTrigger } from "@/components/ui/dialog.tsx";
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
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table.tsx";
import { themes } from "@/lib/theme-data.ts";
import { ImageSizeSlider } from "@/ui/image-size-slider.tsx";
import { PageContent } from "@/ui/page-content.tsx";
import { PageHeader } from "@/ui/page-header.tsx";
import { SearchBar } from "@/ui/search-bar.tsx";
import { ThemeSelector } from "@/ui/theme-selector.tsx";
import { House, ScrollText } from "lucide-react";

function App() {
    return (
        <SidebarProvider>
            <div className="flex h-screen w-full">
                <Sidebar>
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
                <SidebarInset className="w-full flex flex-col">
                    <PageHeader />

                    <div className="bg-gray-100 grow">
                        <PageContent />
                    </div>
                    <div className="border-t bg-card/50 h-10 shrink-0 grow-0 flex px-4 justify-end gap-5">
                        <a
                            href="https://github.com/tomp2/minecolonies-building-explorer"
                            target="_blank"
                            className="inline-flex items-center font-semibold gap-1"
                            rel="noreferrer"
                            aria-label="View source on GitHub"
                        >
                            <svg
                                className="size-5"
                                role="img"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <title>GitHub</title>
                                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                            </svg>
                            Source
                        </a>
                        <Dialog>
                            <DialogTrigger className="inline-flex items-center font-semibold gap-1">
                                <ScrollText className="size-5" />
                                Privacy
                            </DialogTrigger>
                            <DialogContent className="max-w-screen-lg">
                                <article className="max-h-[70vh] max-w-none overflow-y-auto">
                                    <h1 className="text-3xl font-extrabold">Privacy Policy</h1>
                                    <p className="mt-4">
                                        This site does not use cookies or track any personal information. No
                                        ip addresses, monitor sizes, user agents, locations, languages,
                                        browser info, or any other personal data is stored. The site collects
                                        some very basic data with{" "}
                                        <a
                                            href="https://posthog.com/"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="underline text-blue-500"
                                        >
                                            PostHog
                                        </a>{" "}
                                        to help me understand how people use the site. This data is not shared
                                        with anyone else and is only used to improve the site.
                                    </p>
                                    <Table>
                                        <TableCaption>Data collected</TableCaption>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>What</TableHead>
                                                <TableHead>Why</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell>Page view</TableCell>
                                                <TableCell>To see if people even use the site</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>Page loading speed</TableCell>
                                                <TableCell>
                                                    To see if the page gets too heavy and needs to be
                                                    optimized, for example by reducing image sizes
                                                </TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>Theme selections</TableCell>
                                                <TableCell>
                                                    Which themes are priority to keep updated
                                                </TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>Used image size</TableCell>
                                                <TableCell>
                                                    To see if the default image size is good enough for most
                                                    people
                                                </TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>Device type</TableCell>
                                                <TableCell>
                                                    If there are more mobile users than I expect, I might make
                                                    the site more mobile friendly
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                    <p className="mt-10">
                                        If you have any questions or concerns, please contact me at{" "}
                                        <a href="mailto:tomp.code@gmail.com">
                                            <span className="underline">tomp.code@gmail.com</span>
                                        </a>
                                    </p>
                                </article>
                                <DialogFooter className="sm:justify-start">
                                    <DialogClose asChild>
                                        <Button type="button" variant="secondary">
                                            Close
                                        </Button>
                                    </DialogClose>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}

export default App;
