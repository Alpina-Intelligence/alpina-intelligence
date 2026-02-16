import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'

interface ProphetCharacterProps {
	size?: 'sm' | 'md' | 'lg' | 'xl'
	className?: string
	animated?: boolean
}

const sizeClasses = {
	sm: 'w-16 h-16',
	md: 'w-24 h-24',
	lg: 'w-32 h-32',
	xl: 'w-48 h-48',
}

export function ProphetCharacter({
	size = 'md',
	className,
	animated = true,
}: ProphetCharacterProps) {
	const { theme } = useTheme()

	return (
		<div
			className={cn(
				sizeClasses[size],
				'relative',
				animated && 'animate-bounce',
				className
			)}
		>
			{theme === 'arcade' && <ArcadeProphet />}
			{theme === 'pro' && <ProProphet />}
			{theme === 'synthwave' && <SynthwaveProphet />}
			{theme === 'rink' && <RinkProphet />}
			{theme === 'vintage' && <VintageProphet />}
		</div>
	)
}

function ArcadeProphet() {
	return (
		<svg viewBox="0 0 100 100" className="w-full h-full">
			{/* Cape */}
			<path
				d="M30 55 L20 90 L50 80 L80 90 L70 55"
				className="fill-secondary"
			/>
			{/* Puck body */}
			<ellipse cx="50" cy="50" rx="35" ry="30" className="fill-foreground" />
			<ellipse cx="50" cy="45" rx="30" ry="25" className="fill-muted" />
			{/* Eyes */}
			<ellipse cx="38" cy="42" rx="8" ry="10" className="fill-background" />
			<ellipse cx="62" cy="42" rx="8" ry="10" className="fill-background" />
			<circle cx="40" cy="44" r="4" className="fill-foreground" />
			<circle cx="64" cy="44" r="4" className="fill-foreground" />
			{/* Sparkle eyes */}
			<circle cx="42" cy="42" r="2" className="fill-background" />
			<circle cx="66" cy="42" r="2" className="fill-background" />
			{/* Smile */}
			<path
				d="M35 55 Q50 70 65 55"
				fill="none"
				className="stroke-background"
				strokeWidth="3"
				strokeLinecap="round"
			/>
			{/* Crown/wizard hat */}
			<path
				d="M30 25 L50 5 L70 25 L60 20 L50 30 L40 20 Z"
				className="fill-accent"
			/>
			<circle cx="50" cy="8" r="4" className="fill-secondary" />
		</svg>
	)
}

function ProProphet() {
	return (
		<svg viewBox="0 0 100 100" className="w-full h-full">
			{/* Clean geometric puck */}
			<circle cx="50" cy="50" r="40" className="fill-primary" />
			<circle cx="50" cy="50" r="35" className="fill-primary/80" />
			<circle cx="50" cy="50" r="25" className="fill-primary/60" />
			{/* Center dot */}
			<circle cx="50" cy="50" r="8" className="fill-primary-foreground" />
			{/* Subtle accent ring */}
			<circle
				cx="50"
				cy="50"
				r="42"
				fill="none"
				className="stroke-accent"
				strokeWidth="2"
			/>
			{/* Trophy emblem */}
			<path
				d="M42 35 L42 28 L38 28 L38 25 L62 25 L62 28 L58 28 L58 35"
				className="fill-accent"
			/>
			<path d="M44 35 L44 42 L56 42 L56 35" className="fill-accent" />
			<rect x="46" y="42" width="8" height="4" className="fill-accent" />
			<rect x="43" y="46" width="14" height="3" className="fill-accent" />
		</svg>
	)
}

function SynthwaveProphet() {
	return (
		<svg viewBox="0 0 100 100" className="w-full h-full">
			<defs>
				<filter id="glow">
					<feGaussianBlur stdDeviation="2" result="coloredBlur" />
					<feMerge>
						<feMergeNode in="coloredBlur" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
				<linearGradient id="synthGrad" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" className="[stop-color:var(--primary)]" />
					<stop offset="100%" className="[stop-color:var(--secondary)]" />
				</linearGradient>
			</defs>
			{/* Grid lines background effect */}
			<line
				x1="10"
				y1="70"
				x2="90"
				y2="70"
				className="stroke-primary/30"
				strokeWidth="1"
			/>
			<line
				x1="10"
				y1="80"
				x2="90"
				y2="80"
				className="stroke-primary/20"
				strokeWidth="1"
			/>
			<line
				x1="10"
				y1="90"
				x2="90"
				y2="90"
				className="stroke-primary/10"
				strokeWidth="1"
			/>
			{/* Neon puck outline */}
			<circle
				cx="50"
				cy="45"
				r="35"
				fill="none"
				className="stroke-primary"
				strokeWidth="3"
				filter="url(#glow)"
			/>
			<circle
				cx="50"
				cy="45"
				r="28"
				fill="none"
				className="stroke-secondary"
				strokeWidth="2"
				filter="url(#glow)"
			/>
			{/* Inner glow */}
			<circle cx="50" cy="45" r="20" className="fill-primary/20" />
			{/* Eyes - neon style */}
			<circle
				cx="40"
				cy="42"
				r="5"
				className="fill-primary"
				filter="url(#glow)"
			/>
			<circle
				cx="60"
				cy="42"
				r="5"
				className="fill-primary"
				filter="url(#glow)"
			/>
			{/* Sunglasses */}
			<rect
				x="32"
				y="38"
				width="16"
				height="8"
				rx="2"
				className="fill-foreground"
			/>
			<rect
				x="52"
				y="38"
				width="16"
				height="8"
				rx="2"
				className="fill-foreground"
			/>
			<line
				x1="48"
				y1="42"
				x2="52"
				y2="42"
				className="stroke-foreground"
				strokeWidth="2"
			/>
			{/* Reflection on glasses */}
			<line
				x1="35"
				y1="40"
				x2="38"
				y2="40"
				className="stroke-secondary"
				strokeWidth="1"
			/>
			<line
				x1="55"
				y1="40"
				x2="58"
				y2="40"
				className="stroke-secondary"
				strokeWidth="1"
			/>
		</svg>
	)
}

