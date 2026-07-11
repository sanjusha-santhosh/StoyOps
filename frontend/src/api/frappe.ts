import axios from "axios";

export const frappeApi = axios.create({
	baseURL: "/api",
	withCredentials: true,
	headers: {
		Accept: "application/json",
		"Content-Type": "application/json",
	},
});

frappeApi.interceptors.request.use((config) => {
	if (config.method?.toLowerCase() === "post") {
		config.headers["X-Frappe-CSRF-Token"] =
			(window as any).csrf_token || getCookie("csrf_token");
	}
	return config;
});

function getCookie(name: string): string | undefined {
	const value = `; ${document.cookie}`;
	const parts = value.split(`; ${name}=`);
	if (parts.length === 2) return parts.pop()?.split(";").shift();
	return undefined;
}

export async function callMethod(method: string, args: Record<string, any> = {}) {
	const response = await frappeApi.post("/method/" + method, args);
	return response.data.message;
}

export async function getList<T = any>(
	doctype: string,
	fields: string[],
	filters?: Record<string, any>,
	options?: { limit_page_length?: number; order_by?: string },
): Promise<T[]> {
	const response = await callMethod("frappe.client.get_list", {
		doctype,
		fields,
		filters,
		limit_page_length: options?.limit_page_length ?? 500,
		order_by: options?.order_by,
	});
	return response || [];
}

export async function getDoc<T = any>(doctype: string, name: string): Promise<T> {
	return callMethod("frappe.client.get_doc", { doctype, name });
}

export async function insertDoc<T = any>(doc: Record<string, any>): Promise<T> {
	return callMethod("frappe.client.insert", { doc });
}

export async function saveDoc<T = any>(doc: Record<string, any>): Promise<T> {
	return callMethod("frappe.client.save", { doc });
}

export async function deleteDoc(doctype: string, name: string): Promise<void> {
	await callMethod("frappe.client.delete", { doctype, name });
}
