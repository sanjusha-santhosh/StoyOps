import { useQuery } from "@tanstack/react-query";
import {
	Users,
	LogOut,
	BedDouble,
	DollarSign,
	CalendarClock,
	ArrowUpRight,
	ArrowDownRight,
	Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { HotelAPI } from "@/api/hotel";
import { getList } from "@/api/frappe";
import { formatDate, formatCurrency, statusColor } from "@/lib/utils";
import type { Reservation, DashboardStats } from "@/types";
import { useState } from "react";
import { ReservationModal } from "./ReservationModal";

function StatCard({
	title,
	value,
	subtitle,
	icon: Icon,
	trend,
}: {
	title: string;
	value: string | number;
	subtitle?: string;
	icon: React.ElementType;
	trend?: "up" | "down";
}) {
	return (
		<Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow">
			<CardContent className="p-6">
				<div className="flex items-start justify-between">
					<div>
						<p className="text-sm font-medium text-muted-foreground">{title}</p>
						<h3 className="mt-2 text-3xl font-bold tracking-tight text-foreground">{value}</h3>
						{trend && (
							<div className="mt-1 flex items-center gap-1 text-xs font-medium">
								{trend === "up" ? (
									<ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
								) : (
									<ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
								)}
								<span className={trend === "up" ? "text-emerald-600" : "text-rose-600"}>
									{trend === "up" ? "On track" : "Attention"}
								</span>
							</div>
						)}
						{subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
					</div>
					<div className="rounded-xl bg-primary/10 p-3">
						<Icon className="h-6 w-6 text-primary" />
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

export default function Dashboard() {
	const [reservationOpen, setReservationOpen] = useState(false);

	const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
		queryKey: ["dashboard-stats"],
		queryFn: () => HotelAPI.dashboard.getTodayStats(),
	});

	const { data: reservations, isLoading: reservationsLoading } = useQuery<Reservation[]>({
		queryKey: ["recent-reservations"],
		queryFn: () =>
			getList<Reservation>("Reservation", [
				"name",
				"guest_name",
				"status",
				"check_in",
				"check_out",
				"room_type",
				"total_amount",
			]),
	});

	const today = new Date().toISOString().split("T")[0];
	const arrivals = reservations?.filter((r) => r.check_in.startsWith(today) && r.status !== "Cancelled") || [];
	const departures = reservations?.filter((r) => r.check_out.startsWith(today) && r.status !== "Cancelled") || [];

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
					<p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
				</div>
				<Button onClick={() => setReservationOpen(true)} className="gap-2 self-start shadow-sm">
					<Plus className="h-4 w-4" />
					New Reservation
				</Button>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{statsLoading ? (
					<>
						<Skeleton className="h-32" />
						<Skeleton className="h-32" />
						<Skeleton className="h-32" />
						<Skeleton className="h-32" />
					</>
				) : (
					<>
						<StatCard
							title="Arrivals Today"
							value={stats?.arrivals ?? 0}
							subtitle="Expected check-ins"
							icon={Users}
							trend="up"
						/>
						<StatCard
							title="Departures Today"
							value={stats?.departures ?? 0}
							subtitle="Expected check-outs"
							icon={LogOut}
						/>
						<StatCard
							title="Occupancy"
							value={`${stats?.occupied ?? 0} / ${stats?.total_rooms ?? 0}`}
							subtitle={`${stats?.total_rooms ? Math.round((stats.occupied / stats.total_rooms) * 100) : 0}% occupied`}
							icon={BedDouble}
							trend={stats && stats.occupied / stats.total_rooms > 0.5 ? "up" : "down"}
						/>
						<StatCard
							title="Today's Revenue"
							value={formatCurrency(stats?.revenue ?? 0)}
							subtitle="From active reservations"
							icon={DollarSign}
							trend="up"
						/>
					</>
				)}
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				<Card className="border-none shadow-sm">
					<CardHeader>
						<div className="flex items-center gap-2">
							<CalendarClock className="h-5 w-5 text-primary" />
							<CardTitle>Today's Arrivals</CardTitle>
						</div>
					</CardHeader>
					<CardContent>
						{reservationsLoading ? (
							<div className="space-y-2">
								<Skeleton className="h-12" />
								<Skeleton className="h-12" />
							</div>
						) : arrivals.length === 0 ? (
							<p className="py-8 text-center text-sm text-muted-foreground">No arrivals today</p>
						) : (
							<div className="space-y-3">
								{arrivals.slice(0, 5).map((res) => (
									<div key={res.name} className="flex items-center justify-between rounded-lg border p-3">
										<div>
											<p className="font-medium">{res.guest_name}</p>
											<p className="text-xs text-muted-foreground">{res.room_type}</p>
										</div>
										<div className="text-right">
											<Badge className={statusColor(res.status)} variant="outline">
												{res.status}
											</Badge>
											<p className="mt-1 text-xs text-muted-foreground">{formatDate(res.check_in)}</p>
										</div>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				<Card className="border-none shadow-sm">
					<CardHeader>
						<div className="flex items-center gap-2">
							<LogOut className="h-5 w-5 text-primary" />
							<CardTitle>Today's Departures</CardTitle>
						</div>
					</CardHeader>
					<CardContent>
						{reservationsLoading ? (
							<div className="space-y-2">
								<Skeleton className="h-12" />
								<Skeleton className="h-12" />
							</div>
						) : departures.length === 0 ? (
							<p className="py-8 text-center text-sm text-muted-foreground">No departures today</p>
						) : (
							<div className="space-y-3">
								{departures.slice(0, 5).map((res) => (
									<div key={res.name} className="flex items-center justify-between rounded-lg border p-3">
										<div>
											<p className="font-medium">{res.guest_name}</p>
											<p className="text-xs text-muted-foreground">{res.room_type}</p>
										</div>
										<div className="text-right">
											<Badge className={statusColor(res.status)} variant="outline">
												{res.status}
											</Badge>
											<p className="mt-1 text-xs text-muted-foreground">{formatDate(res.check_out)}</p>
										</div>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			<ReservationModal open={reservationOpen} onClose={() => setReservationOpen(false)} />
		</div>
	);
}
