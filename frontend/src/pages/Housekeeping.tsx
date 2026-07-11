import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	Sparkles,
	Plus,
	Loader2,
	Calendar,
	User,
	Clock,
	Search,
	Filter,
	CheckCircle2,
	Play,
	Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { cn, formatDateOnly, statusColor } from "@/lib/utils";
import type { Housekeeping, Room } from "@/types";

const statusOrder: Housekeeping["status"][] = ["Scheduled", "In Progress", "Cleaned", "Verified"];

export default function HousekeepingPage() {
	const queryClient = useQueryClient();
	const [search, setSearch] = useState("");
	const [filterStatus, setFilterStatus] = useState<string>("all");
	const [modalOpen, setModalOpen] = useState(false);

	const { data: tasks, isLoading } = useQuery<Housekeeping[]>({
		queryKey: ["housekeeping"],
		queryFn: () =>
			getList<Housekeeping>("Housekeeping", [
				"name",
				"room",
				"scheduled_date",
				"task_type",
				"status",
				"assigned_to",
				"started_at",
				"completed_at",
				"notes",
			]),
	});

	const { data: rooms } = useQuery<Room[]>({
		queryKey: ["rooms"],
		queryFn: () => getList<Room>("Room", ["name", "room_number"]),
	});

	const updateStatus = useMutation({
		mutationFn: ({ name, status }: { name: string; status: Housekeeping["status"] }) =>
			HotelAPI.operations.updateHousekeepingStatus(name, status),
		onSuccess: () => {
			toast.success("Task status updated");
			queryClient.invalidateQueries({ queryKey: ["housekeeping"] });
		},
		onError: (err: any) => toast.error(err?.message || "Failed to update status"),
	});

	const createTask = useMutation({
		mutationFn: (data: { room: string; scheduled_date: string; task_type: string; assigned_to?: string; notes?: string }) =>
			HotelAPI.operations.createHousekeeping(data),
		onSuccess: () => {
			toast.success("Housekeeping task created");
			queryClient.invalidateQueries({ queryKey: ["housekeeping"] });
			setModalOpen(false);
		},
		onError: (err: any) => toast.error(err?.message || "Failed to create task"),
	});

	const deleteTask = useMutation({
		mutationFn: (name: string) => deleteDoc("Housekeeping", name),
		onSuccess: () => {
			toast.success("Task deleted");
			queryClient.invalidateQueries({ queryKey: ["housekeeping"] });
		},
		onError: (err: any) => toast.error(err?.message || "Failed to delete"),
	});

	const filtered = tasks?.filter((t) => {
		const matchesSearch =
			t.room.toLowerCase().includes(search.toLowerCase()) ||
			(t.task_type || "").toLowerCase().includes(search.toLowerCase()) ||
			(t.assigned_to || "").toLowerCase().includes(search.toLowerCase());
		const matchesStatus = filterStatus === "all" || t.status === filterStatus;
		return matchesSearch && matchesStatus;
	});

	function nextStatus(current: Housekeeping["status"]): Housekeeping["status"] | null {
		const idx = statusOrder.indexOf(current);
		if (idx < statusOrder.length - 1) return statusOrder[idx + 1];
		return null;
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-foreground">Housekeeping</h1>
					<p className="text-muted-foreground">Track cleaning tasks and room readiness.</p>
				</div>
				<Button onClick={() => setModalOpen(true)} className="gap-2 self-start shadow-sm">
					<Plus className="h-4 w-4" />
					New Task
				</Button>
			</div>

			<Card className="border-none shadow-sm">
				<CardContent className="p-4">
					<div className="flex flex-col gap-3 md:flex-row md:items-center">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								placeholder="Search room, task type, assignee..."
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
									{statusOrder.map((s) => (
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
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={i} className="h-96" />
					))}
				</div>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{statusOrder.map((status) => {
						const columnTasks = filtered?.filter((t) => t.status === status) || [];
						return (
							<Card key={status} className="border-none shadow-sm bg-muted/30">
								<CardHeader className="pb-3">
									<div className="flex items-center justify-between">
										<CardTitle className="text-sm font-semibold">{status}</CardTitle>
										<Badge className={cn(statusColor(status), "border")} variant="outline">
											{columnTasks.length}
										</Badge>
									</div>
								</CardHeader>
								<CardContent className="space-y-3">
									{columnTasks.length === 0 ? (
										<p className="text-center py-6 text-xs text-muted-foreground">No tasks</p>
									) : (
										columnTasks.map((task) => (
											<div
												key={task.name}
												className="rounded-lg border bg-white p-3 shadow-sm hover:shadow-md transition-shadow"
											>
												<div className="flex items-start justify-between gap-2">
													<div>
														<p className="font-semibold text-sm">{task.room}</p>
														<p className="text-xs text-muted-foreground">{task.task_type}</p>
													</div>
													<Button
														variant="ghost"
														size="icon"
														className="h-7 w-7 text-muted-foreground hover:text-red-600"
														onClick={() => {
															if (confirm("Delete this task?")) deleteTask.mutate(task.name);
														}}
													>
														<Trash2 className="h-3.5 w-3.5" />
													</Button>
												</div>
												<div className="mt-3 space-y-1 text-xs text-muted-foreground">
													<div className="flex items-center gap-1.5">
														<Calendar className="h-3.5 w-3.5" />
														{formatDateOnly(task.scheduled_date)}
													</div>
													{task.assigned_to && (
														<div className="flex items-center gap-1.5">
															<User className="h-3.5 w-3.5" />
															{task.assigned_to}
														</div>
													)}
													{task.started_at && (
														<div className="flex items-center gap-1.5">
															<Clock className="h-3.5 w-3.5" />
															Started {formatDateOnly(task.started_at)}
														</div>
													)}
												</div>
												{nextStatus(task.status) && (
													<Button
														size="sm"
														className="mt-3 w-full gap-1 text-xs"
														onClick={() =>
															updateStatus.mutate({ name: task.name, status: nextStatus(task.status)! })
														}
														disabled={updateStatus.isPending}
													>
														{task.status === "Scheduled" && <Play className="h-3.5 w-3.5" />}
														{task.status === "In Progress" && <Sparkles className="h-3.5 w-3.5" />}
														{task.status === "Cleaned" && <CheckCircle2 className="h-3.5 w-3.5" />}
														Move to {nextStatus(task.status)}
													</Button>
												)}
											</div>
										))
									)}
								</CardContent>
							</Card>
						);
					})}
				</div>
			)}

			<NewTaskDialog
				open={modalOpen}
				onClose={() => setModalOpen(false)}
				onSubmit={(data) => createTask.mutate(data)}
				rooms={rooms || []}
				isPending={createTask.isPending}
			/>
		</div>
	);
}

