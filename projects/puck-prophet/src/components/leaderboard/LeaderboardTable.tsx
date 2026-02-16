import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LeaderboardRow, type LeaderboardEntry } from './LeaderboardRow'
import { Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LeaderboardTableProps {
	entries: LeaderboardEntry[]
	title?: string
	className?: string
}

export function LeaderboardTable({
	entries,
	title = 'Standings',
	className,
}: LeaderboardTableProps) {
	const topThree = entries.slice(0, 3)
	const rest = entries.slice(3)

	return (
		<Card className={cn('overflow-hidden', className)}>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Trophy className="h-5 w-5 text-primary" />
					{title}
				</CardTitle>
			</CardHeader>
			<CardContent className="p-0">
				{/* Top 3 Podium */}
				{topThree.length > 0 && (
					<div className="px-6 pb-6">
						<div className="grid grid-cols-3 gap-4 items-end">
							{/* Second Place */}
							{topThree[1] && (
								<PodiumSpot entry={topThree[1]} position={2} />
							)}
							{/* First Place */}
							{topThree[0] && (
								<PodiumSpot entry={topThree[0]} position={1} />
							)}
							{/* Third Place */}
							{topThree[2] && (
								<PodiumSpot entry={topThree[2]} position={3} />
							)}
						</div>
					</div>
				)}

				{/* Rest of the leaderboard */}
				{rest.length > 0 && (
					<div className="border-t border-border px-4 py-2 space-y-1">
						{rest.map((entry) => (
							<LeaderboardRow key={entry.rank} entry={entry} />
						))}
					</div>
				)}
			</CardContent>
		</Card>
	)
}

interface PodiumSpotProps {
	entry: LeaderboardEntry
	position: 1 | 2 | 3
}

function PodiumSpot({ entry, position }: PodiumSpotProps) {
	const heights = {
		1: 'h-28',
		2: 'h-20',
		3: 'h-16',
	}

	const colors = {
		1: 'from-yellow-500/20 to-yellow-600/5 border-yellow-500/30',
		2: 'from-gray-400/20 to-gray-500/5 border-gray-400/30',
		3: 'from-orange-500/20 to-orange-600/5 border-orange-500/30',
	}

	const medals = {
		1: '🥇',
		2: '🥈',
		3: '🥉',
	}

	return (
		<div
			className={cn(
				'flex flex-col items-center text-center',
				position === 1 && 'order-2',
				position === 2 && 'order-1',
				position === 3 && 'order-3'
			)}
		>
			<div className="mb-2">
				<span className="text-2xl">{medals[position]}</span>
			</div>
			<div
				className={cn(
					'w-full rounded-t-lg border-t border-x bg-gradient-to-b p-3',
					heights[position],
					colors[position],
					entry.isCurrentUser && 'ring-2 ring-primary'
				)}
			>
				<p className="font-bold text-sm truncate">{entry.teamName}</p>
				<p className="text-xs text-muted-foreground truncate">
					{entry.ownerName}
				</p>
				<p className="text-lg font-bold mt-1">{entry.points}</p>
			</div>
		</div>
	)
}

export default LeaderboardTable
