import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar.tsx";
import { Toggle } from "@/components/ui/toggle.tsx";
import { useDelayedCaptureEvent } from "@/hooks/delayed-capture-event.ts";
import { MissingStyleInfoJson, missingStylesMap } from "@/lib/theme-data.ts";
import { cn } from "@/lib/utils.ts";
import { atom, useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { SendHorizontal, Vote } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { useState } from "react";
import { toast } from "sonner";

const votesAtom = atom<string[]>([]);
const votesSentAtom = atomWithStorage<string[]>("votesSent", []);

function Style({ style }: { style: MissingStyleInfoJson }) {
    const { capturePromise, cancel } = useDelayedCaptureEvent();
    const [votes, setVotes] = useAtom(votesAtom);
    const [votesSent, setVotesSent] = useAtom(votesSentAtom);

    const isSelected = votes.includes(style.name);

    function vote(value: boolean) {
        setVotes(prev => {
            const newVotes = new Set(prev);
            if (value) {
                newVotes.add(style.name);
            } else {
                newVotes.delete(style.name);
                cancel();
            }

            const isSelected = newVotes.has(style.name);
            if (isSelected) {
                toast.success(`Voted for ${style.displayName}`);
            }
            if (!votesSent.includes(style.name)) {
                if (isSelected) {
                    capturePromise(4_000, "vote_style", { style: style.name }).then(() => {
                        setVotesSent([...votesSent, style.name]);
                    });
                } else {
                    cancel();
                }
            }

            return [...newVotes];
        });
    }

    return (
        <SidebarMenuItem>
            <SidebarMenuButton asChild>
                <Toggle
                    pressed={isSelected}
                    onPressedChange={vote}
                    className={cn(
                        "group h-fit w-full justify-between border py-1 data-[state=on]:bg-transparent data-[state=on]:text-current",
                    )}
                >
                    <div className="flex flex-wrap gap-x-1.5 leading-none">{style.displayName}</div>
                    <div className="flex items-center justify-center">
                        <Vote className="size-5 text-gray-400 group-data-[state=on]:text-green-700 dark:text-gray-700 dark:group-data-[state=on]:text-green-600" />
                    </div>
                </Toggle>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}

const customVotesAtom = atomWithStorage<string[]>("customVotes", []);

export function CustomVote() {
    const posthog = usePostHog();
    const [customVotes, setCustomVotes] = useAtom(customVotesAtom);
    const [value, setValue] = useState("");

    const customVotesSet = new Set(customVotes);

    function vote() {
        if (value.length === 0) {
            return;
        }
        if (customVotesSet.has(value)) {
            toast.error("You have already voted for this style");
            return;
        }
        setCustomVotes([...customVotes, value]);

        posthog.capture("vote_style_custom", { style: value });

        toast.success(`Voted for "${value}"`);
    }

    return (
        <SidebarMenuItem className="relative flex">
            <Input
                placeholder="Custom vote"
                className="h-8 shadow-none"
                value={value}
                onChange={e => setValue(e.target.value)}
            ></Input>
            <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 size-8 h-full w-10 hover:bg-transparent"
                onClick={vote}
                disabled={value.length === 0}
            >
                <SendHorizontal className="size-5" />
            </Button>
        </SidebarMenuItem>
    );
}

export default function StyleVoting() {
    return (
        <>
            {[...missingStylesMap.values()].map(style => (
                <Style style={style} key={style.name} />
            ))}
            <CustomVote />
        </>
    );
}
