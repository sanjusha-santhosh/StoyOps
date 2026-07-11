import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, MoreHorizontal, LogIn, LogOut, CheckCircle, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { getList, deleteDoc } from "@/api/frappe";
import { HotelAPI } from "@/api/hotel";
import { cn, formatDate, formatCurrency, statusColor } from "@/lib/utils";
import type { Reservation } from "@/types";
import { ReservationModal } from "./ReservationModal";

export default function Reservations() {
	const queryClient = useQueryClient();
	const [search, setSearch] = useState("");
	const [modalOpen, setModalOpen] = useState(false);

	const { data: reservations, isLoading } = useQuery<Reservation[]>({
		queryKey: ["reservations"],
		queryFn: () =>
			getList<Reservation>("Reservation", [
				"name",
				"guest_name",
				"email",
				"phone",
				"status",
				"check_in",
				"check_out",
				"room_type",
				"total_amount",
				"sales_order",
				"sales_invoice",
			]),
	});

	const confirmMutation = useMutation({
		mutationFn: HotelAPI.reservation.confirm,
		onSuccess: () => {
			toast.success("Reservation confirmed");
			queryClient.invalidateQueries({ queryKey: ["reservations"] });
		},
		onError: (err: any) => toast.error(err?.message || "Failed to confirm"),
	});

	const checkInMutation = useMutation({
		mutationFn: HotelAPI.reservation.checkIn,
		onSuccess: () => {
			toast.success("Guest checked in");
			queryClient.invalidateQueries({ queryKey: ["reservations"] });
			queryClient.invalidateQueries({ queryKey: ["room-assignments"] });
		},
		onError: (err: any) => toast.error(err?.message || "Failed to check in"),
	});

	const checkOutMutation = useMutation({
		mutationFn: HotelAPI.reservation.checkOut,
		onSuccess: () => {
			toast.success("Guest checked out");
			queryClient.invalidateQueries({ queryKey: ["reservations"] });
			queryClient.invalidateQueries({ queryKey: ["room-assignments"] });
		},
		onError: (err: any) => toast.error(err?.message || "Failed to check out"),
	});

	const invoiceMutation = useMutation({
		mutationFn: HotelAPI.reservation.createInvoice,
		onSuccess: () => {
			toast.success("Invoice created");
			queryClient.invalidateQueries({ queryKey: ["reservations"] });
		},
		onError: (err: any) => toast.error(err?.message || "Failed to create invoice"),
	});

	const deleteMutation = useMutation({
		mutationFn: (name: string) => deleteDoc("Reservation", name),
		onSuccess: () => {
			toast.success("Reservation deleted");
			queryClient.invalidateQueries({ queryKey: ["reservations"] });
		},
		onError: (err: any) => toast.error(err?.message || "Failed to delete"),
	});

	const filtered = reservations?.filter(
		(r) =>
			r.guest_name.toLowerCase().includes(search.toLowerCase()) ||
			r.name.toLowerCase().includes(search.toLowerCase()) ||
			(r.room_type || "").toLowerCase().includes(search.toLowerCase()),
	);

	function actionAllowed(status: string, action: string) {
		if (action === "confirm") return status === "Draft";
		if (action === "checkin") return status === "Confirmed";
		if (action === "checkout") return status === "Checked In";
		if (action === "invoice") return ["Confirmed", "Checked In", "Checked Out"].includes(status);
		return true;
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-foreground">Reservations</h1>
					<p className="text-muted-foreground">Manage bookings, check-ins, and billing.</p>
				</div>
				<Button onClick={() => setModalOpen(true)} className="gap-2 self-start shadow-sm">
					<Plus className="h-4 w-4" />
					New Reservation
				</Button>
			</div>

			<Card className="border-none shadow-sm">
				<CardHeader className="pb-3">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<CardTitle>All Reservations</CardTitle>
						<div className="relative max-w-xs">
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								placeholder="Search guest, ID, room type..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="pl-9"
							/>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="space-y-2">
							<Skeleton className="h-10" />
							<Skeleton className="h-10" />
							<Skeleton className="h-10" />
						</div>
					) : (
						<div className="overflow-x-auto rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Guest</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Room Type</TableHead>
										<TableHead>Check In</TableHead>
										<TableHead>Check Out</TableHead>
										<TableHead>Total</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filtered?.length === 0 ? (
										<TableRow>
											<TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
												No reservations found
											</TableCell>
										</TableRow>
									) : (
										filtered?.map((res) => (
											<TableRow key={res.name}>
												<TableCell>
													<div>
														<p className="font-medium">{res.guest_name}</p>
														<p className="text-xs text-muted-foreground">{res.name}</p>
													</div>
												</TableCell>
												<TableCell>
													<Badge className={cn(statusColor(res.status), "border")} variant="outline">
														{res.status}
													</Badge>
												</TableCell>
												<TableCell>{res.room_type}</TableCell>
												<TableCell>{formatDate(res.check_in)}</TableCell>
												<TableCell>{formatDate(res.check_out)}</TableCell>
												<TableCell>{formatCurrency(res.total_amount)}</TableCell>
												<TableCell className="text-right">
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button variant="ghost" size="icon">
																<MoreHorizontal className="h-4 w-4" />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end">
															{actionAllowed(res.status, "confirm") && (
																<DropdownMenuItem
																	onClick={() => confirmMutation.mutate(res.name)}
																	disabled={confirmMutation.isPending}
																>
																	<CheckCircle className="mr-2 h-4 w-4" />
																	Confirm
																</DropdownMenuItem>
															)}
															{actionAllowed(res.status, "checkin") && (
																<DropdownMenuItem
																	onClick={() => checkInMutation.mutate({ reservation_name: res.name })}
																	disabled={checkInMutation.isPending}
																>
																	<LogIn className="mr-2 h-4 w-4" />
																	Check In
																</DropdownMenuItem>
															)}
															{actionAllowed(res.status, "checkout") && (
																<DropdownMenuItem
																	onClick={() => checkOutMutation.mutate({ reservation_name: res.name })}
																	disabled={checkOutMutation.isPending}
																>
																	<LogOut className="mr-2 h-4 w-4" />
																	Check Out
																</DropdownMenuItem>
															)}
															{actionAllowed(res.status, "invoice") && !res.sales_invoice && (
																<DropdownMenuItem
																	onClick={() => invoiceMutation.mutate(res.name)}
																	disabled={invoiceMutation.isPending}
																>
																	<FileText className="mr-2 h-4 w-4" />
																	Create Invoice
																</DropdownMenuItem>
															)}
															<DropdownMenuItem
																onClick={() => {
																	if (confirm("Delete this reservation?")) deleteMutation.mutate(res.name);
																}}
																className="text-red-600 focus:text-red-600"
															>
																<Trash2 className="mr-2 h-4 w-4" />
																Delete
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			<ReservationModal open={modalOpen} onClose={() => setModalOpen(false)} />
		</div>
	);
}
