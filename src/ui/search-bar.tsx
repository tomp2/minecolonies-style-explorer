import { Input } from "@/components/ui/input.tsx";
import { searchTermAtom, writeSearchTermAtom } from "@/lib/state-atoms.ts";
import { useAtomValue, useSetAtom } from "jotai";
import { Search, X } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { useEffect, useRef } from "react";

export function SearchBar() {
    const posthog = usePostHog();
    const searchTerm = useAtomValue(searchTermAtom);
    const writeSearchTerm = useSetAtom(writeSearchTermAtom);

    const sendEventTimeoutId = useRef<NodeJS.Timeout | null>(null);

    // Send an event when the search is used to determine need for more categories and filters.
    useEffect(() => {
        if (sendEventTimeoutId.current) clearTimeout(sendEventTimeoutId.current);
        if (searchTerm.length < 2) return;
        sendEventTimeoutId.current = setTimeout(() => {
            posthog.capture("search_term_changed", { term: searchTerm });
        }, 5000);
    }, [searchTerm]);

    return (
        <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
            <X
                onClick={() => writeSearchTerm("")}
                className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground"
            />
            <Input
                type="search"
                placeholder="Search buildings..."
                aria-label="Search buildings"
                className="pl-8"
                value={searchTerm}
                onChange={e => writeSearchTerm(e.target.value)}
            />
        </div>
    );
}
