import * as React from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { FAQ } from "@/lib/types";
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

interface FAQFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    faq: FAQ | null;
    defaultOrder: number;
    onSaved: () => void;
}

export function FAQFormDialog({ open, onOpenChange, faq, defaultOrder, onSaved }: FAQFormDialogProps) {
    const [question, setQuestion] = React.useState("");
    const [answer, setAnswer] = React.useState("");
    const [displayOrder, setDisplayOrder] = React.useState(0);
    const [errors, setErrors] = React.useState<Record<string, string>>({});
    const [saving, setSaving] = React.useState(false);

    React.useEffect(() => {
        if (open) {
            setQuestion(faq?.question ?? "");
            setAnswer(faq?.answer ?? "");
            setDisplayOrder(faq?.display_order ?? defaultOrder);
            setErrors({});
        }
    }, [open, faq, defaultOrder]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const next: Record<string, string> = {};
        if (!question.trim()) next.question = "Question is required.";
        if (!answer.trim()) next.answer = "Answer is required.";
        if (Number.isNaN(displayOrder)) next.displayOrder = "Display order must be a number.";
        setErrors(next);
        if (Object.keys(next).length > 0) return;

        setSaving(true);
        try {
            const payload = {
                question: question.trim(),
                answer: answer.trim(),
                display_order: Number(displayOrder),
            };
            const { error } = faq
                ? await supabase.from("faqs").update(payload).eq("id", faq.id)
                : await supabase.from("faqs").insert(payload);
            if (error) throw error;
            toast.success(faq ? "FAQ updated" : "FAQ created");
            onSaved();
            onOpenChange(false);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not save the FAQ.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent aria-describedby="faq-form-desc">
                <DialogHeader>
                    <DialogTitle>{faq ? "Edit FAQ" : "New FAQ"}</DialogTitle>
                    <DialogDescription id="faq-form-desc">
                        {faq ? "Update this FAQ entry." : "Create a new frequently asked question."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                    <div className="space-y-1.5">
                        <Label htmlFor="f-question">Question</Label>
                        <Input
                            id="f-question"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="e.g. How do I submit my work?"
                            aria-invalid={errors.question ? true : undefined}
                        />
                        {errors.question && <p className="text-error text-sm">{errors.question}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="f-answer">Answer</Label>
                        <Textarea
                            id="f-answer"
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            placeholder="Write the answer here..."
                            rows={6}
                            aria-invalid={errors.answer ? true : undefined}
                        />
                        {errors.answer && <p className="text-error text-sm">{errors.answer}</p>}
                        <p className="text-muted-foreground text-xs">
                            Markdown supported. Line breaks are preserved as typed.
                        </p>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="f-order">Display order</Label>
                        <Input
                            id="f-order"
                            type="number"
                            value={displayOrder}
                            onChange={(e) => setDisplayOrder(Number(e.target.value))}
                            aria-invalid={errors.displayOrder ? true : undefined}
                        />
                        {errors.displayOrder && <p className="text-error text-sm">{errors.displayOrder}</p>}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" loading={saving}>
                            {faq ? "Save changes" : "Create FAQ"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
