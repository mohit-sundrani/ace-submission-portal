import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { RequireStaff } from "@/components/auth/RequireStaff";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { RequireOwner } from "@/components/auth/RequireOwner";
import { RequireProfile } from "@/components/auth/RequireProfile";
import { LoginPage } from "@/pages/auth/LoginPage";
import { useAuth } from "@/context/AuthContext";
import { isProfileComplete } from "@/components/auth/RequireProfile";
import { ProfilePage } from "@/pages/student/ProfilePage";
import { DomainsPage } from "@/pages/student/DomainsPage";
import { DomainTasksPage } from "@/pages/student/DomainTasksPage";
import { TaskDetailPage } from "@/pages/student/TaskDetailPage";
import { SubmissionsPage } from "@/pages/student/SubmissionsPage";
import { AdminOverview } from "@/pages/admin/AdminOverview";
import { AdminDomains } from "@/pages/admin/AdminDomains";
import { AdminTasks } from "@/pages/admin/AdminTasks";
import { AdminSubmissions } from "@/pages/admin/AdminSubmissions";
import { AdminInterviews } from "@/pages/admin/AdminInterviews";
import { AdminUsers } from "@/pages/admin/AdminUsers";
import { NotFoundPage } from "@/pages/NotFound";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

function RootRedirect() {
    const { session, profile, loading } = useAuth();
    if (loading) return null;
    if (!session) return <Navigate to="/login" replace />;
    if (profile?.role === "admin" || profile?.role === "mentor" || profile?.role === "owner")
        return <Navigate to="/admin" replace />;
    if (profile && !isProfileComplete(profile)) return <Navigate to="/app/profile" replace />;
    return <Navigate to="/app/domains" replace />;
}

export default function App() {
    return (
        <>
            <Analytics />
            <SpeedInsights />
            <Routes>
                <Route path="/" element={<RootRedirect />} />
                <Route path="/login" element={<LoginPage />} />

                <Route element={<RequireAuth />}>
                    <Route path="/app" element={<AppShell />}>
                        <Route index element={<Navigate to="/app/domains" replace />} />
                        <Route path="profile" element={<ProfilePage />} />
                        <Route element={<RequireProfile />}>
                            <Route path="domains" element={<DomainsPage />} />
                            <Route path="domains/:domainId" element={<DomainTasksPage />} />
                            <Route path="domains/:domainId/tasks/:taskId" element={<TaskDetailPage />} />
                            <Route path="submissions" element={<SubmissionsPage />} />
                        </Route>
                    </Route>
                </Route>

                <Route element={<RequireAuth />}>
                    <Route element={<RequireStaff />}>
                        <Route path="/admin" element={<AppShell />}>
                            <Route index element={<AdminOverview />} />
                            <Route path="profile" element={<ProfilePage />} />
                            <Route path="submissions" element={<AdminSubmissions />} />
                            <Route path="interviews" element={<AdminInterviews />} />
                            <Route element={<RequireAdmin />}>
                                <Route path="domains" element={<AdminDomains />} />
                                <Route path="domains/:domainId" element={<AdminTasks />} />
                            </Route>
                            <Route element={<RequireOwner />}>
                                <Route path="users" element={<AdminUsers />} />
                            </Route>
                        </Route>
                    </Route>
                </Route>

                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </>
    );
}
