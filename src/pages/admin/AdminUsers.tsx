import * as React from "react";
import { Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useFetch } from "@/hooks/useFetch";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatSkeleton } from "@/components/states/LoadingState";
import { ErrorState } from "@/components/states/ErrorState";
import type { Profile, Role } from "@/lib/types";

type UserProfile = Pick<
    Profile,
    "id" | "email" | "full_name" | "phone" | "enrollment_no" | "course" | "role" | "created_at"
>;

const ROLE_OPTIONS: Role[] = ["student", "mentor", "admin", "owner"];

const ROLE_LABEL: Record<Role, string> = {
    student: "Student",
    mentor: "Mentor",
    admin: "Admin",
    owner: "Owner",
};

async function fetchAllUsers(): Promise<UserProfile[]> {
    const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, phone, enrollment_no, course, role, created_at")
        .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
}

export function AdminUsers() {
    const { data: users, loading, error, refetch } = useFetch(fetchAllUsers, []);
    const [search, setSearch] = React.useState("");
    const [updatingId, setUpdatingId] = React.useState<string | null>(null);

    const filtered = React.useMemo(() => {
        if (!users) return [];
        const q = search.trim().toLowerCase();
        if (!q) return users;
        return users.filter(
            (u) =>
                u.full_name.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q) ||
                u.enrollment_no.toLowerCase().includes(q)
        );
    }, [users, search]);

    const handleRoleChange = async (userId: string, newRole: Role) => {
        setUpdatingId(userId);
        const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", userId);
        setUpdatingId(null);
        if (error) {
            console.error("Failed to update role:", error);
            return;
        }
        refetch();
    };

    return (
        <div className="page py-8">
            <PageHeader title="User Management" description="View all registered students and manage their roles." />

            {error && !loading && <ErrorState message={error} onRetry={refetch} />}
            {loading && !error && <StatSkeleton />}

            {!loading && !error && users && (
                <>
                    <div className="panel mb-6 p-4">
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1">
                                <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                                <Input
                                    placeholder="Search by name, email, or enrollment number..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Badge variant="default">
                                {filtered.length} user{filtered.length !== 1 ? "s" : ""}
                            </Badge>
                        </div>
                    </div>

                    <div className="panel overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-border border-b">
                                        <th className="text-muted-foreground px-4 py-3 font-mono text-[0.6875rem] font-medium tracking-[0.05em] uppercase">
                                            Name
                                        </th>
                                        <th className="text-muted-foreground px-4 py-3 font-mono text-[0.6875rem] font-medium tracking-[0.05em] uppercase">
                                            Email
                                        </th>
                                        <th className="text-muted-foreground px-4 py-3 font-mono text-[0.6875rem] font-medium tracking-[0.05em] uppercase">
                                            Enrollment
                                        </th>
                                        <th className="text-muted-foreground px-4 py-3 font-mono text-[0.6875rem] font-medium tracking-[0.05em] uppercase">
                                            Course
                                        </th>
                                        <th className="text-muted-foreground px-4 py-3 font-mono text-[0.6875rem] font-medium tracking-[0.05em] uppercase">
                                            Role
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((user) => (
                                        <tr
                                            key={user.id}
                                            className="border-border hover:bg-secondary/50 border-b transition-colors last:border-b-0"
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="bg-secondary text-secondary-foreground flex size-7 items-center justify-center rounded-full text-[0.625rem] font-medium">
                                                        {(user.full_name || "U").slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <span className="text-foreground font-medium">
                                                        {user.full_name || "-"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="text-muted-foreground px-4 py-3">{user.email}</td>
                                            <td className="text-muted-foreground px-4 py-3 font-mono text-xs">
                                                {user.enrollment_no || "-"}
                                            </td>
                                            <td className="text-muted-foreground px-4 py-3">{user.course || "-"}</td>
                                            <td className="px-4 py-3">
                                                <Select
                                                    value={user.role}
                                                    onValueChange={(val) => handleRoleChange(user.id, val as Role)}
                                                    disabled={updatingId === user.id || user.role === "owner"}
                                                >
                                                    <SelectTrigger className="h-8 w-[120px] text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {ROLE_OPTIONS.map((r) => (
                                                            <SelectItem
                                                                key={r}
                                                                value={r}
                                                                disabled={r === "owner" && user.role !== "owner"}
                                                            >
                                                                {ROLE_LABEL[r]}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </td>
                                        </tr>
                                    ))}
                                    {filtered.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="text-muted-foreground px-4 py-10 text-center">
                                                No users found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
