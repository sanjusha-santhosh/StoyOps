import { createRootRoute, createRoute, createRouter, Outlet } from "@tanstack/react-router";
import { createHashHistory } from "@tanstack/history";
import { Layout } from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Reservations from "@/pages/Reservations";
import Calendar from "@/pages/Calendar";
import Rooms from "@/pages/Rooms";
import Housekeeping from "@/pages/Housekeeping";
import Maintenance from "@/pages/Maintenance";
import Settings from "@/pages/Settings";

const hashHistory = createHashHistory();

const rootRoute = createRootRoute({
	component: () => (
		<Layout>
			<Outlet />
		</Layout>
	),
});

const indexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/",
	beforeLoad: () => {
		throw router.navigate({ to: "/dashboard" });
	},
	component: () => null,
});

const dashboardRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/dashboard",
	component: Dashboard,
});

const reservationsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/reservations",
	component: Reservations,
});

const calendarRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/calendar",
	component: Calendar,
});

const roomsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/rooms",
	component: Rooms,
});

const housekeepingRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/housekeeping",
	component: Housekeeping,
});

const maintenanceRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/maintenance",
	component: Maintenance,
});

const settingsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/settings",
	component: Settings,
});

const routeTree = rootRoute.addChildren([
	indexRoute,
	dashboardRoute,
	reservationsRoute,
	calendarRoute,
	roomsRoute,
	housekeepingRoute,
	maintenanceRoute,
	settingsRoute,
]);

export const router = createRouter({ routeTree, history: hashHistory });

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}