function NewTaskDialog({
	open,
	onClose,
	onSubmit,
	rooms,
	isPending,
}: {
	open: boolean;
	onClose: () => void;
	onSubmit: (data: { room: string; scheduled_date: string; task_type: string; assigned_to?: string; notes?: string }) => void;
	rooms: Room[];
	isPending: boolean;
}) {
	const [room, setRoom] = useState("");
	const [scheduledDate, setScheduledDate] = useState("");
	const [taskType, setTaskType] = useState("Cleaning");
	const [assignedTo, setAssignedTo] = useState("");
	const [notes, setNotes] = useState("");

	useEffect(() => {
		if (open) {
			setRoom("");
			setScheduledDate("");
			setTaskType("Cleaning");
			setAssignedTo("");
			setNotes("");
		}
	}, [open]);

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!room || !scheduledDate) {
			toast.error("Room and scheduled date are required");
			return;
		}
		onSubmit({ room, scheduled_date: scheduledDate, task_type: taskType, assigned_to: assignedTo || undefined, notes });
	}

	return (
		<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>New Housekeeping Task</DialogTitle>
					<DialogDescription>Schedule a cleaning or inspection task.</DialogDescription>
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
						<Label>Scheduled Date</Label>
						<Input
							type="date"
							value={scheduledDate}
							onChange={(e) => setScheduledDate(e.target.value)}
							required
						/>
					</div>
					<div className="space-y-2">
						<Label>Task Type</Label>
						<select
							value={taskType}
							onChange={(e) => setTaskType(e.target.value)}
							className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
						>
							<option value="Cleaning">Cleaning</option>
							<option value="Turndown">Turndown</option>
							<option value="Deep Clean">Deep Clean</option>
							<option value="Inspection">Inspection</option>
						</select>
					</div>
					<div className="space-y-2">
						<Label>Assigned To (User ID)</Label>
						<Input value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="e.g. housekeeper@hotel.com" />
					</div>
					<div className="space-y-2">
						<Label>Notes</Label>
						<Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes..." />
					</div>
					<DialogFooter>
						<Button type="button" variant="outline" onClick={onClose}>
							Cancel
						</Button>
						<Button type="submit" disabled={isPending}>
							{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Task"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
