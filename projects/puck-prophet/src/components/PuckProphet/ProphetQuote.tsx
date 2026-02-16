import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const quotes = [
	"The ice whispers secrets to those who listen...",
	"I foresee a hat trick in your future!",
	"Trust the process, but verify the stats.",
	"Fortune favors the bold... and the well-drafted.",
	"The puck doesn't lie, but it does curve.",
	"Your opponent's weakness is their goaltender's five-hole.",
	"A trade deadline approaches... choose wisely.",
	"The hockey gods smile upon the prepared.",
	"Defense wins championships, but offense fills seats.",
	"Beware the third-period comeback...",
	"I've seen a thousand pools... yours has potential.",
	"The power play is strong with this one.",
	"Cross-check your roster before it cross-checks you.",
	"In the crease of destiny, timing is everything.",
	"The penalty box of life teaches patience.",
]

interface ProphetQuoteProps {
	className?: string
	autoRotate?: boolean
	interval?: number
}

export function ProphetQuote({
	className,
	autoRotate = false,
	interval = 5000,
}: ProphetQuoteProps) {
	const [quoteIndex, setQuoteIndex] = useState(0)
	const [isVisible, setIsVisible] = useState(true)

	useEffect(() => {
		// Random initial quote
		setQuoteIndex(Math.floor(Math.random() * quotes.length))
	}, [])

	useEffect(() => {
		if (!autoRotate) return

		const timer = setInterval(() => {
			setIsVisible(false)
			setTimeout(() => {
				setQuoteIndex((prev) => (prev + 1) % quotes.length)
				setIsVisible(true)
			}, 300)
		}, interval)

		return () => clearInterval(timer)
	}, [autoRotate, interval])

	return (
		<blockquote
			className={cn(
				'relative italic text-muted-foreground transition-opacity duration-300',
				!isVisible && 'opacity-0',
				className
			)}
		>
			<span className="text-2xl text-primary/50 absolute -left-2 -top-2">
				"
			</span>
			<p className="pl-4 pr-2">{quotes[quoteIndex]}</p>
			<span className="text-2xl text-primary/50 absolute -right-1 bottom-0">
				"
			</span>
		</blockquote>
	)
}

export function getRandomQuote(): string {
	return quotes[Math.floor(Math.random() * quotes.length)]
}

export default ProphetQuote
