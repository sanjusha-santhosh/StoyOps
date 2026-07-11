import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string | undefined): string {
	const num = typeof value === "string" ? parseFloat(value) : value;
	if (num === undefined || num === null || Number.isNaN(num)) return "$0.00";
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
	}).format(num);
}

export function formatDate(value: string | Date | undefined): string {
	if (!value) return "—";
	const date = typeof value === "string" ? new Date(value) : value;
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(date);
}

export function formatDateOnly(value: string | Date | undefined): string {
	if (!value) return "—";
	const date = typeof value === "string" ? new Date(value) : value;
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	}).format(date);
}

export function statusColor(status: string): string {
	switch (status) {
		case "Draft":
			return "bg-slate-100 text-slate-700 border-slate-200";
		case "Confirmed":
			return "bg-blue-100 text-blue-700 border-blue-200";
		case "Checked In":
			return "bg-emerald-100 text-emerald-700 border-emerald-200";
		case "Checked Out":
			return "bg-amber-100 text-amber-700 border-amber-200";
		case "Cancelled":
			return "bg-red-100 text-red-700 border-red-200";
		case "Clean":
			return "bg-emerald-100 text-emerald-700 border-emerald-200";
		case "Dirty":
			return "bg-rose-100 text-rose-700 border-rose-200";
		case "Inspection":
			return "bg-purple-100 text-purple-700 border-purple-200";
		case "Maintenance":
			return "bg-orange-100 text-orange-700 border-orange-200";
		case "Scheduled":
			return "bg-slate-100 text-slate-700 border-slate-200";
		case "In Progress":
			return "bg-blue-100 text-blue-700 border-blue-200";
		case "Cleaned":
		case "Verified":
		case "Completed":
			return "bg-emerald-100 text-emerald-700 border-emerald-200";
		default:
			return "bg-gray-100 text-gray-700 border-gray-200";
	}
}
