import { Gamepad2, Trophy, Sparkles, Snowflake, Clock } from 'lucide-react'

export const THEME_NAMES = ['arcade', 'pro', 'synthwave', 'rink', 'vintage'] as const
export type ThemeName = (typeof THEME_NAMES)[number]

export interface ThemeDefinition {
	name: ThemeName
	label: string
	description: string
	fontInfo: string
	icon: typeof Gamepad2
	previewColors: {
		primary: string
		secondary: string
		background: string
	}
}

export const themes: Record<ThemeName, ThemeDefinition> = {
	arcade: {
		name: 'arcade',
		label: 'Arcade',
		description: 'Comic book energy, playful maximalism',
		fontInfo: 'Bangers + Nunito',
		icon: Gamepad2,
		previewColors: {
			primary: '#7c3aed',
			secondary: '#ec4899',
			background: '#f5f3ff',
		},
	},
	pro: {
		name: 'pro',
		label: 'Professional',
		description: 'Editorial elegance, broadcast quality',
		fontInfo: 'Playfair Display + Source Sans',
		icon: Trophy,
		previewColors: {
			primary: '#1e3a5f',
			secondary: '#d4af37',
			background: '#fafafa',
		},
	},
	synthwave: {
		name: 'synthwave',
		label: 'Synthwave',
		description: 'Neon-drenched retro-futurism',
		fontInfo: 'Orbitron + Exo 2',
		icon: Sparkles,
		previewColors: {
			primary: '#22d3ee',
			secondary: '#f472b6',
			background: '#0f0520',
		},
	},
	rink: {
		name: 'rink',
		label: 'Ice Rink',
		description: 'Athletic industrial, frosted glass',
		fontInfo: 'Bebas Neue + IBM Plex Sans',
		icon: Snowflake,
		previewColors: {
			primary: '#0284c7',
			secondary: '#dc2626',
			background: '#e0f2fe',
		},
	},
	vintage: {
		name: 'vintage',
		label: 'Vintage',
		description: '1970s nostalgia, aged paper warmth',
		fontInfo: 'Righteous + Libre Baskerville',
		icon: Clock,
		previewColors: {
			primary: '#c2410c',
			secondary: '#78350f',
			background: '#fef3c7',
		},
	},
}

export const DEFAULT_THEME: ThemeName = 'pro'
