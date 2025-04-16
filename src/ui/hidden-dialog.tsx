import { Button } from "@/components/ui/button.tsx";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { usePostHog } from "posthog-js/react";
import { useState } from "react";

const persistentIdentityAtom = atomWithStorage<string | null>("persistent-identity", null);

export function HiddenDialog() {
    const posthog = usePostHog();
    const [storageIdentity, setStorageIdentity] = useAtom(persistentIdentityAtom);
    const [editedIdentity, setEditedIdentity] = useState<string>(storageIdentity ?? "");

    const urlParams = new URLSearchParams(window.location.search);
    const showDialog = urlParams.get("hidden") !== null;

    function saveIdentity() {
        if (editedIdentity && editedIdentity !== storageIdentity) {
            setStorageIdentity(editedIdentity);
            posthog.identify(editedIdentity);
        }
    }

    return (
        <Dialog defaultOpen={showDialog}>
            <DialogContent className="max-h-[70vh] max-w-screen-sm overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Hidden Dialog</DialogTitle>
                    <DialogDescription>
                        This dialog is only for development purposes and is not really meant to be seen by
                        users. By default this site does not track users across sessions, but in this dialog
                        you can set a persistent identity that will be stored in your browser and used to
                        identify you in future visits. This is only for the developer to make it possible to
                        exclude their own visits from the site analytics.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="identity">Custom identity</Label>
                    <Input
                        type="text"
                        id="identity"
                        placeholder="Custom identity"
                        value={editedIdentity}
                        onChange={e => setEditedIdentity(e.target.value)}
                    />
                </div>
                <DialogFooter className="sm:justify-start">
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">
                            Close
                        </Button>
                    </DialogClose>
                    <Button type="submit" onClick={saveIdentity}>
                        Save changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
