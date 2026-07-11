import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BedDouble, Filter, Sparkles, Wrench, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getList } from "@/api/frappe";
import { HotelAPI } from "@/api/hotel";
import { cn, statusColor } from "@/lib/utils";
import type { Room, Property, RoomType } from "@/types";

const statusOptions = ["Clean", "Dirty", "Inspection", "Maintenance"];

export default function Rooms() {
	const queryClient = useQueryClient();
	const [search, setSearch] = useState("");
	const [propertyFilter, setPropertyFilter] = useState<string>("all");
	const [typeFilter, setTypeFilter] = useState<string>("all");

	const { data: rooms, isLoading } = useQuery<Room[]>({
		queryKey: ["rooms"],
		queryFn: () => getList<Room>("Room", ["name", "room_number", "room_type", "property", "operational_status"]),
	});

	const { data: properties } = useQuery<Property[]>({
		queryKey: ["properties"],
		queryFn: () => getList<Property>("Property", ["name", "property_name"]),
	});

	const { data: roomTypes } = useQuery<RoomType[]>({
		queryKey: ["room-types"],
		queryFn: () => getList<RoomType>("Room Type", ["name", "room_type_name"]),
	});

	const updateStatus = useMutation({
		mutationFn: ({ room, status }: { room: string; status: string }) =>
			HotelAPI.operations.updateRoomStatus(room, status),
		onSuccess: () => {
			toast.success("Room status updated");
			queryClient.invalidateQueries({ queryKey: ["rooms"] });
		},
		onError: (err: any) => toast.error(err?.message || "Failed to update"),
	});

	const filtered = rooms?.filter((room) => {
		const matchesSearch =
			room.room_number.toLowerCase().includes(search.toLowerCase()) ||
			(room.room_type || "").toLowerCase().includes(search.toLowerCase());
		const matchesProperty = propertyFilter === "all" || room.property === propertyFilter;
		const matchesType = typeFilter === "all" || room.room_type === typeFilter;
		return matchesSearch && matchesProperty && matchesType;
	});

	const statusIcon = (status: string) => {
		switch (status) {
			case "Clean":
				return <Sparkles className="h-4 w-4" />;
			case "Dirty":
				return <BedDouble className="h-4 w-4" />;
			case "Inspection":
				return <ClipboardCheck className="h-4 w-4" />;
			case "Maintenance":
				return <Wrench className="h-4 w-4" />;
			default:
				return null;
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-foreground">Rooms</h1>
					<p className="text-muted-foreground">Manage room inventory and operational status.</p>
				</div>
			</div>

			<Card className="border-none shadow-sm">
				<CardContent className="p-4">
					<div className="flex flex-col gap-3 md:flex-row md:items-center">
						<div className="relative flex-1">
							<Input
								placeholder="Search room number or type..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
							/>
						</div>
						<div className="flex gap-2">
							<Select value={propertyFilter} onValueChange={setPropertyFilter}>
								<SelectTrigger className="w-[160px]">
									<Filter className="h-4 w-4 mr-2" />
									<SelectValue placeholder="Property" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Properties</SelectItem>
									{properties?.map((p) => (
										<SelectItem key={p.name} value={p.name}>
											{p.property_name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Select value={typeFilter} onValueChange={setTypeFilter}>
								<SelectTrigger className="w-[160px]">
									<Filter className="h-4 w-4 mr-2" />
									<SelectValue placeholder="Room Type" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Types</SelectItem>
									{roomTypes?.map((rt) => (
										<SelectItem key={rt.name} value={rt.name}>
											{rt.room_type_name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardContent>
			</Card>

			{isLoading ? (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{Array.from({ length: 8 }).map((_, i) => (
						<Skeleton key={i} className="h-40" />
					))}
				</div>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{filtered?.map((room) => (
						<Card
							key={room.name}
							className="border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden"
						>
							<div className="h-2 bg-primary/10" />
							<CardContent className="p-5 space-y-4">
								<div className="flex items-start justify-between">
									<div>
										<h3 className="text-xl font-bold">{room.room_number}</h3>
										<p className="text-sm text-muted-foreground">{room.room_type}</p>
									</div>
									<Badge className={cn(statusColor(room.operational_status), "border")} variant="outline">
										{statusIcon(room.operational_status)}
										<span className="ml-1">{room.operational_status}</span>
									</Badge>
								</div>
								<div className="flex flex-wrap gap-2">
									{statusOptions.map((status) => (
										<Button
											key={status}
											size="sm"
											variant={room.operational_status === status ? "default" : "outline"}
											onClick={() => updateStatus.mutate({ room: room.name, status })}
											disabled={updateStatus.isPending}
											className="text-xs"
										>
											{status}
										</Button>
									))}
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
