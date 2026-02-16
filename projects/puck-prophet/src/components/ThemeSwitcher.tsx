import { useTheme } from '@/hooks/useTheme'
import { themes, THEME_NAMES, type ThemeName } from '@/lib/themes'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Palette, Check } from 'lucide-react'

function ThemeSwatch({ theme }: { theme: ThemeName }) {
	const themeData = themes[theme]
	return (
		<div className="flex gap-0.5">
			<div
				className="h-4 w-4 rounded-l-sm"
				style={{ backgroundColor: themeData.previewColors.primary }}
			/>
			<div
				className="h-4 w-4"
				style={{ backgroundColor: themeData.previewColors.secondary }}
			/>
			<div
				className="h-4 w-4 rounded-r-sm border border-border"
				style={{ backgroundColor: themeData.previewColors.background }}
			/>
		</div>
	)
}

export function ThemeSwitcher() {
	const { theme, setTheme, isHydrated } = useTheme()

	if (!isHydrated) {
		return (
			<Button variant="ghost" size="icon" disabled>
				<Palette className="h-5 w-5" />
			</Button>
		)
	}

	const currentTheme = themes[theme]
	const Icon = currentTheme.icon

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="sm" className="gap-2">
					<Icon className="h-4 w-4" />
					<span className="hidden sm:inline">{currentTheme.label}</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-72">
				{THEME_NAMES.map((themeName) => {
					const themeData = themes[themeName]
					const ThemeIcon = themeData.icon
					const isActive = theme === themeName

					return (
						<DropdownMenuItem
							key={themeName}
							onClick={() => setTheme(themeName)}
							className="flex items-center justify-between gap-3 cursor-pointer py-3"
						>
							<div className="flex items-center gap-3">
								<ThemeIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
								<div className="flex flex-col gap-0.5">
									<span className="font-medium">{themeData.label}</span>
									<span className="text-xs text-muted-foreground">
										{themeData.description}
									</span>
									<span className="text-[10px] text-muted-foreground/70 font-mono">
										{themeData.fontInfo}
									</span>
								</div>
							</div>
							<div className="flex items-center gap-2 flex-shrink-0">
								<ThemeSwatch theme={themeName} />
								{isActive && <Check className="h-4 w-4 text-primary" />}
							</div>
						</DropdownMenuItem>
					)
				})}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
