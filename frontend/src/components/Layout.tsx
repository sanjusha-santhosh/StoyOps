import { useState } from "react";
import { Menu, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "@/components/Sidebar";
import { ReservationModal } from "@/pages/ReservationModal";

export function Layout({ children }: { children: React.ReactNode }) {
	const [mobileOpen, setMobileOpen] = useState(false);
	const [reservationOpen, setReservationOpen] = useState(false);

	return (
		<div className="flex h-screen w-full bg-slate-50">
			<aside className="hidden lg:flex w-64 flex-col">
				<Sidebar />
			</aside>

			<Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
				<SheetContent side="left" className="p-0 w-72">
					<Sidebar onNavigate={() => setMobileOpen(false)} />
				</SheetContent>
			</Sheet>

			<div className="flex flex-1 flex-col min-w-0">
				<header className="flex h-16 items-center justify-between border-b bg-white px-4 lg:px-6">
					<div className="flex items-center gap-3">
						<Sheet>
							<SheetTrigger asChild>
								<Button variant="ghost" size="icon" className="lg:hidden">
									<Menu className="h-5 w-5" />
								</Button>
							</SheetTrigger>
							<SheetContent side="left" className="p-0 w-72">
								<Sidebar />
							</SheetContent>
						</Sheet>
						<h2 className="text-lg font-semibold text-foreground hidden sm:block">Frontdesk</h2>
					</div>
					<Button onClick={() => setReservationOpen(true)} className="gap-2 shadow-sm">
						<Plus className="h-4 w-4" />
						<span className="hidden sm:inline">New Reservation</span>
						<span className="sm:hidden">New</span>
					</Button>
				</header>

				<main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
			</div>

			<ReservationModal open={reservationOpen} onClose={() => setReservationOpen(false)} />
		</div>
	);
}
