import * as React from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { Task, Difficulty, SubmissionType } from "@/lib/types";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TaskFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    domainId: string;
    task: Task | null;
    defaultOrder: number;
    onSaved: () => void;
}

export function TaskFormDialog({ open, onOpenChange, domainId, task, defaultOrder, onSaved }: TaskFormDialogProps) {
    const [name, setName] = React.useState("");
    const [description, setDescription] = React.useState("");
    const [instructions, setInstructions] = React.useState("");
    const [difficulty, setDifficulty] = React.useState<Difficulty>("medium");
    const [submissionType, setSubmissionType] = React.useState<SubmissionType>("pdf_link");
    const [isVisible, setIsVisible] = React.useState(true);
    const [allowsResubmission, setAllowsResubmission] = React.useState(false);
    const [displayOrder, setDisplayOrder] = React.useState(0);
    const [errors, setErrors] = React.useState<Record<string, string>>({});
    const [saving, setSaving] = React.useState(false);

    React.useEffect(() => {
        if (open) {
            setName(task?.name ?? "");
            setDescription(task?.description ?? "");
            setInstructions(task?.instructions ?? "");
            setDifficulty(task?.difficulty ?? "medium");
            setSubmissionType(task?.submission_type ?? "pdf_link");
            setIsVisible(task?.is_visible ?? true);
            setAllowsResubmission(task?.allows_resubmission ?? false);
            setDisplayOrder(task?.display_order ?? defaultOrder);
            setErrors({});
        }
    }, [open, task, defaultOrder]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const next: Record<string, string> = {};
        if (!name.trim()) next.name = "Task name is required.";
        setErrors(next);
        if (Object.keys(next).length > 0) return;

        setSaving(true);
        try {
            const payload = {
                name: name.trim(),
                description: description.trim(),
                instructions: instructions.trim(),
                difficulty,
                submission_type: submissionType,
                is_visible: isVisible,
                allows_resubmission: allowsResubmission,
                display_order: Number(displayOrder),
            };
            const { error } = task
                ? await supabase.from("tasks").update(payload).eq("id", task.id)
                : await supabase.from("tasks").insert({ ...payload, domain_id: domainId });
            if (error) throw error;
            toast.success(task ? "Task updated" : "Task created");
            onSaved();
            onOpenChange(false);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not save the task.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl" aria-describedby="task-form-desc">
                <DialogHeader>
                    <DialogTitle>{task ? "Edit task" : "New task"}</DialogTitle>
                    <DialogDescription id="task-form-desc">
                        {task ? "Update this task's content and configuration." : "Create a task inside this domain."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                    <div className="space-y-1.5">
                        <Label htmlFor="t-name">Task name</Label>
                        <Input
                            id="t-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Responsive Landing Page"
                            aria-invalid={errors.name ? true : undefined}
                        />
                        {errors.name && <p className="text-error text-sm">{errors.name}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="t-desc">Short description</Label>
                        <Textarea
                            id="t-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="One or two lines shown on the task card."
                            rows={2}
                        />
                        <p className="text-muted-foreground text-xs">
                            Markdown supported. Line breaks are preserved as typed.
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="t-instructions">Detailed instructions</Label>
                        <Textarea
                            id="t-instructions"
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            placeholder={
                                "What students must do, step by step.\n\nMarkdown is supported:\n- Bullet lists\n**Bold**, *italic*, `code`\n[Links](https://example.com)\n1. Numbered steps"
                            }
                            rows={7}
                        />
                        <p className="text-muted-foreground text-xs">
                            Markdown supported - headings, lists, bold, code and links. Line breaks are preserved
                            exactly as pasted.
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label>Difficulty</Label>
                            <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
                                <SelectTrigger aria-label="Difficulty">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="easy">Easy</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="hard">Hard</SelectItem>
                                    <SelectItem value="extreme">Extreme</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Submission type</Label>
                            <Select
                                value={submissionType}
                                onValueChange={(v) => setSubmissionType(v as SubmissionType)}
                            >
                                <SelectTrigger aria-label="Submission type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pdf">PDF upload only</SelectItem>
                                    <SelectItem value="link">Links only</SelectItem>
                                    <SelectItem value="pdf_link">PDF + Links</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="t-order">Display order</Label>
                            <Input
                                id="t-order"
                                type="number"
                                value={displayOrder}
                                onChange={(e) => setDisplayOrder(Number(e.target.value))}
                            />
                        </div>
                        <div className="flex items-end gap-3 pb-1">
                            <Switch id="t-visible" checked={isVisible} onCheckedChange={setIsVisible} />
                            <Label htmlFor="t-visible" className="cursor-pointer">
                                {isVisible ? "Visible" : "Hidden"}
                            </Label>
                        </div>
                        <div className="flex items-end gap-3 pb-1">
                            <Switch
                                id="t-resubmit"
                                checked={allowsResubmission}
                                onCheckedChange={setAllowsResubmission}
                            />
                            <Label htmlFor="t-resubmit" className="cursor-pointer">
                                {allowsResubmission ? "Resubmission on" : "Single submit"}
                            </Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" loading={saving}>
                            {task ? "Save changes" : "Create task"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
