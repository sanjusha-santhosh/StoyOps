import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	Wrench,
	Plus,
	Loader2,
	Search,
	Filter,
	Calendar,
	Clock,
	AlertCircle,
	CheckCircle2,
	XCircle,
	Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getList, deleteDoc } from "@/api/frappe";
import { HotelAPI } from "@/api/hotel";
import { cn, formatDate, statusColor } from "@/lib/utils";
import type { Maintenance, Room } from "@/types";

const statusOptions: Maintenance["status"][] = ["Scheduled", "In Progress", "Completed", "Cancelled"];

export default function MaintenancePage() {
	const queryClient = useQueryClient();
	const [search, setSearch] = useState("");
	const [filterStatus, setFilterStatus] = useState<string>("all");
	const [modalOpen, setModalOpen] = useState(false);

	const { data: tasks, isLoading } = useQuery<Maintenance[]>({
		queryKey: ["maintenance"],
		queryFn: () =>
			getList<Maintenance>("Maintenance", [
				"name",
				"room",
				"maintenance_type",
				"start_date",
				"end_date",
				"reason",
				"status",
				"requested_by",
			]),
	});

	const { data: rooms } = useQuery<Room[]>({
		queryKey: ["rooms"],
		queryFn: () => getList<Room>("Room", ["name", "room_number"]),
	});

	const updateStatus = useMutation({
		mutationFn: ({ name, status }: { name: string; status: Maintenance["status"] }) =>
			HotelAPI.operations.updateMaintenanceStatus(name, status),
		onSuccess: () => {
			toast.success("Maintenance status updated");
			queryClient.invalidateQueries({ queryKey: ["maintenance"] });
			queryClient.invalidateQueries({ queryKey: ["rooms"] });
		},
		onError: (err: any) => toast.error(err?.message || "Failed to update status"),
	});

	const createTask = useMutation({
		mutationFn: (data: {
			room: string;
			start_date: string;
			end_date?: string;
			maintenance_type: string;
			reason?: string;
		}) => HotelAPI.operations.createMaintenance(data),
		onSuccess: () => {
			toast.success("Maintenance request created");
			queryClient.invalidateQueries({ queryKey: ["maintenance"] });
			queryClient.invalidateQueries({ queryKey: ["rooms"] });
			setModalOpen(false);
		},
		onError: (err: any) => toast.error(err?.message || "Failed to create request"),
	});

	const deleteTask = useMutation({
		mutationFn: (name: string) => deleteDoc("Maintenance", name),
		onSuccess: () => {
			toast.success("Request deleted");
			queryClient.invalidateQueries({ queryKey: ["maintenance"] });
		},
		onError: (err: any) => toast.error(err?.message || "Failed to delete"),
	});

	const filtered = tasks?.filter((t) => {
		const matchesSearch =
			t.room.toLowerCase().includes(search.toLowerCase()) ||
			(t.maintenance_type || "").toLowerCase().includes(search.toLowerCase()) ||
			(t.reason || "").toLowerCase().includes(search.toLowerCase());
		const matchesStatus = filterStatus === "all" || t.status === filterStatus;
		return matchesSearch && matchesStatus;
	});

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-foreground">Maintenance</h1>
					<p className="text-muted-foreground">Manage room repairs, inspections and downtime.</p>
				</div>
				<Button onClick={() => setModalOpen(true)} className="gap-2 self-start shadow-sm">
					<Plus className="h-4 w-4" />
					New Request
				</Button>
			</div>

			<Card className="border-none shadow-sm">
				<CardContent className="p-4">
					<div className="flex flex-col gap-3 md:flex-row md:items-center">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								placeholder="Search room, type, reason..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="pl-9"
							/>
						</div>
						<div className="flex gap-2">
							<Select value={filterStatus} onValueChange={setFilterStatus}>
								<SelectTrigger className="w-[160px]">
									<Filter className="h-4 w-4 mr-2" />
									<SelectValue placeholder="Status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Statuses</SelectItem>
									{statusOptions.map((s) => (
										<SelectItem key={s} value={s}>
											{s}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardContent>
			</Card>

			{isLoading ? (
				<div className="space-y-3">
					<Skeleton className="h-28" />
					<Skeleton className="h-28" />
					<Skeleton className="h-28" />
				</div>
			) : filtered?.length === 0 ? (
				<Card className="border-none shadow-sm">
					<CardContent className="py-12 text-center text-muted-foreground">
						<Wrench className="mx-auto h-10 w-10 mb-3 text-muted" />
						<p>No maintenance requests found</p>
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-4">
					{filtered?.map((task) => (
						<Card key={task.name} className="border-none shadow-sm overflow-hidden">
							<div className="flex flex-col md:flex-row">
								<div
									className={cn(
										"w-full md:w-1.5 h-1.5 md:h-auto",
										task.status === "Completed" && "bg-emerald-500",
										task.status === "In Progress" && "bg-amber-500",
										task.status === "Scheduled" && "bg-blue-500",
										task.status === "Cancelled" && "bg-slate-400",
									)}
								/>
								<CardContent className="flex-1 p-5">
									<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
										<div>
											<div className="flex items-center gap-2">
												<h3 className="text-lg font-bold">{task.room}</h3>
												<Badge className={cn(statusColor(task.status), "border")} variant="outline">
													{task.status}
												</Badge>
											</div>
											<p className="text-sm text-muted-foreground mt-1">{task.maintenance_type}</p>
											{task.reason && (
												<div className="flex items-start gap-1.5 mt-2 text-sm text-muted-foreground">
													<AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
													{task.reason}
												</div>
											)}
										</div>
										<div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
											<div className="flex items-center gap-1.5">
												<Calendar className="h-4 w-4" />
												{formatDate(task.start_date)}
											</div>
											{task.end_date && (
												<div className="flex items-center gap-1.5">
													<Clock className="h-4 w-4" />
													Until {formatDate(task.end_date)}
												</div>
											)}
										</div>
									</div>
									<div className="mt-4 flex flex-wrap items-center gap-2">
										{statusOptions
											.filter((s) => s !== task.status)
											.map((s) => (
												<Button
													key={s}
													size="sm"
													variant="outline"
													onClick={() => updateStatus.mutate({ name: task.name, status: s })}
													disabled={updateStatus.isPending}
												>
													{s === "Completed" && <CheckCircle2 className="h-3.5 w-3.5 mr-1" />}
													{s === "Cancelled" && <XCircle className="h-3.5 w-3.5 mr-1" />}
													Mark {s}
												</Button>
											))}
										<Button
											variant="ghost"
											size="sm"
											className="text-red-600 hover:text-red-700 hover:bg-red-50"
											onClick={() => {
												if (confirm("Delete this maintenance request?")) deleteTask.mutate(task.name);
											}}
										>
											<Trash2 className="h-3.5 w-3.5 mr-1" />
											Delete
										</Button>
									</div>
								</CardContent>
							</div>
						</Card>
					))}
				</div>
			)}

			<NewMaintenanceDialog
				open={modalOpen}
				onClose={() => setModalOpen(false)}
				onSubmit={(data) => createTask.mutate(data)}
				rooms={rooms || []}
				isPending={createTask.isPending}
			/>
		</div>
	);
}

function NewMaintenanceDialog({
	open,
	onClose,
	onSubmit,
	rooms,
	isPending,
}: {
	open: boolean;
	onClose: () => void;
	onSubmit: (data: {
		room: string;
		start_date: string;
		end_date?: string;
		maintenance_type: string;
		reason?: string;
	}) => void;
	rooms: Room[];
	isPending: boolean;
}) {
	const [room, setRoom] = useState("");
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const [maintenanceType, setMaintenanceType] = useState("Repair");
	const [reason, setReason] = useState("");

	useEffect(() => {
		if (open) {
			setRoom("");
			setStartDate("");
			setEndDate("");
			setMaintenanceType("Repair");
			setReason("");
		}
	}, [open]);

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!room || !startDate) {
			toast.error("Room and start date are required");
			return;
		}
		onSubmit({
			room,
			start_date: startDate,
			end_date: endDate || undefined,
			maintenance_type: maintenanceType,
			reason: reason || undefined,
		});
	}

	return (
		<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>New Maintenance Request</DialogTitle>
					<DialogDescription>Schedule a room out of order for maintenance.</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4 py-2">
					<div className="space-y-2">
						<Label>Room</Label>
						<select
							value={room}
							onChange={(e) => setRoom(e.target.value)}
							className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
							required
						>
							<option value="">Select room</option>
							{rooms.map((r) => (
								<option key={r.name} value={r.name}>
									{r.room_number}
								</option>
							))}
						</select>
					</div>
					<div className="space-y-2">
						<Label>Maintenance Type</Label>
						<select
							value={maintenanceType}
							onChange={(e) => setMaintenanceType(e.target.value)}
							className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
						>
							<option value="Repair">Repair</option>
							<option value="Renovation">Renovation</option>
							<option value="Preventive">Preventive</option>
							<option value="Inspection">Inspection</option>
						</select>
					</div>
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label>Start Date</Label>
							<Input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
						</div>
						<div className="space-y-2">
							<Label>End Date</Label>
							<Input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
						</div>
					</div>
					<div className="space-y-2">
						<Label>Reason</Label>
						<Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Describe the issue..." />
					</div>
					<DialogFooter>
						<Button type="button" variant="outline" onClick={onClose}>
							Cancel
						</Button>
						<Button type="submit" disabled={isPending}>
							{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Request"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
