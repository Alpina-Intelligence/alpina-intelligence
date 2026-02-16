import { cn } from '@/lib/utils'
import { Trophy } from 'lucide-react'

interface RankBadgeProps {
	rank: number
	className?: string
}

export function RankBadge({ rank, className }: RankBadgeProps) {
	if (rank <= 3) {
		const colors = {
			1: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
			2: 'bg-gray-300/20 text-gray-500 border-gray-400/30',
			3: 'bg-orange-500/20 text-orange-600 border-orange-500/30',
		}

		return (
			<div
				className={cn(
					'flex items-center justify-center w-10 h-10 rounded-full border-2 font-bold',
					colors[rank as 1 | 2 | 3],
					className
				)}
			>
				{rank === 1 ? (
					<Trophy className="h-5 w-5" />
				) : (
					<span>{rank}</span>
				)}
			</div>
		)
	}

	return (
		<div
			className={cn(
				'flex items-center justify-center w-10 h-10 rounded-full bg-muted text-muted-foreground font-medium',
				className
			)}
		>
			{rank}
		</div>
	)
}

export default RankBadge
