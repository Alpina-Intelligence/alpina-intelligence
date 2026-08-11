import { MountainsIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { ThemeControls } from "#/components/theme-controls.tsx";
import { Button } from "#/components/ui/button.tsx";

const nav = [
	{ to: "/", hash: "services", label: "Services" },
	{ to: "/", hash: "approach", label: "Approach" },
	{ to: "/blog", label: "Field notes" },
	{ to: "/stack", label: "Stack" },
] as const;

export function SiteHeader() {
	return (
		<header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
			<div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
				<Link to="/" className="flex items-center gap-2 font-semibold">
					<MountainsIcon size={22} weight="fill" />
					<span>
						Alpina <span className="text-muted-foreground">Intelligence</span>
					</span>
				</Link>
				<nav className="hidden items-center gap-6 text-sm md:flex">
					{nav.map((item) => (
						<Link
							key={item.label}
							to={item.to}
							hash={"hash" in item ? item.hash : undefined}
							className="text-muted-foreground transition-colors hover:text-foreground"
						>
							{item.label}
						</Link>
					))}
				</nav>
				<div className="flex items-center gap-2">
					<ThemeControls />
					<Button
						size="sm"
						// biome-ignore lint/a11y/useAnchorContent: Base UI render prop — children are injected by the primitive
						render={<a href="mailto:hello@alpina-intelligence.com" />}
						nativeButton={false}
					>
						Book an intro call
					</Button>
				</div>
			</div>
		</header>
	);
}
