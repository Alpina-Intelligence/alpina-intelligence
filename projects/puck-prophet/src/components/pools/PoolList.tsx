import { PoolCard, type Pool } from './PoolCard'
import { cn } from '@/lib/utils'

interface PoolListProps {
	pools: Pool[]
	className?: string
}

export function PoolList({ pools, className }: PoolListProps) {
	if (pools.length === 0) {
		return (
			<div className="text-center py-12">
				<p className="text-muted-foreground">
					No pools yet. Create your first pool to get started!
				</p>
			</div>
		)
	}

	return (
		<div className={cn('grid gap-6 md:grid-cols-2 lg:grid-cols-3', className)}>
			{pools.map((pool) => (
				<PoolCard key={pool.id} pool={pool} />
			))}
		</div>
	)
}

export default PoolList
