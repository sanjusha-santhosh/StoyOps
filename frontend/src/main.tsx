import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { router } from "@/routes";
import "@/index.css";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 2,
			retry: 1,
		},
	},
});

const mountId = "hotel-frontdesk-root";
const mountNode = document.getElementById(mountId);
if (!mountNode) {
	throw new Error(`Mount node #${mountId} not found.`);
}

import { FrappeProvider } from "frappe-react-sdk";

ReactDOM.createRoot(mountNode).render(
	<React.StrictMode>
		<FrappeProvider>
			<QueryClientProvider client={queryClient}>
				<Toaster position="top-right" richColors closeButton />
				<RouterProvider router={router} />
			</QueryClientProvider>
		</FrappeProvider>
	</React.StrictMode>,
);
