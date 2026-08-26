interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
    return (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
                <div className="mt-2.5 flex items-baseline gap-3">
                    <h1 className="font-heading text-foreground text-2xl leading-snug font-medium tracking-tight text-balance sm:text-3xl">
                        {title}
                    </h1>
                </div>
                {description && (
                    <p className="text-muted-foreground mt-1.5 max-w-2xl text-sm text-pretty">{description}</p>
                )}
            </div>
            {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
    );
}
