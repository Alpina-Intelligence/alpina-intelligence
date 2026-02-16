import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Users, Trophy, Calendar, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Pool {
	id: string
	name: string
	memberCount: number
	maxMembers: number
	userRank: number
	userPoints: number
	status: 'active' | 'draft' | 'completed'
	draftDate?: string
	commissioner: string
}

interface PoolCardProps {
	pool: Pool
	className?: string
}

const statusConfig = {
	active: { label: 'Active', variant: 'default' as const },
	draft: { label: 'Draft Pending', variant: 'secondary' as const },
	completed: { label: 'Completed', variant: 'outline' as const },
}

export function PoolCard({ pool, className }: PoolCardProps) {
	const status = statusConfig[pool.status]

	return (
		<Card
			className={cn(
				'group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/50',
				className
			)}
		>
			<CardHeader className="pb-2">
				<div className="flex items-start justify-between gap-4">
					<div className="flex-1 min-w-0">
						<h3 className="font-bold text-lg truncate group-hover:text-primary transition-colors">
							{pool.name}
						</h3>
						<p className="text-sm text-muted-foreground">
							Commish: {pool.commissioner}
						</p>
					</div>
					<Badge variant={status.variant}>{status.label}</Badge>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Stats Row */}
				<div className="grid grid-cols-3 gap-4 text-center">
					<div className="space-y-1">
						<div className="flex items-center justify-center gap-1 text-muted-foreground">
							<Users className="h-4 w-4" />
						</div>
						<p className="text-lg font-bold">
							{pool.memberCount}/{pool.maxMembers}
						</p>
						<p className="text-xs text-muted-foreground">Members</p>
					</div>
					<div className="space-y-1">
						<div className="flex items-center justify-center gap-1 text-muted-foreground">
							<Trophy className="h-4 w-4" />
						</div>
						<p className="text-lg font-bold">#{pool.userRank}</p>
						<p className="text-xs text-muted-foreground">Your Rank</p>
					</div>
					<div className="space-y-1">
						<div className="flex items-center justify-center gap-1 text-primary">
							<span className="text-lg font-bold">{pool.userPoints}</span>
						</div>
						<p className="text-xs text-muted-foreground">Points</p>
					</div>
				</div>

				{/* Member Avatars */}
				<div className="flex items-center justify-between">
					<div className="flex -space-x-2">
						{Array.from({ length: Math.min(pool.memberCount, 5) }).map(
							(_, i) => (
								<Avatar
									key={i}
									className="h-8 w-8 border-2 border-background"
								>
									<AvatarFallback className="text-xs bg-muted">
										{String.fromCharCode(65 + i)}
									</AvatarFallback>
								</Avatar>
							)
						)}
						{pool.memberCount > 5 && (
							<div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted border-2 border-background text-xs font-medium">
								+{pool.memberCount - 5}
							</div>
						)}
					</div>
					<Button size="sm" variant="ghost" className="gap-1">
						View Pool
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>

				{/* Draft date if applicable */}
				{pool.status === 'draft' && pool.draftDate && (
					<div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t border-border">
						<Calendar className="h-4 w-4" />
						<span>Draft: {pool.draftDate}</span>
					</div>
				)}
			</CardContent>
		</Card>
	)
}

export default PoolCard
