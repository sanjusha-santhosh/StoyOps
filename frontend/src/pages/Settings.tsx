import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, Trash2, Save, Settings2, Building2, BedDouble, Tag, CalendarDays, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { getList, insertDoc, saveDoc, deleteDoc } from "@/api/frappe";
import { cn, formatDateOnly } from "@/lib/utils";
// Settings manages multiple DocTypes generically; specific type imports are optional.

type DocTypeName = "Property" | "Room Type" | "Rate Plan" | "Season" | "Amenity";

export default function SettingsPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
				<p className="text-muted-foreground">Manage properties, room types, rates, seasons and amenities.</p>
			</div>

			<Tabs defaultValue="properties" className="space-y-6">
				<TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
					<TabsTrigger value="properties" className="gap-1.5">
						<Building2 className="h-4 w-4" />
						Properties
					</TabsTrigger>
					<TabsTrigger value="room-types" className="gap-1.5">
						<BedDouble className="h-4 w-4" />
						Room Types
					</TabsTrigger>
					<TabsTrigger value="rate-plans" className="gap-1.5">
						<Tag className="h-4 w-4" />
						Rate Plans
					</TabsTrigger>
					<TabsTrigger value="seasons" className="gap-1.5">
						<CalendarDays className="h-4 w-4" />
						Seasons
					</TabsTrigger>
					<TabsTrigger value="amenities" className="gap-1.5">
						<Sparkles className="h-4 w-4" />
						Amenities
					</TabsTrigger>
				</TabsList>

				<TabsContent value="properties">
					<CrudTab
						doctype="Property"
						fields={[
							{ key: "property_code", label: "Property Code", required: true },
							{ key: "property_name", label: "Property Name", required: true },
							{ key: "city", label: "City" },
							{ key: "status", label: "Status", default: "Active", type: "select", options: ["Active", "Inactive"] },
						]}
						listFields={["name", "property_code", "property_name", "city", "status"]}
					/>
				</TabsContent>

				<TabsContent value="room-types">
					<CrudTab
						doctype="Room Type"
						fields={[
							{ key: "room_type_code", label: "Room Type Code", required: true },
							{ key: "room_type_name", label: "Room Type Name", required: true },
							{ key: "base_rate", label: "Base Rate", required: true, type: "number" },
							{ key: "max_adults", label: "Max Adults", type: "number", default: 2 },
							{ key: "max_children", label: "Max Children", type: "number", default: 0 },
						]}
						listFields={["name", "room_type_code", "room_type_name", "base_rate", "max_adults"]}
					/>
				</TabsContent>

				<TabsContent value="rate-plans">
					<CrudTab
						doctype="Rate Plan"
						fields={[
							{ key: "rate_plan_code", label: "Rate Plan Code", required: true },
							{ key: "rate_plan_name", label: "Rate Plan Name", required: true },
							{ key: "room_type", label: "Room Type", required: true, type: "link", linkDoctype: "Room Type" },
							{ key: "rate", label: "Rate", required: true, type: "number" },
							{ key: "is_active", label: "Active", type: "checkbox", default: 1 },
						]}
						listFields={["name", "rate_plan_code", "rate_plan_name", "room_type", "rate", "is_active"]}
					/>
				</TabsContent>

				<TabsContent value="seasons">
					<CrudTab
						doctype="Season"
						fields={[
							{ key: "season_name", label: "Season Name", required: true },
							{ key: "start_date", label: "Start Date", required: true, type: "date" },
							{ key: "end_date", label: "End Date", required: true, type: "date" },
							{ key: "is_active", label: "Active", type: "checkbox", default: 1 },
						]}
						listFields={["name", "season_name", "start_date", "end_date", "is_active"]}
					/>
				</TabsContent>

				<TabsContent value="amenities">
					<CrudTab
						doctype="Amenity"
						fields={[
							{ key: "amenity_name", label: "Amenity Name", required: true },
							{ key: "category", label: "Category" },
							{ key: "description", label: "Description" },
						]}
						listFields={["name", "amenity_name", "category", "description"]}
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
}

interface FieldDef {
	key: string;
	label: string;
	required?: boolean;
	type?: "text" | "number" | "date" | "select" | "link" | "checkbox";
	options?: string[];
	linkDoctype?: string;
	default?: any;
}

