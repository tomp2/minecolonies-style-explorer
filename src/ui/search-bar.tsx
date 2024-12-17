import { Input } from "@/components/ui/input.tsx";
import { searchTermAtom } from "@/lib/state-atoms.ts";
import { useAtom } from "jotai";
import { Search, X } from "lucide-react";

export function SearchBar() {
    const [searchTerm, setSearchTerm] = useAtom(searchTermAtom);
    return (
        <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
            <X
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground"
            />
            <Input
                type="search"
                placeholder="Search buildings..."
                aria-label="Search buildings"
                className="pl-8"
                value={searchTerm}
                onChange={e => {
                    setSearchTerm(e.target.value);
                    // Set the search term in the URL query string if it's not empty
                    const url = new URL(window.location.href);
                    if (e.target.value) {
                        url.searchParams.set("search", e.target.value);
                    } else {
                        url.searchParams.delete("search");
                    }
                    window.history.replaceState({}, "", url.toString());
                }}
            />
        </div>
    );
}
