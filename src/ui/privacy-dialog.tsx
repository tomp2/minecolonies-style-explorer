import { Button } from "@/components/ui/button.tsx";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTrigger } from "@/components/ui/dialog.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { ScrollText } from "lucide-react";

export function PrivacyDialog() {
    return (
        <Dialog>
            <DialogTrigger className="inline-flex items-center gap-1 font-semibold">
                <ScrollText className="size-5" />
                Privacy
            </DialogTrigger>
            <DialogContent className="max-w-screen-lg">
                <article className="max-h-[70vh] max-w-none overflow-y-auto">
                    <h1 className="text-3xl font-extrabold">Privacy Policy</h1>
                    <p className="mt-4">
                        This site doesn&apos;t have ads, doesn&apos;t use cookies, doesn&apos;t collect
                        personal information, and doesn&apos;t track you in any way. The site sends some very
                        basic anonymous events using{" "}
                        <a
                            href="https://posthog.com/"
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-500 underline"
                        >
                            PostHog
                        </a>{" "}
                        to help me make the site better and prioritize what to work on next:
                    </p>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>What</TableHead>
                                <TableHead>Why</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell>Page loading speed</TableCell>
                                <TableCell>
                                    To monitor if the page gets too heavy and needs to be optimized, for
                                    example needs to reduce image sizes
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Style voting</TableCell>
                                <TableCell>I use this to decide what style I will add next.</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Select style</TableCell>
                                <TableCell>
                                    I use this to see what styles are most popular and decide if I should
                                    perhaps add special features for them, and prioritize keeping them updated
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Used image column count</TableCell>
                                <TableCell>
                                    To see if the default image size is what most people want
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Favorite building</TableCell>
                                <TableCell>
                                    This is to see if people often use this feature. If people use it a lot, I
                                    could add some more depth to it, like collections, sharing, etc. This
                                    doesn&apos;t include a list of what you have favorited, this is just
                                    counting the clicks on the heart icon.
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                    <p className="mt-10">
                        If you have any questions or concerns, please contact me at{" "}
                        <a href="mailto:tomp.code@gmail.com">
                            <span className="underline">tomp.code@gmail.com</span>
                        </a>{" "}
                        or use the feedback button at the top right.
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