function RinkProphet() {
	return (
		<svg viewBox="0 0 100 100" className="w-full h-full">
			<defs>
				<filter id="frost">
					<feTurbulence
						type="fractalNoise"
						baseFrequency="0.05"
						numOctaves="2"
					/>
					<feDisplacementMap in="SourceGraphic" scale="3" />
				</filter>
			</defs>
			{/* Ice/frost effect background */}
			<circle cx="50" cy="50" r="42" className="fill-accent/30" />
			{/* Main puck */}
			<ellipse cx="50" cy="50" rx="35" ry="30" className="fill-primary" />
			<ellipse cx="50" cy="45" rx="30" ry="25" className="fill-primary/80" />
			{/* Ice crystals */}
			<path
				d="M25 30 L30 20 L35 30 L30 25 Z"
				className="fill-accent"
				opacity="0.6"
			/>
			<path
				d="M70 25 L75 15 L80 25 L75 20 Z"
				className="fill-accent"
				opacity="0.6"
			/>
			<path
				d="M15 50 L20 40 L25 50 L20 45 Z"
				className="fill-accent"
				opacity="0.4"
			/>
			{/* Face - friendly but cool */}
			<ellipse cx="38" cy="42" rx="6" ry="7" className="fill-background" />
			<ellipse cx="62" cy="42" rx="6" ry="7" className="fill-background" />
			<circle cx="39" cy="43" r="3" className="fill-primary" />
			<circle cx="63" cy="43" r="3" className="fill-primary" />
			{/* Cold breath vapor */}
			<ellipse
				cx="50"
				cy="65"
				rx="8"
				ry="4"
				className="fill-background/40"
			/>
			<ellipse
				cx="55"
				cy="72"
				rx="6"
				ry="3"
				className="fill-background/30"
			/>
			{/* Scarf */}
			<path
				d="M25 55 Q30 58 35 55 Q40 52 45 55 Q50 58 55 55 Q60 52 65 55 Q70 58 75 55"
				fill="none"
				className="stroke-secondary"
				strokeWidth="4"
				strokeLinecap="round"
			/>
			<path d="M75 55 L80 75 L72 72 L78 65" className="fill-secondary" />
		</svg>
	)
}

function VintageProphet() {
	return (
		<svg viewBox="0 0 100 100" className="w-full h-full">
			{/* Worn paper effect border */}
			<rect
				x="5"
				y="5"
				width="90"
				height="90"
				rx="4"
				className="fill-card stroke-border"
				strokeWidth="3"
			/>
			<rect
				x="10"
				y="10"
				width="80"
				height="80"
				rx="2"
				fill="none"
				className="stroke-border/50"
				strokeWidth="1"
			/>
			{/* Classic puck illustration */}
			<ellipse cx="50" cy="55" rx="30" ry="20" className="fill-foreground" />
			<ellipse cx="50" cy="50" rx="28" ry="18" className="fill-muted" />
			<ellipse cx="50" cy="48" rx="20" ry="12" className="fill-foreground/20" />
			{/* Vintage mustache */}
			<path
				d="M35 52 Q40 58 50 55 Q60 58 65 52"
				fill="none"
				className="stroke-foreground"
				strokeWidth="3"
				strokeLinecap="round"
			/>
			{/* Top hat */}
			<rect x="35" y="20" width="30" height="20" className="fill-foreground" />
			<rect x="30" y="38" width="40" height="5" className="fill-foreground" />
			<rect
				x="38"
				y="25"
				width="24"
				height="2"
				className="fill-accent"
				opacity="0.8"
			/>
			{/* Monocle */}
			<circle
				cx="62"
				cy="45"
				r="8"
				fill="none"
				className="stroke-accent"
				strokeWidth="2"
			/>
			<line
				x1="68"
				y1="50"
				x2="75"
				y2="65"
				className="stroke-accent"
				strokeWidth="1"
			/>
			{/* Banner */}
			<path
				d="M15 75 L25 72 L75 72 L85 75 L75 78 L25 78 Z"
				className="fill-primary"
			/>
			<text
				x="50"
				y="77"
				textAnchor="middle"
				className="fill-primary-foreground text-[6px] font-bold"
			>
				EST. 1972
			</text>
		</svg>
	)
}

export default ProphetCharacter
