import type { NavSection } from "@/lib/types";
import type { LucideIcon } from "lucide-react";
import {
    LayoutDashboard,
    Layers,
    ShieldCheck,
    User,
    ClipboardCheck,
    UsersRound,
    Eye,
    GraduationCap,
    Send,
    Users,
    MessagesSquare,
    Megaphone,
    HelpCircle,
} from "lucide-react";

export const studentNav: NavSection[] = [
    {
        label: "Student",
        items: [
            { label: "Domains", to: "/app/domains", icon: "layers", end: true },
            { label: "Submissions", to: "/app/submissions", icon: "send" },
            { label: "My Profile", to: "/app/profile", icon: "user" },
        ],
    },
    {
        label: "Info",
        items: [
            { label: "Announcements", to: "/app/announcements", icon: "megaphone" },
            { label: "FAQs", to: "/app/faqs", icon: "help" },
        ],
    },
];

export const adminNav: NavSection[] = [
    {
        label: "Admin",
        items: [
            { label: "Overview", to: "/admin", icon: "dashboard", end: true },
            { label: "Domains", to: "/admin/domains", icon: "layers" },
            { label: "Submissions", to: "/admin/submissions", icon: "clipboard" },
            { label: "Interviews", to: "/admin/interviews", icon: "messages" },
        ],
    },
    {
        label: "Content",
        items: [
            { label: "Announcements", to: "/admin/announcements", icon: "megaphone" },
            { label: "FAQs", to: "/admin/faqs", icon: "help" },
        ],
    },
    {
        label: "Student Portal",
        items: [{ label: "Student Portal", to: "/app/domains", icon: "graduation" }],
    },
    {
        label: "Account",
        items: [{ label: "My Profile", to: "/admin/profile", icon: "user" }],
    },
];

export const ownerNav: NavSection[] = [
    {
        label: "Owner",
        items: [
            { label: "Overview", to: "/admin", icon: "dashboard", end: true },
            { label: "Domains", to: "/admin/domains", icon: "layers" },
            { label: "Submissions", to: "/admin/submissions", icon: "clipboard" },
            { label: "Interviews", to: "/admin/interviews", icon: "messages" },
            { label: "Users", to: "/admin/users", icon: "allusers" },
        ],
    },
    {
        label: "Content",
        items: [
            { label: "Announcements", to: "/admin/announcements", icon: "megaphone" },
            { label: "FAQs", to: "/admin/faqs", icon: "help" },
        ],
    },
    {
        label: "Student Portal",
        items: [{ label: "Student Portal", to: "/app/domains", icon: "graduation" }],
    },
    {
        label: "Account",
        items: [{ label: "My Profile", to: "/admin/profile", icon: "user" }],
    },
];

export const mentorNav: NavSection[] = [
    {
        label: "Mentor",
        items: [
            { label: "Overview", to: "/admin", icon: "dashboard", end: true },
            { label: "Submissions", to: "/admin/submissions", icon: "clipboard" },
            { label: "Interviews", to: "/admin/interviews", icon: "messages" },
        ],
    },
    {
        label: "Student Portal",
        items: [{ label: "Student Portal", to: "/app/domains", icon: "graduation" }],
    },
    {
        label: "Account",
        items: [{ label: "My Profile", to: "/admin/profile", icon: "user" }],
    },
];

export const iconMap: Record<string, LucideIcon> = {
    dashboard: LayoutDashboard,
    layers: Layers,
    messages: MessagesSquare,
    shield: ShieldCheck,
    clipboard: ClipboardCheck,
    users: UsersRound,
    eye: Eye,
    graduation: GraduationCap,
    send: Send,
    allusers: Users,
    user: User,
    megaphone: Megaphone,
    help: HelpCircle,
};

export function labelForPath(pathname: string): string {
    if (pathname.startsWith("/admin")) {
        if (pathname === "/admin" || pathname === "/admin/") return "Overview";
        if (pathname.startsWith("/admin/submissions")) return "Submissions";
        if (pathname.startsWith("/admin/interviews")) return "Interviews";
        if (pathname.startsWith("/admin/domains")) return "Domains";
        if (pathname.startsWith("/admin/users")) return "Users";
        if (pathname.startsWith("/admin/profile")) return "My Profile";
        return "Admin";
    }
    if (pathname.startsWith("/app")) {
        if (pathname.startsWith("/app/domains")) return "Domains";
        if (pathname.startsWith("/app/submissions")) return "My Submissions";
        if (pathname.startsWith("/app/profile")) return "My Profile";
        if (pathname.startsWith("/app/announcements")) return "Announcements";
        if (pathname.startsWith("/app/faqs")) return "FAQs";
        return "Student";
    }
    return "ACE";
}
