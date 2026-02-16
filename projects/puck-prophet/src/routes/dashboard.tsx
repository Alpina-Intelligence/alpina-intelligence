import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { PoolList } from '@/components/pools/PoolList'
import { PredictionCard } from '@/components/PuckProphet/PredictionCard'
import { ProphetCharacter } from '@/components/PuckProphet/ProphetCharacter'
import type { Pool } from '@/components/pools/PoolCard'
import {
	Plus,
	UserPlus,
	Trophy,
	TrendingUp,
	Users,
	Zap,
	Bell,
	ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/dashboard')({ component: Dashboard })

// Demo data
const mockPools: Pool[] = [
	{
		id: '1',
		name: 'Office Champions League',
		memberCount: 8,
		maxMembers: 10,
		userRank: 2,
		userPoints: 342,
		status: 'active',
		commissioner: 'Mike S.',
	},
	{
		id: '2',
		name: 'Family Feud Hockey',
		memberCount: 6,
		maxMembers: 6,
		userRank: 1,
		userPoints: 289,
		status: 'active',
		commissioner: 'You',
	},
	{
		id: '3',
		name: 'Reddit NHL Pool',
		memberCount: 12,
		maxMembers: 16,
		userRank: 5,
		userPoints: 0,
		status: 'draft',
		draftDate: 'Dec 20, 2024',
		commissioner: 'HockeyFan99',
	},
]

const recentActivity = [
	{
		type: 'goal',
		message: 'Connor McDavid scored! +2 points',
		time: '2h ago',
	},
	{
		type: 'trade',
		message: 'Trade accepted in Office Champions League',
		time: '5h ago',
	},
	{
		type: 'rank',
		message: 'You moved up to #2 in Family Feud Hockey',
		time: '1d ago',
	},
	{
		type: 'join',
		message: 'New member joined Reddit NHL Pool',
		time: '2d ago',
	},
]

function Dashboard() {
	const totalPoints = mockPools.reduce((sum, pool) => sum + pool.userPoints, 0)
	const activePools = mockPools.filter((p) => p.status === 'active').length

	return (
		<div className="min-h-screen">
			{/* Header Section */}
			<section className="border-b border-border bg-muted/30">
				<div className="container mx-auto px-4 py-8">
					<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
						<div className="flex items-center gap-4">
							<div className="hidden sm:block">
								<ProphetCharacter size="sm" animated={false} />
							</div>
							<div>
								<h1 className="text-3xl font-bold">Welcome back, Champion!</h1>
								<p className="text-muted-foreground">
									The Prophet has been watching your progress...
								</p>
							</div>
						</div>
						<div className="flex gap-3">
							<Button className="gap-2">
								<Plus className="h-4 w-4" />
								Create Pool
							</Button>
							<Button variant="outline" className="gap-2">
								<UserPlus className="h-4 w-4" />
								Join Pool
							</Button>
						</div>
					</div>
				</div>
			</section>

			<div className="container mx-auto px-4 py-8">
				<div className="grid lg:grid-cols-3 gap-8">
					{/* Main Content */}
					<div className="lg:col-span-2 space-y-8">
						{/* Stats Cards */}
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							<StatCard
								icon={Trophy}
								label="Total Points"
								value={totalPoints.toString()}
								trend="+12%"
							/>
							<StatCard
								icon={Users}
								label="Active Pools"
								value={activePools.toString()}
							/>
							<StatCard
								icon={TrendingUp}
								label="Best Rank"
								value="#1"
								highlight
							/>
							<StatCard icon={Zap} label="Win Rate" value="67%" />
						</div>

						{/* Active Pools */}
						<div>
							<div className="flex items-center justify-between mb-6">
								<h2 className="text-2xl font-bold">Your Pools</h2>
								<Button variant="ghost" size="sm" className="gap-1">
									View All
									<ChevronRight className="h-4 w-4" />
								</Button>
							</div>
							<PoolList pools={mockPools} />
						</div>
					</div>

					{/* Sidebar */}
					<div className="space-y-6">
						{/* Prophet's Prediction */}
						<PredictionCard
							prediction={{
								teamName: 'Office Champions League',
								prediction: 'rise',
								confidence: 78,
								reason:
									'Strong week ahead with favorable matchups for your top scorers.',
							}}
						/>

						{/* Recent Activity */}
						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="flex items-center gap-2 text-lg">
									<Bell className="h-5 w-5" />
									Recent Activity
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-1">
								{recentActivity.map((activity, index) => (
									<div key={index}>
										{index > 0 && <Separator className="my-3" />}
										<div className="flex items-start gap-3">
											<ActivityIcon type={activity.type} />
											<div className="flex-1 min-w-0">
												<p className="text-sm">{activity.message}</p>
												<p className="text-xs text-muted-foreground">
													{activity.time}
												</p>
											</div>
										</div>
									</div>
								))}
							</CardContent>
						</Card>

						{/* Quick Actions */}
						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-lg">Quick Actions</CardTitle>
							</CardHeader>
							<CardContent className="grid grid-cols-2 gap-2">
								<Button variant="outline" size="sm" className="justify-start">
									<Trophy className="h-4 w-4 mr-2" />
									Standings
								</Button>
								<Button variant="outline" size="sm" className="justify-start">
									<Users className="h-4 w-4 mr-2" />
									My Team
								</Button>
								<Button variant="outline" size="sm" className="justify-start">
									<TrendingUp className="h-4 w-4 mr-2" />
									Stats
								</Button>
								<Button variant="outline" size="sm" className="justify-start">
									<Zap className="h-4 w-4 mr-2" />
									Trades
								</Button>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	)
}

interface StatCardProps {
	icon: typeof Trophy
	label: string
	value: string
	trend?: string
	highlight?: boolean
}

function StatCard({ icon: Icon, label, value, trend, highlight }: StatCardProps) {
	return (
		<Card className={cn(highlight && 'border-primary bg-primary/5')}>
			<CardContent className="p-4">
				<div className="flex items-center gap-2 mb-2">
					<Icon
						className={cn(
							'h-4 w-4',
							highlight ? 'text-primary' : 'text-muted-foreground'
						)}
					/>
					<span className="text-sm text-muted-foreground">{label}</span>
				</div>
				<div className="flex items-baseline gap-2">
					<span className="text-2xl font-bold">{value}</span>
					{trend && (
						<span className="text-xs text-green-500 font-medium">{trend}</span>
					)}
				</div>
			</CardContent>
		</Card>
	)
}

function ActivityIcon({ type }: { type: string }) {
	const iconClass = 'h-8 w-8 rounded-full flex items-center justify-center'

	switch (type) {
		case 'goal':
			return (
				<div className={cn(iconClass, 'bg-green-500/10 text-green-500')}>
					<Zap className="h-4 w-4" />
				</div>
			)
		case 'trade':
			return (
				<div className={cn(iconClass, 'bg-blue-500/10 text-blue-500')}>
					<TrendingUp className="h-4 w-4" />
				</div>
			)
		case 'rank':
			return (
				<div className={cn(iconClass, 'bg-yellow-500/10 text-yellow-500')}>
					<Trophy className="h-4 w-4" />
				</div>
			)
		default:
			return (
				<div className={cn(iconClass, 'bg-muted text-muted-foreground')}>
					<Users className="h-4 w-4" />
				</div>
			)
	}
}
