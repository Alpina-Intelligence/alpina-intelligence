import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProphetCharacter } from './ProphetCharacter'
import { ProphetQuote } from './ProphetQuote'
import { TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Prediction {
	teamName: string
	prediction: 'rise' | 'fall' | 'steady'
	confidence: number
	reason: string
}

interface PredictionCardProps {
	prediction?: Prediction
	className?: string
}

const defaultPrediction: Prediction = {
	teamName: 'Your Team',
	prediction: 'rise',
	confidence: 85,
	reason: 'Strong upcoming matchups and healthy roster',
}

export function PredictionCard({
	prediction = defaultPrediction,
	className,
}: PredictionCardProps) {
	const TrendIcon =
		prediction.prediction === 'rise'
			? TrendingUp
			: prediction.prediction === 'fall'
				? TrendingDown
				: Minus

	const trendColor =
		prediction.prediction === 'rise'
			? 'text-green-500'
			: prediction.prediction === 'fall'
				? 'text-red-500'
				: 'text-yellow-500'

	const trendLabel =
		prediction.prediction === 'rise'
			? 'Rising'
			: prediction.prediction === 'fall'
				? 'Falling'
				: 'Steady'

	return (
		<Card className={cn('overflow-hidden', className)}>
			<CardHeader className="pb-2">
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2 text-lg">
						<Sparkles className="h-5 w-5 text-accent" />
						Prophet's Prediction
					</CardTitle>
					<Badge variant="secondary" className="text-xs">
						{prediction.confidence}% confident
					</Badge>
				</div>
			</CardHeader>
			<CardContent>
				<div className="flex gap-4">
					<div className="flex-shrink-0">
						<ProphetCharacter size="sm" animated={false} />
					</div>
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2 mb-2">
							<span className="font-semibold truncate">
								{prediction.teamName}
							</span>
							<div className={cn('flex items-center gap-1', trendColor)}>
								<TrendIcon className="h-4 w-4" />
								<span className="text-sm font-medium">{trendLabel}</span>
							</div>
						</div>
						<p className="text-sm text-muted-foreground mb-3">
							{prediction.reason}
						</p>
						<ProphetQuote className="text-sm" />
					</div>
				</div>
			</CardContent>
		</Card>
	)
}

export default PredictionCard
