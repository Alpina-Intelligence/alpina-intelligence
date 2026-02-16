import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { RankBadge } from './RankBadge'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface LeaderboardEntry {
	rank: number
	teamName: string
	ownerName: string
	points: number
	change: number
	isCurrentUser?: boolean
}

interface LeaderboardRowProps {
	entry: LeaderboardEntry
}

export function LeaderboardRow({ entry }: LeaderboardRowProps) {
	const TrendIcon =
		entry.change > 0 ? TrendingUp : entry.change < 0 ? TrendingDown : Minus
	const trendColor =
		entry.change > 0
			? 'text-green-500'
			: entry.change < 0
				? 'text-red-500'
				: 'text-muted-foreground'

	return (
		<div
			className={cn(
				'flex items-center gap-4 p-4 rounded-lg transition-colors',
				entry.isCurrentUser
					? 'bg-primary/10 border border-primary/30'
					: 'hover:bg-muted/50'
			)}
		>
			<RankBadge rank={entry.rank} />

			<Avatar className="h-10 w-10">
				<AvatarFallback className="bg-muted font-medium">
					{entry.ownerName
						.split(' ')
						.map((n) => n[0])
						.join('')
						.toUpperCase()
						.slice(0, 2)}
				</AvatarFallback>
			</Avatar>

			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2">
					<span className="font-semibold truncate">{entry.teamName}</span>
					{entry.isCurrentUser && (
						<Badge variant="secondary" className="text-xs">
							You
						</Badge>
					)}
				</div>
				<span className="text-sm text-muted-foreground">{entry.ownerName}</span>
			</div>

			<div className="flex items-center gap-4">
				<div className={cn('flex items-center gap-1 text-sm', trendColor)}>
					<TrendIcon className="h-4 w-4" />
					<span className="font-medium">
						{entry.change > 0 ? `+${entry.change}` : entry.change}
					</span>
				</div>
				<div className="text-right min-w-[60px]">
					<span className="text-xl font-bold">{entry.points}</span>
					<span className="text-xs text-muted-foreground block">pts</span>
				</div>
			</div>
		</div>
	)
}

export default LeaderboardRow
