import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import {
    searchSelectedThemesOnlyAtom,
    searchTermAtom,
    updateTabAtomSearchQuery,
    writeSearchTermAtom,
} from "@/lib/state-atoms.ts";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Search, X } from "lucide-react";
import { useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { useDelayedCaptureEvent } from "@/hooks/delayed-capture-event.ts";
import { SidebarGroupLabel } from "@/components/ui/sidebar.tsx";

export function SearchBar() {
    const { capture } = useDelayedCaptureEvent();
    const updateTab = useSetAtom(updateTabAtomSearchQuery);
    const [searchSelectedThemesOnly, setSearchSelectedThemesOnly] = useAtom(searchSelectedThemesOnlyAtom);
    const searchTerm = useAtomValue(searchTermAtom);
    const writeSearchTerm = useSetAtom(writeSearchTermAtom);
    const [input, setInput] = useState(searchTerm);
    const debounced = useDebouncedCallback(value => writeSearchTerm(value), 300);
    return (
        <div className="flex w-full flex-col px-2">
            <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                <X
                    onClick={() => {
                        setInput("");
                        writeSearchTerm("");
                    }}
                    className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground"
                />
                <Input
                    type="search"
                    placeholder="Search buildings..."
                    aria-label="Search buildings"
                    className="pl-8"
                    value={input}
                    onChange={e => {
                        const value = e.target.value.slice(0, 30);
                        setInput(value);
                        debounced(value);
                        updateTab(value);
                        capture(1500, "search_building", { search_term: value });
                    }}
                />
            </div>

            <SidebarGroupLabel className="-ml-2">Search from:</SidebarGroupLabel>
            <div className="flex h-9 items-center space-x-2 rounded-md border px-2 shadow-xs">
                <Label className="pb-0.5">Selections only</Label>
                <Switch
                    checked={!searchSelectedThemesOnly}
                    onCheckedChange={(checked: boolean) => setSearchSelectedThemesOnly(!checked)}
                    id="search-selected-themes-only"
                />
                <Label className="pb-0.5">All styles</Label>
            </div>
        </div>
    );
}
