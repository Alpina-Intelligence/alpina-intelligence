import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ProphetCharacter } from '@/components/PuckProphet/ProphetCharacter'
import { ProphetQuote } from '@/components/PuckProphet/ProphetQuote'
import { useTheme } from '@/hooks/useTheme'
import { themes, THEME_NAMES } from '@/lib/themes'
import {
	Users,
	Target,
	TrendingUp,
	Sparkles,
	ChevronRight,
	Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/')({ component: LandingPage })

function LandingPage() {
	const { theme, setTheme } = useTheme()

	const features = [
		{
			icon: Users,
			title: 'Create Pools',
			description:
				'Invite friends, set rules, and compete for hockey glory. Private or public leagues.',
		},
		{
			icon: Target,
			title: 'Draft Players',
			description:
				'Build your dream roster with our intuitive draft system. Real-time picks and trades.',
		},
		{
			icon: TrendingUp,
			title: 'Track Points',
			description:
				'Live scoring, detailed stats, and automatic updates. Never miss a goal.',
		},
	]

	return (
		<div className="relative overflow-hidden">
			{/* Decorative background elements */}
			<div className="absolute inset-0 pointer-events-none overflow-hidden">
				<div className="absolute top-20 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
				<div className="absolute top-40 -right-20 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
				<div className="absolute bottom-20 left-1/3 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
			</div>

			{/* Hero Section */}
			<section className="relative pt-12 pb-20 px-4">
				<div className="container mx-auto max-w-6xl">
					<div className="grid lg:grid-cols-2 gap-12 items-center">
						{/* Left: Content */}
						<div className="space-y-8">
							<div className="space-y-4">
								<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
									<Sparkles className="h-4 w-4" />
									<span>Powered by Ancient Hockey Wisdom</span>
								</div>
								<h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[0.9]">
									<span className="block text-foreground">The Puck</span>
									<span className="block bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
										Prophet
									</span>
								</h1>
								<p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
									Your mystical guide to hockey pool domination. Create pools,
									draft legends, and let the Prophet reveal your path to
									victory.
								</p>
							</div>

							<div className="flex flex-wrap gap-4">
								<Button size="lg" className="gap-2 text-lg px-8">
									Start Your Pool
									<ChevronRight className="h-5 w-5" />
								</Button>
								<Button size="lg" variant="outline" className="gap-2 text-lg">
									<Zap className="h-5 w-5" />
									Join a Pool
								</Button>
							</div>

							{/* Prophet Quote */}
							<div className="relative bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 max-w-md">
								<div className="absolute -top-3 left-4 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full uppercase tracking-wider">
									The Prophet Speaks
								</div>
								<ProphetQuote className="text-lg" autoRotate interval={6000} />
							</div>
						</div>

						{/* Right: Prophet Character */}
						<div className="relative flex justify-center lg:justify-end">
							<div className="relative">
								{/* Glow effect behind character */}
								<div className="absolute inset-0 scale-150 bg-gradient-to-br from-primary/20 via-secondary/10 to-transparent rounded-full blur-3xl" />
								<ProphetCharacter size="xl" className="relative z-10" />
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className="relative py-20 px-4 bg-muted/30">
				<div className="container mx-auto max-w-6xl">
					<div className="text-center mb-16">
						<h2 className="text-3xl md:text-4xl font-bold mb-4">
							Everything You Need to Dominate
						</h2>
						<p className="text-muted-foreground text-lg max-w-2xl mx-auto">
							From draft day to championship glory, we've got the tools to make
							your hockey pool legendary.
						</p>
					</div>

					<div className="grid md:grid-cols-3 gap-8">
						{features.map((feature) => (
							<Card
								key={feature.title}
								className={cn(
									'group relative overflow-hidden border-2 transition-all duration-300 hover:border-primary hover:shadow-xl hover:-translate-y-1',
									'bg-gradient-to-br from-card to-card/50'
								)}
							>
								<CardContent className="p-8">
									<div className="relative z-10">
										<div
											className={cn(
												'inline-flex items-center justify-center w-14 h-14 rounded-xl mb-6 transition-transform group-hover:scale-110',
												'bg-primary/10 text-primary'
											)}
										>
											<feature.icon className="h-7 w-7" />
										</div>
										<h3 className="text-xl font-bold mb-3">{feature.title}</h3>
										<p className="text-muted-foreground leading-relaxed">
											{feature.description}
										</p>
									</div>
									{/* Decorative corner accent */}
									<div className="absolute -bottom-6 -right-6 w-24 h-24 bg-primary/5 rounded-full transition-transform group-hover:scale-150" />
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* Theme Showcase Section */}
			<section className="relative py-20 px-4">
				<div className="container mx-auto max-w-6xl">
					<div className="text-center mb-12">
						<h2 className="text-3xl md:text-4xl font-bold mb-4">
							Choose Your Style
						</h2>
						<p className="text-muted-foreground text-lg">
							Switch themes to find the look that matches your vibe
						</p>
					</div>

					<div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-3xl mx-auto">
						{THEME_NAMES.map((themeName) => {
							const themeData = themes[themeName]
							const isActive = theme === themeName
							const Icon = themeData.icon

							return (
								<button
									type="button"
									key={themeName}
									onClick={() => setTheme(themeName)}
									className={cn(
										'group relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all duration-300',
										isActive
											? 'border-primary bg-primary/10 shadow-lg scale-105'
											: 'border-border bg-card hover:border-primary/50 hover:bg-muted/50'
									)}
								>
									{/* Preview colors */}
									<div className="flex gap-1 mb-2">
										<div
											className="w-4 h-4 rounded-full ring-1 ring-border/50"
											style={{
												backgroundColor: themeData.previewColors.primary,
											}}
										/>
										<div
											className="w-4 h-4 rounded-full ring-1 ring-border/50"
											style={{
												backgroundColor: themeData.previewColors.secondary,
											}}
										/>
									</div>
									<Icon
										className={cn(
											'h-6 w-6 transition-colors',
											isActive ? 'text-primary' : 'text-muted-foreground'
										)}
									/>
									<span
										className={cn(
											'text-sm font-medium',
											isActive ? 'text-primary' : 'text-foreground'
										)}
									>
										{themeData.label}
									</span>
									{isActive && (
										<div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
									)}
								</button>
							)
						})}
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="relative py-20 px-4 bg-primary text-primary-foreground">
				<div className="container mx-auto max-w-4xl text-center">
					<div className="inline-block mb-8">
						<ProphetCharacter size="lg" animated={false} />
					</div>
					<h2 className="text-3xl md:text-4xl font-bold mb-4">
						Ready to Consult the Prophet?
					</h2>
					<p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
						Join thousands of hockey fans who trust the Puck Prophet to guide
						their pools to glory.
					</p>
					<div className="flex flex-wrap justify-center gap-4">
						<Button
							size="lg"
							variant="secondary"
							className="text-lg px-8 gap-2"
						>
							Create Your First Pool
							<ChevronRight className="h-5 w-5" />
						</Button>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="py-8 px-4 border-t border-border">
				<div className="container mx-auto max-w-6xl">
					<div className="flex flex-col md:flex-row items-center justify-between gap-4">
						<div className="flex items-center gap-2 text-muted-foreground">
							<span className="text-sm">
								&copy; 2024 Puck Prophet. All rights reserved.
							</span>
						</div>
						<div className="flex items-center gap-6 text-sm text-muted-foreground">
							<button
								type="button"
								className="hover:text-foreground transition-colors"
							>
								Terms
							</button>
							<button
								type="button"
								className="hover:text-foreground transition-colors"
							>
								Privacy
							</button>
							<button
								type="button"
								className="hover:text-foreground transition-colors"
							>
								Contact
							</button>
						</div>
					</div>
				</div>
			</footer>
		</div>
	)
}
