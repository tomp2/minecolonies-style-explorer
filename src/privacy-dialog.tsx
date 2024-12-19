import { Button } from "@/components/ui/button.tsx";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTrigger } from "@/components/ui/dialog.tsx";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table.tsx";
import { ScrollText } from "lucide-react";

export function PrivacyDialog() {
    return (
        <Dialog>
            <DialogTrigger className="inline-flex items-center font-semibold gap-1">
                <ScrollText className="size-5" />
                Privacy
            </DialogTrigger>
            <DialogContent className="max-w-screen-lg">
                <article className="max-h-[70vh] max-w-none overflow-y-auto">
                    <h1 className="text-3xl font-extrabold">Privacy Policy</h1>
                    <p className="mt-4">
                        This site does not use cookies or track any personal information. No ip addresses,
                        monitor sizes, user agents, locations, languages, browser info, or any other personal
                        data is stored. The site collects some very basic data with{" "}
                        <a
                            href="https://posthog.com/"
                            target="_blank"
                            rel="noreferrer"
                            className="underline text-blue-500"
                        >
                            PostHog
                        </a>{" "}
                        to help me understand how people use the site. This data is not shared with anyone
                        else and is only used to improve the site.
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
                                    To see if the page gets too heavy and needs to be optimized, for example
                                    by reducing image sizes
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Theme selections</TableCell>
                                <TableCell>Which themes are priority to keep updated</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Used image size</TableCell>
                                <TableCell>
                                    To see if the default image size is good enough for most people
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Device type</TableCell>
                                <TableCell>
                                    If there are more mobile users than I expect, I might make the site more
                                    mobile friendly
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
    );
}
