import { Link } from "react-router-dom";
import { ArrowRight, FolderKanban } from "lucide-react";
import type { Domain } from "@/lib/types";

interface DomainCardProps {
    domain: Domain;
    taskCount: number;
}

/** Bordered panel card - the domain explorer's navigation unit (design.md §8). */
export function DomainCard({ domain, taskCount }: DomainCardProps) {
    return (
        <Link
            to={`/app/domains/${domain.id}`}
            className="group panel hover:border-muted-foreground/40 focus-visible:ring-electric relative flex flex-col p-5 transition-all duration-150 focus-visible:ring-2 focus-visible:outline-none sm:p-6"
        >
            <div className="flex items-center justify-between gap-3">
                <span className="eyebrow flex items-center gap-1.5">
                    <FolderKanban className="size-3.5" aria-hidden="true" />
                    Domain
                </span>
                <span className="text-muted-foreground font-mono text-[0.625rem] font-medium tracking-[0.05em] uppercase">
                    {taskCount} {taskCount === 1 ? "task" : "tasks"}
                </span>
            </div>
            <h3 className="font-heading text-foreground group-hover:text-electric mt-4 text-lg leading-snug font-medium uppercase transition-colors duration-150">
                {domain.name}
            </h3>
            <div className="border-border text-muted-foreground group-hover:text-electric mt-5 flex items-center gap-1.5 border-t pt-4 font-mono text-[0.6875rem] font-medium tracking-[0.05em] uppercase transition-colors duration-150">
                Open domain
                <ArrowRight
                    className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5"
                    aria-hidden="true"
                />
            </div>
        </Link>
    );
}
