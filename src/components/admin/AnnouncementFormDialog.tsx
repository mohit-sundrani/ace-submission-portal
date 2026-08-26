import * as React from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { Announcement } from "@/lib/types";
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

interface AnnouncementFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    announcement: Announcement | null;
    onSaved: () => void;
}

export function AnnouncementFormDialog({ open, onOpenChange, announcement, onSaved }: AnnouncementFormDialogProps) {
    const [title, setTitle] = React.useState("");
    const [content, setContent] = React.useState("");
    const [isPinned, setIsPinned] = React.useState(false);
    const [errors, setErrors] = React.useState<Record<string, string>>({});
    const [saving, setSaving] = React.useState(false);

    React.useEffect(() => {
        if (open) {
            setTitle(announcement?.title ?? "");
            setContent(announcement?.content ?? "");
            setIsPinned(announcement?.is_pinned ?? false);
            setErrors({});
        }
    }, [open, announcement]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const next: Record<string, string> = {};
        if (!title.trim()) next.title = "Title is required.";
        if (!content.trim()) next.content = "Content is required.";
        setErrors(next);
        if (Object.keys(next).length > 0) return;

        setSaving(true);
        try {
            const payload = {
                title: title.trim(),
                content: content.trim(),
                is_pinned: isPinned,
            };
            const { error } = announcement
                ? await supabase.from("announcements").update(payload).eq("id", announcement.id)
                : await supabase.from("announcements").insert(payload);
            if (error) throw error;
            toast.success(announcement ? "Announcement updated" : "Announcement created");
            onSaved();
            onOpenChange(false);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not save the announcement.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent aria-describedby="announcement-form-desc">
                <DialogHeader>
                    <DialogTitle>{announcement ? "Edit announcement" : "New announcement"}</DialogTitle>
                    <DialogDescription id="announcement-form-desc">
                        {announcement
                            ? "Update this announcement's details."
                            : "Create a new announcement visible to students."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                    <div className="space-y-1.5">
                        <Label htmlFor="a-title">Title</Label>
                        <Input
                            id="a-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. New domain launched!"
                            aria-invalid={errors.title ? true : undefined}
                        />
                        {errors.title && <p className="text-error text-sm">{errors.title}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="a-content">Content</Label>
                        <Textarea
                            id="a-content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Write your announcement here..."
                            rows={6}
                            aria-invalid={errors.content ? true : undefined}
                        />
                        {errors.content && <p className="text-error text-sm">{errors.content}</p>}
                        <p className="text-muted-foreground text-xs">
                            Markdown supported. Line breaks are preserved as typed.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Switch id="a-pinned" checked={isPinned} onCheckedChange={setIsPinned} />
                        <Label htmlFor="a-pinned" className="cursor-pointer">
                            Pin to top
                        </Label>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" loading={saving}>
                            {announcement ? "Save changes" : "Create announcement"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
