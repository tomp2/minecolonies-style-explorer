import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar.tsx";
import { Toggle } from "@/components/ui/toggle.tsx";
import { useDelayedCaptureEvent } from "@/hooks/delayed-capture-event.ts";
import { MissingStyleInfoJson, missingStylesMap } from "@/lib/theme-data.ts";
import { cn } from "@/lib/utils.ts";
import { atom, useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { Vote } from "lucide-react";
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
                    capturePromise(20_000, "vote_style", { style: style.name }).then(() => {
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
                        <Vote className="size-5 text-gray-400 group-data-[state=on]:text-green-700 dark:text-gray-700 group-data-[state=on]:dark:text-green-600" />
                    </div>
                </Toggle>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}

export default function StyleVoting() {
    return (
        <>
            {[...missingStylesMap.values()].map(style => (
                <Style style={style} key={style.name} />
            ))}
        </>
    );
}