function CrudTab({ doctype, fields, listFields }: { doctype: DocTypeName; fields: FieldDef[]; listFields: string[] }) {
	const queryClient = useQueryClient();
	const [editing, setEditing] = useState<Record<string, any> | null>(null);
	const [form, setForm] = useState<Record<string, any>>({});

	const { data: items, isLoading } = useQuery<any[]>({
		queryKey: ["settings", doctype],
		queryFn: () => getList(doctype, listFields),
	});

	const createMutation = useMutation({
		mutationFn: (doc: Record<string, any>) => insertDoc(doc),
		onSuccess: () => {
			toast.success(`${doctype} created`);
			queryClient.invalidateQueries({ queryKey: ["settings", doctype] });
			setForm({});
		},
		onError: (err: any) => toast.error(err?.message || `Failed to create ${doctype}`),
	});

	const saveMutation = useMutation({
		mutationFn: (doc: Record<string, any>) => saveDoc(doc),
		onSuccess: () => {
			toast.success(`${doctype} saved`);
			queryClient.invalidateQueries({ queryKey: ["settings", doctype] });
			setEditing(null);
			setForm({});
		},
		onError: (err: any) => toast.error(err?.message || `Failed to save ${doctype}`),
	});

	const deleteMutation = useMutation({
		mutationFn: (name: string) => deleteDoc(doctype, name),
		onSuccess: () => {
			toast.success(`${doctype} deleted`);
			queryClient.invalidateQueries({ queryKey: ["settings", doctype] });
		},
		onError: (err: any) => toast.error(err?.message || `Failed to delete ${doctype}`),
	});

	function startCreate() {
		setEditing({});
		const defaults: Record<string, any> = {};
		for (const f of fields) {
			if (f.default !== undefined) defaults[f.key] = f.default;
		}
		setForm(defaults);
	}

	function startEdit(item: Record<string, any>) {
		setEditing(item);
		setForm({ ...item });
	}

	function cancelEdit() {
		setEditing(null);
		setForm({});
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		const payload: Record<string, any> = { doctype };
		for (const f of fields) {
			if (form[f.key] !== undefined && form[f.key] !== "") {
				payload[f.key] = f.type === "number" ? Number(form[f.key]) : form[f.key];
			}
		}
		if (editing && editing.name) {
			payload.name = editing.name;
			saveMutation.mutate({ ...payload, doctype });
		} else {
			createMutation.mutate(payload);
		}
	}

	function renderInput(f: FieldDef) {
		const value = form[f.key] ?? "";
		if (f.type === "select") {
			return (
				<select
					value={value}
					onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
					className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
					required={f.required}
				>
					<option value="">Select {f.label}</option>
					{f.options?.map((o) => (
						<option key={o} value={o}>
							{o}
						</option>
					))}
				</select>
			);
		}
		if (f.type === "link") {
			return <LinkSelect value={value} onChange={(v) => setForm({ ...form, [f.key]: v })} doctype={f.linkDoctype!} required={f.required} />;
		}
		if (f.type === "checkbox") {
			return (
				<input
					type="checkbox"
					checked={!!value}
					onChange={(e) => setForm({ ...form, [f.key]: e.target.checked ? 1 : 0 })}
					className="h-4 w-4 rounded border-input text-primary"
				/>
			);
		}
		return (
			<Input
				type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
				value={value}
				onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
				placeholder={f.label}
				required={f.required}
				min={f.type === "number" ? 0 : undefined}
			/>
		);
	}

	return (
		<div className="space-y-5">
			<div className="flex justify-end">
				<Button onClick={startCreate} className="gap-2 shadow-sm">
					<Plus className="h-4 w-4" />
					New {doctype}
				</Button>
			</div>

			{editing && (
				<Card className="border-none shadow-sm bg-primary/5">
					<CardHeader>
						<CardTitle className="text-base flex items-center gap-2">
							<Settings2 className="h-4 w-4" />
							{editing.name ? `Edit ${doctype}` : `New ${doctype}`}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
								{fields.map((f) => (
									<div key={f.key} className="space-y-2">
										<Label>
											{f.label}
											{f.required && <span className="text-red-500 ml-0.5">*</span>}
										</Label>
										{renderInput(f)}
									</div>
								))}
							</div>
							<div className="flex justify-end gap-2 pt-2">
								<Button type="button" variant="outline" onClick={cancelEdit}>
									Cancel
								</Button>
								<Button type="submit" disabled={createMutation.isPending || saveMutation.isPending} className="gap-2">
									{(createMutation.isPending || saveMutation.isPending) ? (
										<Loader2 className="h-4 w-4 animate-spin" />
									) : (
										<Save className="h-4 w-4" />
									)}
									{editing.name ? "Save Changes" : `Create ${doctype}`}
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			)}

			{isLoading ? (
				<div className="space-y-2">
					<Skeleton className="h-14" />
					<Skeleton className="h-14" />
					<Skeleton className="h-14" />
				</div>
			) : (
				<div className="grid gap-3">
					{items?.length === 0 ? (
						<Card className="border-none shadow-sm">
							<CardContent className="py-10 text-center text-muted-foreground">
								No {doctype} records yet.
							</CardContent>
						</Card>
						) : (
						items?.map((item) => (
							<Card key={item.name} className="border-none shadow-sm hover:shadow-md transition-shadow">
								<CardContent className="p-4">
									<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
										<div className="grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
											{listFields
												.filter((k) => k !== "name")
												.map((k) => (
													<div key={k}>
														<p className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.replace(/_/g, " ")}</p>
														<p className="text-sm font-medium">
															{k.includes("date") ? formatDateOnly(item[k]) : item[k] ?? "—"}
														</p>
													</div>
												))}
										</div>
										<div className="flex items-center gap-2">
											<Button size="sm" variant="outline" onClick={() => startEdit(item)}>
												Edit
											</Button>
											<Button
												size="sm"
												variant="ghost"
												className="text-red-600 hover:text-red-700 hover:bg-red-50"
												onClick={() => {
													if (confirm(`Delete ${doctype} ${item.name}?`)) deleteMutation.mutate(item.name);
												}}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</div>
								</CardContent>
							</Card>
						))
					)}
				</div>
			)}
		</div>
	);
}

function LinkSelect({
	value,
	onChange,
	doctype,
	required,
}: {
	value: string;
	onChange: (value: string) => void;
	doctype: string;
	required?: boolean;
}) {
	const { data: options, isLoading } = useQuery<any[]>({
		queryKey: ["link-options", doctype],
		queryFn: () => getList(doctype, ["name"]),
	});

	return (
		<select
			value={value}
			onChange={(e) => onChange(e.target.value)}
			className={cn(
				"flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
				isLoading && "opacity-50",
			)}
			required={required}
			disabled={isLoading}
		>
			<option value="">Select {doctype}</option>
			{options?.map((o) => (
				<option key={o.name} value={o.name}>
					{o.name}
				</option>
			))}
		</select>
	);
}
