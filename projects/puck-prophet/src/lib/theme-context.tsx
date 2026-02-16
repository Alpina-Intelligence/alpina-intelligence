import { createContext, useCallback, useEffect, useState } from 'react'
import { DEFAULT_THEME, THEME_NAMES, type ThemeName } from './themes'

const STORAGE_KEY = 'puck-prophet-theme'

interface ThemeContextValue {
	theme: ThemeName
	setTheme: (theme: ThemeName) => void
	isHydrated: boolean
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

function getStoredTheme(): ThemeName {
	if (typeof window === 'undefined') return DEFAULT_THEME
	const stored = localStorage.getItem(STORAGE_KEY)
	if (stored && THEME_NAMES.includes(stored as ThemeName)) {
		return stored as ThemeName
	}
	return DEFAULT_THEME
}

function applyTheme(theme: ThemeName) {
	if (typeof document === 'undefined') return
	document.documentElement.setAttribute('data-theme', theme)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [theme, setThemeState] = useState<ThemeName>(DEFAULT_THEME)
	const [isHydrated, setIsHydrated] = useState(false)

	useEffect(() => {
		const storedTheme = getStoredTheme()
		setThemeState(storedTheme)
		applyTheme(storedTheme)
		setIsHydrated(true)
	}, [])

	const setTheme = useCallback((newTheme: ThemeName) => {
		setThemeState(newTheme)
		applyTheme(newTheme)
		localStorage.setItem(STORAGE_KEY, newTheme)
	}, [])

	return (
		<ThemeContext.Provider value={{ theme, setTheme, isHydrated }}>
			{children}
		</ThemeContext.Provider>
	)
}
