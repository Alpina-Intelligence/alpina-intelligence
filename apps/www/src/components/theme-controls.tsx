import { MoonIcon, PaletteIcon, SunIcon } from "@phosphor-icons/react";
import * as React from "react";
import { Button } from "#/components/ui/button.tsx";

/**
 * Two orthogonal axes, both persisted as cookies and applied to <html>:
 *   mode  — "light" | "dark"      → the `dark` class
 *   theme — "lagoon" | "larch"    → `data-theme` (absent = lagoon, the default)
 *
 * First paint is handled by the inline script in __root.tsx (reads the same
 * cookies before hydration), so these controls only ever *mutate* state.
 */
const THEMES = ["lagoon", "larch", "crt"] as const;
type ThemeName = (typeof THEMES)[number];

function writeCookie(name: string, value: string) {
	// biome-ignore lint/suspicious/noDocumentCookie: CookieStore is async and not yet universal; a sync write is exactly right for a 2-value theme cookie
	document.cookie = `${name}=${value}; path=/; max-age=31536000; samesite=lax`;
}

export function ThemeControls() {
	const [mounted, setMounted] = React.useState(false);
	const [dark, setDark] = React.useState(false);
	const [theme, setTheme] = React.useState<ThemeName>("lagoon");

	React.useEffect(() => {
		const root = document.documentElement;
		setDark(root.classList.contains("dark"));
		const current = root.getAttribute("data-theme");
		if (current && THEMES.includes(current as ThemeName)) {
			setTheme(current as ThemeName);
		}
		setMounted(true);
	}, []);

	function toggleMode() {
		const next = !dark;
		setDark(next);
		document.documentElement.classList.toggle("dark", next);
		writeCookie("theme-mode", next ? "dark" : "light");
	}

	function cycleTheme() {
		const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
		setTheme(next);
		if (next === "lagoon") {
			document.documentElement.removeAttribute("data-theme");
		} else {
			document.documentElement.setAttribute("data-theme", next);
		}
		writeCookie("theme-name", next);
	}

	return (
		<div className="flex items-center gap-1">
			<Button
				variant="ghost"
				size="icon-sm"
				onClick={toggleMode}
				aria-label={
					mounted && dark ? "Switch to light mode" : "Switch to dark mode"
				}
			>
				{mounted && dark ? <SunIcon /> : <MoonIcon />}
			</Button>
			<Button
				variant="ghost"
				size="icon-sm"
				onClick={cycleTheme}
				aria-label={`Switch theme (current: ${theme})`}
				title={mounted ? `Theme: ${theme}` : undefined}
			>
				<PaletteIcon />
			</Button>
		</div>
	);
}
