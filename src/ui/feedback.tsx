import { Button } from "@/components/ui/button.tsx";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { MessageCircle } from "lucide-react";

export function FeedbackDialog({ className }: { className?: string }) {
    return (
        <Dialog>
            <DialogTrigger className={cn("flex items-center text-lg font-semibold", className)}>
                <MessageCircle className="size-5" />
                Feedback
            </DialogTrigger>
            <DialogContent className="max-w-screen-sm px-0">
                <DialogHeader className="px-6">
                    <DialogTitle>Feedback</DialogTitle>
                    <DialogDescription>
                        Help me improve this site by providing free-form feedback.
                        <p>
                            Can&#39;t see the form?{" "}
                            <a
                                href="https://forms.gle/kRDwczvYDSHFJDRF7"
                                target="_blank"
                                rel="noreferrer"
                                className="underline"
                            >
                                Open in a new tab
                            </a>
                        </p>
                    </DialogDescription>
                </DialogHeader>
                <iframe
                    src="https://docs.google.com/forms/d/e/1FAIpQLSdCtm4Ne3MkI2bHWxMsHAZwFxT5-IfcY2P2HNehZfsepEtncQ/viewform?embedded=true"
                    className="h-[calc(min(570px,_70vh))] w-full overflow-y-auto sm:h-[calc(min(510px,_70vh))]"
                >
                    Loading...
                </iframe>
                <DialogFooter className="p-6 sm:justify-start">
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
