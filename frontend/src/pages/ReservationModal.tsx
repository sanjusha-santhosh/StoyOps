import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { parseISO } from "date-fns";
import { toast } from "sonner";
import { X, Search, Loader2, Check, CalendarIcon, Moon, Users } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getList } from "@/api/frappe";
import { HotelAPI } from "@/api/hotel";
import { cn, formatCurrency } from "@/lib/utils";
import type { Property, RoomType, RatePlan } from "@/types";

const toLocalISO = (date: Date) => {
	const offset = date.getTimezoneOffset() * 60000;
	return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const schema = z
	.object({
		guest_name: z.string().min(2, "Guest name is required"),
		email: z.string().email("Invalid email").optional().or(z.literal("")),
		phone: z.string().optional(),
		property_name: z.string().min(1, "Property is required"),
		room_type: z.string().min(1, "Room type is required"),
		rate_plan: z.string().optional(),
		check_in: z.date({ message: "Check-in is required" }),
		check_out: z.date({ message: "Check-out is required" }),
		adults: z.number().min(1, "At least 1 adult"),
		children: z.number().min(0),
		special_requests: z.string().optional(),
	})
	.refine((data) => data.check_out > data.check_in, {
		message: "Check-out must be after check-in",
		path: ["check_out"],
	});

type FormData = z.infer<typeof schema>;

interface ReservationModalProps {
	open: boolean;
	onClose: () => void;
	prefill?: Partial<FormData>;
}

export function ReservationModal({ open, onClose, prefill }: ReservationModalProps) {
	const queryClient = useQueryClient();
	const [searched, setSearched] = useState(false);

	const {
		register,
		handleSubmit,
		watch,
		reset,
		control,
		formState: { errors },
	} = useForm<FormData>({
		resolver: zodResolver(schema),
		defaultValues: {
			adults: 1,
			children: 0,
			check_in: undefined,
			check_out: undefined,
		},
	});

	useEffect(() => {
		if (open) {
			reset({
				guest_name: "",
				email: "",
				phone: "",
				property_name: prefill?.property_name || "",
				room_type: prefill?.room_type || "",
				rate_plan: "",
				check_in: prefill?.check_in || undefined,
				check_out: prefill?.check_out || undefined,
				adults: 1,
				children: 0,
				special_requests: "",
			});
			setSearched(false);
		}
	}, [open, prefill, reset]);

	const propertyName = watch("property_name");
	const roomType = watch("room_type");
	const checkIn = watch("check_in");
	const checkOut = watch("check_out");

	const { data: properties } = useQuery<Property[]>({
		queryKey: ["properties"],
		queryFn: () => getList<Property>("Property", ["name", "property_name", "property_code"]),
	});

	const { data: roomTypes } = useQuery<RoomType[]>({
		queryKey: ["room-types"],
		queryFn: () => getList<RoomType>("Room Type", ["name", "room_type_name", "room_type_code", "base_rate", "max_adults", "max_children"]),
	});

	const { data: ratePlans } = useQuery<RatePlan[]>({
		queryKey: ["rate-plans", roomType],
		queryFn: () =>
			getList<RatePlan>("Rate Plan", ["name", "rate_plan_name", "rate", "room_type"], {
				room_type: roomType,
				is_active: 1,
			}),
		enabled: !!roomType,
	});

	const {
		data: availability,
		isLoading: checking,
		refetch,
	} = useQuery({
		queryKey: ["availability", propertyName, roomType, checkIn?.toISOString(), checkOut?.toISOString()],
		queryFn: () =>
			HotelAPI.availability.getAvailabilityCount({
				property_name: propertyName,
				room_type: roomType,
				check_in: checkIn!.toISOString(),
				check_out: checkOut!.toISOString(),
			}),
		enabled: false,
	});

	useEffect(() => {
		setSearched(false);
	}, [propertyName, roomType, checkIn, checkOut]);

	const createReservation = useMutation({
		mutationFn: (data: FormData) =>
			HotelAPI.reservation.create({
				guest_name: data.guest_name,
				email: data.email || undefined,
				phone: data.phone || undefined,
				property_name: data.property_name,
				room_type: data.room_type,
				rate_plan: data.rate_plan || undefined,
				check_in: data.check_in.toISOString(),
				check_out: data.check_out.toISOString(),
				adults: data.adults,
				children: data.children,
				special_requests: data.special_requests,
			}),
		onSuccess: () => {
			toast.success("Reservation created successfully");
			queryClient.invalidateQueries({ queryKey: ["reservations"] });
			queryClient.invalidateQueries({ queryKey: ["recent-reservations"] });
			queryClient.invalidateQueries({ queryKey: ["room-assignments"] });
			onClose();
		},
		onError: (err: any) => {
			toast.error(err?.message || "Failed to create reservation");
		},
	});

	function onCheckAvailability() {
		if (!propertyName || !roomType || !checkIn || !checkOut) {
			toast.error("Please fill property, room type, check-in and check-out");
			return;
		}
		setSearched(true);
		refetch();
	}

	function onSubmit(data: FormData) {
		if (!searched || !availability || !availability[data.room_type]) {
			toast.error("Please check availability first and ensure rooms are available");
			return;
		}
		createReservation.mutate(data);
	}

	const selectedRoomType = roomTypes?.find((rt) => rt.name === roomType);
	const nights = checkIn && checkOut ? Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)) : 0;
	const estimatedTotal = selectedRoomType ? selectedRoomType.base_rate * nights : 0;
	const availableCount = availability?.[roomType] ?? 0;

	return (
		<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
			<DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0 gap-0">
				<DialogHeader className="px-6 pt-6 pb-2">
					<DialogTitle className="text-xl">New Reservation</DialogTitle>
					<DialogDescription>Check availability and create a new booking.</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-5 p-6">
					<div className="grid gap-5 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="guest_name">Guest Name</Label>
							<Input id="guest_name" {...register("guest_name")} placeholder="e.g. John Doe" />
							{errors.guest_name && <p className="text-xs text-red-500">{errors.guest_name.message}</p>}
						</div>
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input id="email" {...register("email")} type="email" placeholder="john@example.com" />
							{errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
						</div>
						<div className="space-y-2">
							<Label htmlFor="phone">Phone</Label>
							<Input id="phone" {...register("phone")} placeholder="+1 234 567 890" />
						</div>
						<div className="space-y-2">
							<Label htmlFor="property">Property</Label>
							<select
								id="property"
								{...register("property_name")}
								className={cn(
									"flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
									errors.property_name && "border-red-500",
								)}
							>
								<option value="">Select property</option>
								{properties?.map((p) => (
									<option key={p.name} value={p.name}>
										{p.property_name}
									</option>
								))}
							</select>
							{errors.property_name && <p className="text-xs text-red-500">{errors.property_name.message}</p>}
						</div>
						<div className="space-y-2">
							<Label htmlFor="room_type">Room Type</Label>
							<select
								id="room_type"
								{...register("room_type")}
								className={cn(
									"flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
									errors.room_type && "border-red-500",
								)}
							>
								<option value="">Select room type</option>
								{roomTypes?.map((rt) => (
									<option key={rt.name} value={rt.name}>
										{rt.room_type_name} ({formatCurrency(rt.base_rate)})
									</option>
								))}
							</select>
							{errors.room_type && <p className="text-xs text-red-500">{errors.room_type.message}</p>}
						</div>
						<div className="space-y-2">
							<Label htmlFor="rate_plan">Rate Plan</Label>
							<select
								id="rate_plan"
								{...register("rate_plan")}
								className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
							>
								<option value="">Default rate</option>
								{ratePlans?.map((rp) => (
									<option key={rp.name} value={rp.name}>
										{rp.rate_plan_name} ({formatCurrency(rp.rate)})
									</option>
								))}
							</select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="check_in">
								<CalendarIcon className="inline h-3.5 w-3.5 mr-1" />
								Check In
							</Label>
							<Controller
								name="check_in"
								control={control}
								render={({ field }) => (
									<Input
										id="check_in"
										type="datetime-local"
										min={toLocalISO(new Date())}
										value={field.value ? toLocalISO(field.value) : ""}
										onChange={(e) => {
											const v = e.target.value;
											field.onChange(v ? parseISO(v) : undefined);
										}}
									/>
								)}
							/>
							{errors.check_in && <p className="text-xs text-red-500">{errors.check_in.message}</p>}
						</div>
						<div className="space-y-2">
							<Label htmlFor="check_out">
								<Moon className="inline h-3.5 w-3.5 mr-1" />
								Check Out
							</Label>
							<Controller
								name="check_out"
								control={control}
								render={({ field }) => (
									<Input
										id="check_out"
										type="datetime-local"
										min={checkIn ? toLocalISO(checkIn) : toLocalISO(new Date())}
										value={field.value ? toLocalISO(field.value) : ""}
										onChange={(e) => {
											const v = e.target.value;
											field.onChange(v ? parseISO(v) : undefined);
										}}
									/>
								)}
							/>
							{errors.check_out && <p className="text-xs text-red-500">{errors.check_out.message}</p>}
						</div>
						<div className="space-y-2">
							<Label htmlFor="adults">
								<Users className="inline h-3.5 w-3.5 mr-1" />
								Adults
							</Label>
							<Input id="adults" {...register("adults", { valueAsNumber: true })} type="number" min={1} />
							{errors.adults && <p className="text-xs text-red-500">{errors.adults.message}</p>}
						</div>
						<div className="space-y-2">
							<Label htmlFor="children">Children</Label>
							<Input id="children" {...register("children", { valueAsNumber: true })} type="number" min={0} />
							{errors.children && <p className="text-xs text-red-500">{errors.children.message}</p>}
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="special_requests">Special Requests</Label>
						<Input id="special_requests" {...register("special_requests")} placeholder="Any special requests..." />
					</div>

					<Separator />

					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<Button type="button" variant="outline" onClick={onCheckAvailability} disabled={checking} className="gap-2">
							{checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
							Check Availability
						</Button>
						{nights > 0 && selectedRoomType && (
							<p className="text-sm text-muted-foreground">
								{selectedRoomType.room_type_name} × {nights} night(s) ≈ <strong>{formatCurrency(estimatedTotal)}</strong>
							</p>
						)}
					</div>

					{searched && !checking && (
						<Card
							className={cn(
								"p-4 border-l-4",
								availableCount > 0
									? "border-emerald-500 bg-emerald-50/50"
									: "border-red-500 bg-red-50/50",
							)}
						>
							<div className="flex items-center gap-3">
								{availableCount > 0 ? (
									<div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
										<Check className="h-5 w-5 text-emerald-600" />
									</div>
								) : (
									<div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
										<X className="h-5 w-5 text-red-600" />
									</div>
								)}
								<div>
									<p className={cn("font-semibold", availableCount > 0 ? "text-emerald-800" : "text-red-800")}>
										{availableCount > 0 ? `${availableCount} room(s) available` : "No rooms available for selected dates"}
									</p>
									<p className="text-sm text-muted-foreground">
										{availableCount > 0 ? "You can create the reservation now." : "Try different dates or room type."}
									</p>
								</div>
							</div>
						</Card>
					)}

					<DialogFooter className="gap-2 sm:gap-0">
						<Button type="button" variant="outline" onClick={onClose}>
							Cancel
						</Button>
						<Button type="submit" disabled={createReservation.isPending || !searched}>
							{createReservation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Reservation"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
