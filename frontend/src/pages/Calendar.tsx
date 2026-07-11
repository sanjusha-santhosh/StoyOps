import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import FullCalendar from "@fullcalendar/react";
import resourceTimelinePlugin from "@fullcalendar/resource-timeline";
import interactionPlugin from "@fullcalendar/interaction";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { getList } from "@/api/frappe";
import { HotelAPI } from "@/api/hotel";
import { cn, statusColor } from "@/lib/utils";
import type { Room, RoomAssignment } from "@/types";
import { ReservationModal } from "./ReservationModal";

export default function Calendar() {
	const [modalOpen, setModalOpen] = useState(false);
	const [prefill, setPrefill] = useState<Record<string, any> | undefined>();

	const { data: rooms, isLoading: roomsLoading } = useQuery<Room[]>({
		queryKey: ["rooms"],
		queryFn: () => getList<Room>("Room", ["name", "room_number", "room_type", "property", "operational_status"]),
	});

	const { data: assignments, isLoading: assignmentsLoading } = useQuery<RoomAssignment[]>({
		queryKey: ["room-assignments"],
		queryFn: () => HotelAPI.availability.getRoomAssignments(),
	});

	const resources = useMemo(
		() =>
			rooms?.map((room) => ({
				id: room.name,
				title: `${room.room_number}`,
				type: room.room_type,
				status: room.operational_status,
			})) || [],
		[rooms],
	);

	const events = useMemo(
		() =>
			assignments?.map((a) => ({
				id: a.name,
				resourceId: a.room,
				title: a.guest_name || "Guest",
				start: a.check_in,
				end: a.check_out,
				backgroundColor: a.reservation_status === "Checked In" ? "#10b981" : "#3b82f6",
				borderColor: "transparent",
				textColor: "#ffffff",
				extendedProps: { assignment: a },
			})) || [],
		[assignments],
	);

	const isLoading = roomsLoading || assignmentsLoading;

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-foreground">Room Calendar</h1>
					<p className="text-muted-foreground">Visualize occupancy and reservations by room.</p>
				</div>
				<div className="flex gap-2">
					<Badge className={cn(statusColor("Confirmed"), "border")} variant="outline">
						Confirmed
					</Badge>
					<Badge className={cn(statusColor("Checked In"), "border")} variant="outline">
						Checked In
					</Badge>
				</div>
			</div>

			<Card className="border-none shadow-sm">
				<CardHeader>
					<CardTitle>Timeline</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<Skeleton className="h-[500px]" />
					) : (
						<FullCalendar
							plugins={[resourceTimelinePlugin, interactionPlugin]}
							initialView="resourceTimelineWeek"
							resources={resources}
							events={events}
							headerToolbar={{
								left: "today prev,next",
								center: "title",
								right: "resourceTimelineDay,resourceTimelineWeek,resourceTimelineMonth",
							}}
							resourceLabelContent={(arg) => (
								<div className="text-left">
									<p className="font-medium text-sm">{arg.resource.title}</p>
									<p className="text-xs text-muted-foreground">{arg.resource.extendedProps.type}</p>
								</div>
							)}
							height={600}
							slotMinWidth={60}
							dateClick={(info) => {
								setPrefill({
									check_in: info.date,
								});
								setModalOpen(true);
							}}
							eventClick={(info) => {
								const assignment = info.event.extendedProps.assignment as RoomAssignment;
								setPrefill({
									property_name: "",
									room_type: assignment.room_type,
									check_in: new Date(assignment.check_in),
									check_out: new Date(assignment.check_out),
								});
								setModalOpen(true);
							}}
						/>
					)}
				</CardContent>
			</Card>

			<ReservationModal open={modalOpen} onClose={() => setModalOpen(false)} prefill={prefill} />
		</div>
	);
}
