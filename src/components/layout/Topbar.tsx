import { Menu, Search, Sun, Moon } from "lucide-react";
import { useLocation } from "react-router-dom";
import { labelForPath } from "./navigation";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";

interface TopbarProps {
    onOpenMobileNav: () => void;
    onOpenPalette: () => void;
    onToggleCollapse: () => void;
}

export function Topbar({ onOpenMobileNav, onOpenPalette, onToggleCollapse }: TopbarProps) {
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();

    const title = labelForPath(location.pathname);

    return (
        <header className="border-border bg-card sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b px-3 sm:px-4">
            <button
                className="text-muted-foreground hover:bg-secondary hover:text-secondary-foreground focus-visible:ring-electric rounded-sm p-1.5 transition-colors focus-visible:ring-2 focus-visible:outline-none md:hidden"
                onClick={onOpenMobileNav}
                aria-label="Open navigation"
            >
                <Menu className="size-5" aria-hidden="true" />
            </button>
            <button
                className="text-muted-foreground hover:bg-secondary hover:text-secondary-foreground focus-visible:ring-electric hidden rounded-sm p-1.5 transition-colors focus-visible:ring-2 focus-visible:outline-none md:block"
                onClick={onToggleCollapse}
                aria-label="Toggle sidebar"
            >
                <Menu className="size-5" aria-hidden="true" />
            </button>

            <div className="flex min-w-0 items-center gap-2">
                <span className="text-muted-foreground font-mono text-[0.6875rem] font-medium tracking-wider uppercase">
                    ace
                </span>
                <span className="text-muted-foreground/40" aria-hidden="true">
                    /
                </span>
                <span className="font-heading text-foreground truncate text-sm font-medium">{title}</span>
            </div>

            <div className="ml-auto flex items-center gap-1.5">
                <button
                    onClick={onOpenPalette}
                    className="border-border bg-card text-muted-foreground hover:border-muted-foreground/40 focus-visible:ring-electric hidden h-8 w-56 items-center gap-2 rounded-sm border px-2.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none sm:flex"
                    aria-label="Open command palette"
                >
                    <Search className="size-3.5" aria-hidden="true" />
                    <span className="text-muted-foreground/80 flex-1 text-left text-xs">Jump to...</span>
                    <kbd className="text-muted-foreground font-mono text-[0.625rem]">⌘K</kbd>
                </button>
                <Button variant="ghost" size="icon" className="sm:hidden" onClick={onOpenPalette} aria-label="Search">
                    <Search className="size-4" aria-hidden="true" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                >
                    {theme === "dark" ? (
                        <Sun className="size-4" aria-hidden="true" />
                    ) : (
                        <Moon className="size-4" aria-hidden="true" />
                    )}
                </Button>
            </div>
        </header>
    );
}
