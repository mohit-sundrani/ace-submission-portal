import * as React from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { Domain } from "@/lib/types";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface DomainFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    domain: Domain | null;
    defaultOrder: number;
    onSaved: () => void;
}

export function DomainFormDialog({ open, onOpenChange, domain, defaultOrder, onSaved }: DomainFormDialogProps) {
    const [name, setName] = React.useState("");
    const [description, setDescription] = React.useState("");
    const [isVisible, setIsVisible] = React.useState(true);
    const [displayOrder, setDisplayOrder] = React.useState(0);
    const [errors, setErrors] = React.useState<Record<string, string>>({});
    const [saving, setSaving] = React.useState(false);

    React.useEffect(() => {
        if (open) {
            setName(domain?.name ?? "");
            setDescription(domain?.description ?? "");
            setIsVisible(domain?.is_visible ?? true);
            setDisplayOrder(domain?.display_order ?? defaultOrder);
            setErrors({});
        }
    }, [open, domain, defaultOrder]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const next: Record<string, string> = {};
        if (!name.trim()) next.name = "Domain name is required.";
        if (Number.isNaN(displayOrder)) next.displayOrder = "Display order must be a number.";
        setErrors(next);
        if (Object.keys(next).length > 0) return;

        setSaving(true);
        try {
            const payload = {
                name: name.trim(),
                description: description.trim(),
                is_visible: isVisible,
                display_order: Number(displayOrder),
            };
            const { error } = domain
                ? await supabase.from("domains").update(payload).eq("id", domain.id)
                : await supabase.from("domains").insert(payload);
            if (error) throw error;
            toast.success(domain ? "Domain updated" : "Domain created");
            onSaved();
            onOpenChange(false);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not save the domain.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent aria-describedby="domain-form-desc">
                <DialogHeader>
                    <DialogTitle>{domain ? "Edit domain" : "New domain"}</DialogTitle>
                    <DialogDescription id="domain-form-desc">
                        {domain ? "Update this domain's details." : "Create a new submission domain."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                    <div className="space-y-1.5">
                        <Label htmlFor="d-name">Domain name</Label>
                        <Input
                            id="d-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Web Development"
                            aria-invalid={errors.name ? true : undefined}
                        />
                        {errors.name && <p className="text-error text-sm">{errors.name}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="d-desc">Instructions</Label>
                        <Textarea
                            id="d-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What students do inside this domain."
                            rows={3}
                        />
                        <p className="text-muted-foreground text-xs">
                            Markdown supported. Line breaks are preserved as typed.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="d-order">Display order</Label>
                            <Input
                                id="d-order"
                                type="number"
                                value={displayOrder}
                                onChange={(e) => setDisplayOrder(Number(e.target.value))}
                                aria-invalid={errors.displayOrder ? true : undefined}
                            />
                            {errors.displayOrder && <p className="text-error text-sm">{errors.displayOrder}</p>}
                        </div>
                        <div className="flex items-end gap-3 pb-1">
                            <Switch id="d-visible" checked={isVisible} onCheckedChange={setIsVisible} />
                            <Label htmlFor="d-visible" className="cursor-pointer">
                                {isVisible ? "Visible to students" : "Hidden"}
                            </Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" loading={saving}>
                            {domain ? "Save changes" : "Create domain"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
