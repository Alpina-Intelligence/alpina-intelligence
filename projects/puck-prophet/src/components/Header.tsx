import { useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { Menu, X, Home, LayoutDashboard, Trophy, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { cn } from '@/lib/utils'

const navLinks = [
	{ to: '/', label: 'Home', icon: Home },
	{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
	{ to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
] as const

function PuckLogo({ className }: { className?: string }) {
	return (
		<div className={cn('relative', className)}>
			<Circle className="h-8 w-8 fill-primary text-primary" strokeWidth={0} />
			<div className="absolute inset-0 flex items-center justify-center">
				<div className="h-2 w-2 rounded-full bg-primary-foreground" />
			</div>
		</div>
	)
}

export default function Header() {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
	const location = useLocation()

	return (
		<header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container mx-auto px-4">
				<div className="flex h-16 items-center justify-between">
					{/* Logo */}
					<Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
						<PuckLogo />
						<div className="flex flex-col">
							<span className="font-bold text-lg leading-none">Puck Prophet</span>
							<span className="text-xs text-muted-foreground leading-none mt-0.5">
								Hockey Pool Manager
							</span>
						</div>
					</Link>

					{/* Desktop Navigation */}
					<nav className="hidden md:flex items-center gap-1">
						{navLinks.map((link) => {
							const isActive = location.pathname === link.to
							const Icon = link.icon
							return (
								<Link
									key={link.to}
									to={link.to}
									className={cn(
										'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
										isActive
											? 'bg-primary text-primary-foreground'
											: 'text-muted-foreground hover:text-foreground hover:bg-muted'
									)}
								>
									<Icon className="h-4 w-4" />
									{link.label}
								</Link>
							)
						})}
					</nav>

					{/* Right Side Actions */}
					<div className="flex items-center gap-2">
						<ThemeSwitcher />

						{/* Mobile Menu Toggle */}
						<Button
							variant="ghost"
							size="icon"
							className="md:hidden"
							onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
						>
							{mobileMenuOpen ? (
								<X className="h-5 w-5" />
							) : (
								<Menu className="h-5 w-5" />
							)}
						</Button>
					</div>
				</div>

				{/* Mobile Navigation */}
				{mobileMenuOpen && (
					<nav className="md:hidden py-4 border-t border-border">
						<div className="flex flex-col gap-1">
							{navLinks.map((link) => {
								const isActive = location.pathname === link.to
								const Icon = link.icon
								return (
									<Link
										key={link.to}
										to={link.to}
										onClick={() => setMobileMenuOpen(false)}
										className={cn(
											'flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors',
											isActive
												? 'bg-primary text-primary-foreground'
												: 'text-muted-foreground hover:text-foreground hover:bg-muted'
										)}
									>
										<Icon className="h-5 w-5" />
										{link.label}
									</Link>
								)
							})}
						</div>
					</nav>
				)}
			</div>
		</header>
	)
}
