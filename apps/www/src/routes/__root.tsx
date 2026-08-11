import { IconContext } from "@phosphor-icons/react";
import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "Alpina Intelligence — Data & AI consulting" },
			{
				name: "description",
				content:
					"Alpina Intelligence designs, builds, and operates data platforms and AI systems that keep working after we leave.",
			},
		],
		links: [{ rel: "stylesheet", href: appCss }],
		scripts: [
			{
				// Applies persisted theme/mode (or the OS preference) before first
				// paint, so SSR HTML never flashes the wrong palette. Mirrors the
				// cookies written by ThemeControls.
				children:
					"(function(){try{var c=document.cookie,m=c.match(/(?:^|; )theme-mode=([^;]*)/),d=m?m[1]==='dark':matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');var t=c.match(/(?:^|; )theme-name=([^;]*)/);if(t&&t[1]&&t[1]!=='lagoon')document.documentElement.setAttribute('data-theme',t[1])}catch(e){}})()",
			},
		],
	}),
	shellComponent: RootDocument,
	component: RootLayout,
});

function RootLayout() {
	return (
		// Global icon voice: Phosphor, bold. Emphasis states override per-icon.
		<IconContext.Provider value={{ weight: "bold" }}>
			<div className="flex min-h-svh flex-col">
				<SiteHeader />
				<main className="flex-1">
					<Outlet />
				</main>
				<SiteFooter />
			</div>
		</IconContext.Provider>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		// suppressHydrationWarning: the inline script above mutates <html>
		// (class/data-theme) before React hydrates; the mismatch is intentional.
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<TanStackDevtools
					config={{ position: "bottom-right" }}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
						TanStackQueryDevtools,
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
