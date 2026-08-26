import { useNavigate, useLocation } from "react-router-dom";
import { UserRound, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ProfileForm } from "@/components/auth/ProfileForm";
import { isProfileComplete } from "@/components/auth/RequireProfile";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { PanelSkeleton } from "@/components/states/LoadingState";
import { formatDateTime } from "@/lib/utils";
import type { Role } from "@/lib/types";

const ROLE_LABEL: Record<Role, string> = {
    student: "Student",
    mentor: "Mentor",
    admin: "Admin",
    owner: "Owner",
};

export function ProfilePage() {
    const { profile, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const isAdminOrMentor = location.pathname.startsWith("/admin");
    const complete = profile ? isProfileComplete(profile) : false;

    if (loading || profile === null) return <PanelSkeleton className="mx-auto mt-8 max-w-3xl" />;

    return (
        <div className="page py-8">
            <PageHeader
                title={complete ? "My Profile" : "Complete your profile"}
                description={
                    complete
                        ? "The details ACE uses to record your submissions."
                        : "A few details are required before you can access domains and tasks."
                }
            />

            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                <div className="panel p-5 sm:p-6">
                    {!complete && (
                        <div className="border-warning/30 bg-warning/5 mb-6 flex items-center gap-3 rounded-sm border px-4 py-3">
                            <span className="text-warning" aria-hidden="true">
                                ●
                            </span>
                            <p className="text-foreground text-sm">
                                <span className="font-medium">Profile required.</span> Finish the fields below to unlock
                                your domains.{" "}
                                <span className="text-muted-foreground font-mono text-xs">STEP 1 / 2</span>
                            </p>
                        </div>
                    )}
                    <ProfileForm
                        initial={profile}
                        onSaved={() => {
                            if (!complete) navigate(isAdminOrMentor ? "/admin" : "/app/domains");
                        }}
                        submitLabel={complete ? "Save changes" : "Save & continue"}
                    />
                </div>

                <aside className="space-y-6">
                    <div className="panel p-5 sm:p-6">
                        <p className="eyebrow mb-4">Account</p>
                        <div className="flex items-center gap-3">
                            <div className="bg-secondary text-secondary-foreground flex size-10 items-center justify-center rounded-full text-sm font-medium">
                                {(profile.full_name || "AC").slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <p className="text-foreground truncate text-sm font-medium">
                                    {profile.full_name || "-"}
                                </p>
                                <p className="text-muted-foreground truncate text-xs">{profile.email}</p>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                            <Badge
                                variant={
                                    profile.role === "owner"
                                        ? "success"
                                        : profile.role === "admin"
                                          ? "primary"
                                          : profile.role === "mentor"
                                            ? "warning"
                                            : "neutral"
                                }
                            >
                                {ROLE_LABEL[profile.role]}
                            </Badge>
                            {(profile.role === "admin" || profile.role === "mentor" || profile.role === "owner") && (
                                <span className="text-muted-foreground inline-flex items-center gap-1 font-mono text-[0.625rem] tracking-[0.05em] uppercase">
                                    <ShieldCheck className="size-3.5" aria-hidden="true" /> Elevated access
                                </span>
                            )}
                        </div>
                        <dl className="border-border mt-5 space-y-3 border-t pt-4">
                            <div>
                                <dt className="text-muted-foreground font-mono text-[0.625rem] tracking-[0.05em] uppercase">
                                    Phone
                                </dt>
                                <dd className="text-foreground mt-0.5 text-sm">{profile.phone || "-"}</dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground font-mono text-[0.625rem] tracking-[0.05em] uppercase">
                                    Course
                                </dt>
                                <dd className="text-foreground mt-0.5 text-sm">{profile.course || "-"}</dd>
                            </div>
                        </dl>
                    </div>

                    <div className="panel p-5 sm:p-6">
                        <p className="eyebrow mb-2">Member since</p>
                        <p className="text-foreground text-sm">{formatDateTime(profile.created_at)}</p>
                        <div className="text-muted-foreground mt-4 flex items-center gap-2">
                            <UserRound className="size-4" aria-hidden="true" />
                            <span className="text-xs">Details are used only for ACE records.</span>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
