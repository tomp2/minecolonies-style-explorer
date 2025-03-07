import { useTheme } from "@/components/theme-provider";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Moon, Sun } from "lucide-react";
import { useRef } from "react";

export function InstantModeToggleButton({ className }: { className?: string }) {
    const theme = useTheme();
    const wasUsingSystemTheme = useRef(theme.theme === "system");
    const initialSystemTheme = useRef<"light" | "dark">(
        window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
    );
    return (
        <Button
            className={className}
            variant="outline"
            size="icon"
            onClick={() => {
                const isDark = document.documentElement.classList.contains("dark");
                const newTheme = isDark ? "light" : "dark";
                if (wasUsingSystemTheme.current && newTheme === initialSystemTheme.current) {
                    theme.setTheme("system");
                } else {
                    theme.setTheme(newTheme);
                }
            }}
        >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}

export function ModeToggleDropdown() {
    const { setTheme, theme } = useTheme();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="relative w-fit">
                    <span className="text-sm font-semibold capitalize">{theme}</span>
                    <div className="relative">
                        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute inset-0 h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    </div>
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
