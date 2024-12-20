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
import { MessageCircle } from "lucide-react";

export function FeedbackDialog() {
    return (
        <Dialog>
            <DialogTrigger className="ml-auto text-lg font-semibold flex items-center">
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
                    className="overflow-y-auto w-full sm:h-[calc(min(510px,_70vh))] h-[calc(min(570px,_70vh))]"
                >
                    Loading...
                </iframe>
                <DialogFooter className="sm:justify-start p-6">
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
