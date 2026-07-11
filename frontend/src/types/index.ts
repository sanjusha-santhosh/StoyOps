export interface Property {
	name: string;
	property_name: string;
	property_code: string;
	city?: string;
	status?: string;
}

export interface RoomType {
	name: string;
	room_type_name: string;
	room_type_code: string;
	base_rate: number;
	max_adults?: number;
	max_children?: number;
}

export interface Room {
	name: string;
	room_number: string;
	room_name?: string;
	room_type: string;
	property?: string;
	building?: string;
	floor?: string;
	status?: string;
	operational_status: string;
}

export interface RatePlan {
	name: string;
	rate_plan_code: string;
	rate_plan_name: string;
	room_type: string;
	rate: number;
	season?: string;
	is_active?: number;
}

export interface Season {
	name: string;
	season_name: string;
	start_date: string;
	end_date: string;
	is_active?: number;
}

export interface Amenity {
	name: string;
	amenity_name: string;
	category?: string;
	description?: string;
}

export interface Reservation {
	name: string;
	guest_name: string;
	email?: string;
	phone?: string;
	property?: string;
	room_type?: string;
	rate_plan?: string;
	status: "Draft" | "Confirmed" | "Checked In" | "Checked Out" | "Cancelled" | "No Show";
	check_in: string;
	check_out: string;
	adults?: number;
	children?: number;
	total_amount?: number;
	sales_order?: string;
	sales_invoice?: string;
	special_requests?: string;
}

export interface RoomAssignment {
	name: string;
	reservation: string;
	room: string;
	status: "Assigned" | "Checked In" | "Checked Out" | "Cancelled";
	check_in: string;
	check_out: string;
	guest_name?: string;
	room_type?: string;
	reservation_status?: string;
}

export interface Housekeeping {
	name: string;
	room: string;
	scheduled_date: string;
	task_type: "Cleaning" | "Turndown" | "Deep Clean" | "Inspection";
	status: "Scheduled" | "In Progress" | "Cleaned" | "Verified";
	assigned_to?: string;
	started_at?: string;
	completed_at?: string;
	notes?: string;
}

export interface Maintenance {
	name: string;
	room: string;
	maintenance_type: "Repair" | "Renovation" | "Preventive" | "Inspection";
	start_date: string;
	end_date?: string;
	reason?: string;
	status: "Scheduled" | "In Progress" | "Completed" | "Cancelled";
}

export interface DashboardStats {
	arrivals: number;
	departures: number;
	total_rooms: number;
	occupied: number;
	vacant: number;
	revenue: number;
}

export interface NavItem {
	id: string;
	label: string;
	href: string;
	icon: string;
}
