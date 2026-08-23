import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { cn } from "@/lib/utils";

const components: Components = {
    p: ({ children }) => <p className="text-foreground/90 text-sm leading-relaxed">{children}</p>,
    h1: ({ children }) => (
        <h3 className="font-heading text-foreground mt-5 text-base font-medium first:mt-0">{children}</h3>
    ),
    h2: ({ children }) => (
        <h4 className="font-heading text-foreground mt-5 text-sm font-medium first:mt-0">{children}</h4>
    ),
    h3: ({ children }) => (
        <h5 className="text-muted-foreground font-heading mt-4 text-[0.8125rem] font-semibold tracking-wide uppercase first:mt-0">
            {children}
        </h5>
    ),
    strong: ({ children }) => <strong className="text-foreground font-semibold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    del: ({ children }) => <del className="text-muted-foreground line-through">{children}</del>,
    a: ({ href, children }) => (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-electric decoration-electric/40 hover:decoration-electric font-medium underline underline-offset-2"
        >
            {children}
        </a>
    ),
    ul: ({ children }) => (
        <ul className="list-disc space-y-1.5 pl-5 marker:text-[var(--color-electric)]">{children}</ul>
    ),
    ol: ({ children }) => (
        <ol className="list-decimal space-y-1.5 pl-5 marker:font-mono marker:text-[var(--color-electric)]">
            {children}
        </ol>
    ),
    li: ({ children }) => <li className="text-foreground/90 pl-1 text-sm leading-relaxed">{children}</li>,
    blockquote: ({ children }) => (
        <blockquote className="border-border text-muted-foreground border-l-2 pl-4 italic">{children}</blockquote>
    ),
    hr: () => <hr className="border-border my-5" />,
    code: ({ className, children }) => {
        const isBlock = typeof className === "string" && className.includes("language-");
        if (isBlock) {
            return (
                <code
                    className={cn(
                        "text-foreground/90 block overflow-x-auto p-3 font-mono text-xs leading-relaxed",
                        className
                    )}
                >
                    {children}
                </code>
            );
        }
        return (
            <code
                className={cn(
                    "bg-muted text-space dark:text-vite rounded-xs px-1.5 py-0.5 font-mono text-[0.8125em]",
                    className
                )}
            >
                {children}
            </code>
        );
    },
    pre: ({ children }) => (
        <pre className="bg-muted border-border overflow-x-auto rounded-md border p-0">{children}</pre>
    ),
    table: ({ children }) => (
        <div className="border-border overflow-x-auto rounded-md border">
            <table className="w-full border-collapse text-sm">{children}</table>
        </div>
    ),
    thead: ({ children }) => <thead className="bg-secondary">{children}</thead>,
    th: ({ children }) => (
        <th className="border-border text-muted-foreground border-b px-3 py-2 text-left text-xs font-medium tracking-wide uppercase">
            {children}
        </th>
    ),
    td: ({ children }) => <td className="border-border text-foreground/90 border-b px-3 py-2 align-top">{children}</td>,
};

interface MarkdownProps {
    content: string;
    className?: string;
}

export function Markdown({ content, className }: MarkdownProps) {
    return (
        <div className={cn("space-y-3", className)}>
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={components}>
                {content}
            </ReactMarkdown>
        </div>
    );
}

export default Markdown;
