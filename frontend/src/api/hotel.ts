import { callMethod } from "./frappe";

export const HotelAPI = {
	dashboard: {
		getTodayStats: (property_name?: string) =>
			callMethod("stayops.api.dashboard.get_today_stats", { property_name }),
	},
	availability: {
		getAvailableRooms: (args: {
			check_in: string;
			check_out: string;
			property_name?: string;
			room_type?: string;
		}) => callMethod("stayops.api.availability.get_available_rooms", args),
		getAvailabilityCount: (args: {
			check_in: string;
			check_out: string;
			property_name?: string;
			room_type?: string;
		}) => callMethod("stayops.api.availability.get_availability_count", args),
		getRoomAssignments: (args?: { property_name?: string; start_date?: string; end_date?: string }) =>
			callMethod("stayops.api.availability.get_room_assignments", args || {}),
	},
	reservation: {
		create: (args: {
			guest_name: string;
			email?: string;
			phone?: string;
			property_name: string;
			room_type: string;
			check_in: string;
			check_out: string;
			adults?: number;
			children?: number;
			rate_plan?: string;
			special_requests?: string;
		}) => callMethod("stayops.api.reservation.create_reservation", args),
		confirm: (reservation_name: string) =>
			callMethod("stayops.api.reservation.confirm_reservation", { reservation_name }),
		checkIn: (args: { reservation_name: string; room?: string; check_in_time?: string }) =>
			callMethod("stayops.api.reservation.check_in_reservation", args),
		checkOut: (args: { reservation_name: string; room?: string; check_out_time?: string }) =>
			callMethod("stayops.api.reservation.check_out_reservation", args),
		createInvoice: (reservation_name: string) =>
			callMethod("stayops.api.reservation.create_sales_invoice_from_reservation", {
				reservation_name,
			}),
	},
	operations: {
		createHousekeeping: (args: {
			room: string;
			scheduled_date: string;
			task_type?: string;
			assigned_to?: string;
			notes?: string;
		}) => callMethod("stayops.api.operations.create_housekeeping_task", args),
		updateHousekeepingStatus: (name: string, status: string) =>
			callMethod("stayops.api.operations.update_housekeeping_status", { name, status }),
		createMaintenance: (args: {
			room: string;
			start_date: string;
			maintenance_type?: string;
			end_date?: string;
			reason?: string;
		}) => callMethod("stayops.api.operations.create_maintenance", args),
		updateMaintenanceStatus: (name: string, status: string) =>
			callMethod("stayops.api.operations.update_maintenance_status", { name, status }),
		createRoomMove: (args: {
			reservation_name: string;
			from_room: string;
			to_room: string;
			move_time?: string;
			reason?: string;
		}) => callMethod("stayops.api.operations.create_room_move", args),
		updateRoomStatus: (room: string, operational_status: string) =>
			callMethod("stayops.api.operations.update_room_operational_status", {
				room,
				operational_status,
			}),
	},
};
