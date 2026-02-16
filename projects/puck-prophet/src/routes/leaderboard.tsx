import { createFileRoute } from '@tanstack/react-router'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable'
import { ProphetCharacter } from '@/components/PuckProphet/ProphetCharacter'
import { ProphetQuote } from '@/components/PuckProphet/ProphetQuote'
import type { LeaderboardEntry } from '@/components/leaderboard/LeaderboardRow'
import { MessageSquare } from 'lucide-react'

export const Route = createFileRoute('/leaderboard')({ component: Leaderboard })

// Demo data for different pools
const poolData: Record<string, LeaderboardEntry[]> = {
	office: [
		{
			rank: 1,
			teamName: 'Maple Leaf Maulers',
			ownerName: 'Sarah K.',
			points: 412,
			change: 2,
		},
		{
			rank: 2,
			teamName: 'Puck Dynasty',
			ownerName: 'You',
			points: 389,
			change: 1,
			isCurrentUser: true,
		},
		{
			rank: 3,
			teamName: 'Ice Breakers',
			ownerName: 'Mike S.',
			points: 367,
			change: -1,
		},
		{
			rank: 4,
			teamName: 'Hat Trick Heroes',
			ownerName: 'Dave M.',
			points: 345,
			change: 0,
		},
		{
			rank: 5,
			teamName: 'Slapshot Squad',
			ownerName: 'Lisa P.',
			points: 332,
			change: -2,
		},
		{
			rank: 6,
			teamName: 'Zamboni Riders',
			ownerName: 'Tom B.',
			points: 318,
			change: 1,
		},
		{
			rank: 7,
			teamName: 'Power Play Kings',
			ownerName: 'Amy L.',
			points: 301,
			change: -1,
		},
		{
			rank: 8,
			teamName: 'Penalty Box Pros',
			ownerName: 'Chris R.',
			points: 289,
			change: 0,
		},
	],
	family: [
		{
			rank: 1,
			teamName: "Dad's Favorites",
			ownerName: 'You',
			points: 289,
			change: 0,
			isCurrentUser: true,
		},
		{
			rank: 2,
			teamName: 'Mom Knows Best',
			ownerName: 'Mom',
			points: 276,
			change: 1,
		},
		{
			rank: 3,
			teamName: 'Sibling Rivalry',
			ownerName: 'Brother',
			points: 258,
			change: -1,
		},
		{
			rank: 4,
			teamName: 'Grandpa Goals',
			ownerName: 'Grandpa',
			points: 234,
			change: 2,
		},
		{
			rank: 5,
			teamName: 'Cousin Crushers',
			ownerName: 'Cousin Jake',
			points: 221,
			change: -2,
		},
		{
			rank: 6,
			teamName: 'Auntie Offense',
			ownerName: 'Aunt Sue',
			points: 198,
			change: 0,
		},
	],
	reddit: [
		{
			rank: 1,
			teamName: 'xX_PuckMaster_Xx',
			ownerName: 'HockeyFan99',
			points: 523,
			change: 0,
		},
		{
			rank: 2,
			teamName: 'Reddit Rangers',
			ownerName: 'PM_ME_GOALS',
			points: 498,
			change: 3,
		},
		{
			rank: 3,
			teamName: 'Upvote United',
			ownerName: 'IceCold_Takes',
			points: 487,
			change: -1,
		},
		{
			rank: 4,
			teamName: 'Karma Kings',
			ownerName: 'You',
			points: 456,
			change: 2,
			isCurrentUser: true,
		},
		{
			rank: 5,
			teamName: 'Lurker Legends',
			ownerName: 'SilentSniper',
			points: 445,
			change: -2,
		},
	],
}

const prophetCommentary: Record<string, string> = {
	office:
		"Sarah's team has been hot lately, but I sense a change in the ice... your time may come soon.",
	family:
		"Leading the family pool! But beware - Mom's team is making moves behind the scenes.",
	reddit:
		'The competition is fierce here. Stay sharp and trust your gut on those waiver pickups.',
}

function Leaderboard() {
	return (
		<div className="min-h-screen">
			{/* Header */}
			<section className="border-b border-border bg-muted/30">
				<div className="container mx-auto px-4 py-8">
					<h1 className="text-3xl font-bold">Leaderboards</h1>
					<p className="text-muted-foreground">
						Track your standing across all your pools
					</p>
				</div>
			</section>

			<div className="container mx-auto px-4 py-8">
				<Tabs defaultValue="office" className="space-y-6">
					<TabsList className="grid w-full max-w-md grid-cols-3">
						<TabsTrigger value="office">Office League</TabsTrigger>
						<TabsTrigger value="family">Family Feud</TabsTrigger>
						<TabsTrigger value="reddit">Reddit Pool</TabsTrigger>
					</TabsList>

					{Object.entries(poolData).map(([poolId, entries]) => (
						<TabsContent key={poolId} value={poolId} className="space-y-6">
							<div className="grid lg:grid-cols-3 gap-6">
								{/* Main Leaderboard */}
								<div className="lg:col-span-2">
									<LeaderboardTable
										entries={entries}
										title={`${poolId.charAt(0).toUpperCase() + poolId.slice(1)} Pool Standings`}
									/>
								</div>

								{/* Prophet Commentary */}
								<div className="space-y-6">
									<Card>
										<CardHeader>
											<CardTitle className="flex items-center gap-2 text-lg">
												<MessageSquare className="h-5 w-5 text-primary" />
												Prophet's Analysis
											</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="flex gap-4">
												<ProphetCharacter size="sm" animated={false} />
												<div className="flex-1">
													<p className="text-sm text-muted-foreground italic mb-4">
														"{prophetCommentary[poolId]}"
													</p>
													<ProphetQuote className="text-xs" />
												</div>
											</div>
										</CardContent>
									</Card>

									{/* Pool Stats */}
									<Card>
										<CardHeader>
											<CardTitle className="text-lg">Pool Stats</CardTitle>
										</CardHeader>
										<CardContent className="space-y-4">
											<StatRow
												label="Total Teams"
												value={entries.length.toString()}
											/>
											<StatRow
												label="Your Position"
												value={`#${entries.find((e) => e.isCurrentUser)?.rank || '-'}`}
											/>
											<StatRow
												label="Points Behind Leader"
												value={calculatePointsBehind(entries)}
											/>
											<StatRow
												label="Week's Top Scorer"
												value={entries[0]?.teamName || '-'}
											/>
										</CardContent>
									</Card>
								</div>
							</div>
						</TabsContent>
					))}
				</Tabs>
			</div>
		</div>
	)
}

function StatRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex justify-between items-center">
			<span className="text-sm text-muted-foreground">{label}</span>
			<span className="font-medium">{value}</span>
		</div>
	)
}

function calculatePointsBehind(entries: LeaderboardEntry[]): string {
	const userEntry = entries.find((e) => e.isCurrentUser)
	if (!userEntry) return '-'
	if (userEntry.rank === 1) return '0 (Leading!)'
	const leader = entries[0]
	return `${leader.points - userEntry.points} pts`
}
