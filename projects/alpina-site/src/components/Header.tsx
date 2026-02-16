import { Link } from "@tanstack/react-router";
import {
	ChevronDown,
	ChevronRight,
	Home,
	Menu,
	Network,
	SquareFunction,
	StickyNote,
	X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function Header() {
	const [isOpen, setIsOpen] = useState(false);
	const [groupedExpanded, setGroupedExpanded] = useState<
		Record<string, boolean>
	>({});

	return (
		<>
			{/* Fixed header with blur */}
			<header className="fixed top-0 left-0 right-0 z-40">
				<div className="absolute inset-0 bg-background/90 backdrop-blur-md border-b border-border" />

				<div className="relative max-w-7xl mx-auto px-4 lg:px-8">
					<div className="flex items-center justify-between h-12">
						{/* Logo/Brand */}
						<Link to="/" className="flex items-center gap-2 group">
							<div className="w-7 h-7 rounded-[2px] bg-primary/15 border border-primary/30 flex items-center justify-center transition-colors group-hover:bg-primary/25 group-hover:border-primary/50">
								<span className="font-mono font-bold text-primary text-xs">
									A
								</span>
							</div>
							<span className="font-mono font-medium tracking-wider text-foreground text-sm uppercase">
								Alpina
							</span>
						</Link>

						{/* Desktop nav links */}
						<nav className="hidden md:flex items-center gap-1">
							<NavLink to="/">Platform</NavLink>
							<span className="text-border px-2">|</span>
							<NavLink to="/">Docs</NavLink>
							<span className="text-border px-2">|</span>
							<NavLink to="/">About</NavLink>
						</nav>

						{/* Actions */}
						<div className="flex items-center gap-2">
							<Button
								variant="ghost"
								size="xs"
								className="hidden md:inline-flex"
							>
								Sign In
							</Button>
							<Button size="xs" className="hidden sm:inline-flex">
								Get Access
							</Button>

							{/* Mobile menu trigger */}
							<button
								type="button"
								onClick={() => setIsOpen(true)}
								className="md:hidden p-1.5 -mr-1.5 text-foreground-muted hover:text-foreground transition-colors"
								aria-label="Open menu"
							>
								<Menu className="w-4 h-4" />
							</button>
						</div>
					</div>
				</div>
			</header>

			{/* Mobile sidebar */}
			<aside
				className={`fixed top-0 left-0 h-full w-72 bg-background/98 backdrop-blur-xl text-foreground shadow-2xl z-50 transform transition-transform duration-200 ease-out flex flex-col border-r border-border ${
					isOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<div className="flex items-center justify-between p-3 border-b border-border">
					<h2 className="font-mono text-xs font-medium uppercase tracking-wider text-foreground-muted">// Navigation</h2>
					<button
						type="button"
						onClick={() => setIsOpen(false)}
						className="p-1.5 hover:bg-secondary rounded-[2px] transition-colors text-foreground-muted hover:text-foreground"
						aria-label="Close menu"
					>
						<X size={16} />
					</button>
				</div>

				<nav className="flex-1 p-3 overflow-y-auto">
					<SidebarLink
						to="/"
						icon={<Home size={14} />}
						onClick={() => setIsOpen(false)}
					>
						Home
					</SidebarLink>

					{/* Demo Links */}
					<div className="mt-4 mb-2">
						<span className="font-mono text-[10px] uppercase tracking-ultra text-foreground-subtle px-2">
							// Demos
						</span>
					</div>

					<SidebarLink
						to="/demo/start/server-funcs"
						icon={<SquareFunction size={14} />}
						onClick={() => setIsOpen(false)}
					>
						Server Functions
					</SidebarLink>

					<SidebarLink
						to="/demo/start/api-request"
						icon={<Network size={14} />}
						onClick={() => setIsOpen(false)}
					>
						API Request
					</SidebarLink>

					<div className="flex flex-row items-center">
						<SidebarLink
							to="/demo/start/ssr"
							icon={<StickyNote size={14} />}
							onClick={() => setIsOpen(false)}
							className="flex-1"
						>
							SSR Demos
						</SidebarLink>
						<button
							type="button"
							className="p-1.5 hover:bg-secondary rounded-[2px] transition-colors text-foreground-muted hover:text-foreground"
							onClick={() =>
								setGroupedExpanded((prev) => ({
									...prev,
									StartSSRDemo: !prev.StartSSRDemo,
								}))
							}
						>
							{groupedExpanded.StartSSRDemo ? (
								<ChevronDown size={12} />
							) : (
								<ChevronRight size={12} />
							)}
						</button>
					</div>

					{groupedExpanded.StartSSRDemo && (
						<div className="flex flex-col ml-3 border-l border-border-subtle pl-2">
							<SidebarLink
								to="/demo/start/ssr/spa-mode"
								onClick={() => setIsOpen(false)}
							>
								SPA Mode
							</SidebarLink>
							<SidebarLink
								to="/demo/start/ssr/full-ssr"
								onClick={() => setIsOpen(false)}
							>
								Full SSR
							</SidebarLink>
							<SidebarLink
								to="/demo/start/ssr/data-only"
								onClick={() => setIsOpen(false)}
							>
								Data Only
							</SidebarLink>
						</div>
					)}
				</nav>
			</aside>

			{/* Backdrop */}
			{isOpen && (
				<div
					className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
					onClick={() => setIsOpen(false)}
					onKeyDown={(e) => e.key === "Escape" && setIsOpen(false)}
				/>
			)}
		</>
	);
}

function NavLink({
	to,
	children,
}: {
	to: string;
	children: React.ReactNode;
}) {
	return (
		<Link
			to={to}
			className="text-xs font-mono uppercase tracking-wider text-foreground-muted hover:text-primary transition-colors"
			activeProps={{ className: "text-xs font-mono uppercase tracking-wider text-primary" }}
		>
			{children}
		</Link>
	);
}

function SidebarLink({
	to,
	icon,
	children,
	onClick,
	className = "",
}: {
	to: string;
	icon?: React.ReactNode;
	children: React.ReactNode;
	onClick?: () => void;
	className?: string;
}) {
	return (
		<Link
			to={to}
			onClick={onClick}
			className={`flex items-center gap-2 px-2 py-1.5 rounded-[2px] text-foreground-muted hover:text-foreground hover:bg-secondary/50 transition-colors mb-0.5 text-xs font-mono ${className}`}
			activeProps={{
				className: `flex items-center gap-2 px-2 py-1.5 rounded-[2px] bg-primary/15 text-primary border border-primary/20 transition-colors mb-0.5 text-xs font-mono ${className}`,
			}}
		>
			{icon && <span className="opacity-70">{icon}</span>}
			<span className="font-medium uppercase tracking-wide">{children}</span>
		</Link>
	);
}
