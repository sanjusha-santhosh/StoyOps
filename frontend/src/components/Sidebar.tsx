import { Link, useLocation } from "@tanstack/react-router";
import {
	LayoutDashboard,
	CalendarDays,
	BookOpen,
	BedDouble,
	Sparkles,
	Wrench,
	Settings,
	Hotel,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
	{ id: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
	{ id: "reservations", label: "Reservations", href: "/reservations", icon: BookOpen },
	{ id: "calendar", label: "Calendar", href: "/calendar", icon: CalendarDays },
	{ id: "rooms", label: "Rooms", href: "/rooms", icon: BedDouble },
	{ id: "housekeeping", label: "Housekeeping", href: "/housekeeping", icon: Sparkles },
	{ id: "maintenance", label: "Maintenance", href: "/maintenance", icon: Wrench },
	{ id: "settings", label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
	const location = useLocation();

	return (
		<div className="flex h-full flex-col border-r bg-white">
			<div className="flex h-16 items-center gap-3 border-b px-6">
				<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
					<Hotel className="h-5 w-5" />
				</div>
				<div>
					<h1 className="text-base font-bold leading-tight text-foreground">Hotel Frontdesk</h1>
					<p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">PMS</p>
				</div>
			</div>
			<nav className="flex-1 space-y-1 p-4 overflow-y-auto">
				{navItems.map((item) => {
					const Icon = item.icon;
					const active = location.pathname === item.href || location.pathname.startsWith(item.href + "/");
					return (
						<Link
							key={item.id}
							to={item.href}
							className={cn(
								"flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
								active
									? "bg-primary/10 text-primary shadow-sm"
									: "text-muted-foreground hover:bg-muted hover:text-foreground",
							)}
							onClick={onNavigate}
						>
							<Icon className="h-4 w-4" />
							{item.label}
						</Link>
					);
				})}
			</nav>
			<div className="border-t p-4">
				<div className="rounded-lg bg-muted/50 p-3">
					<p className="text-xs text-muted-foreground">Logged in as</p>
					<p className="text-sm font-medium truncate">{(window as any).frappe_user || "User"}</p>
				</div>
			</div>
		</div>
	);
}
