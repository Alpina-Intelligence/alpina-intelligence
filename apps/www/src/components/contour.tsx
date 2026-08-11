/**
 * Signature element: topographic contour lines — the survey-map vernacular of the
 * Alpina identity. Pure stroke work in currentColor so the theme pass recolors it
 * for free. Decorative only; hidden from AT.
 */
export function Contour({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 720 560"
			fill="none"
			aria-hidden="true"
			className={className}
		>
			<g stroke="currentColor" strokeWidth="1.25">
				<path d="M576 44c-84-18-192-8-252 34-57 40-64 104-118 142-49 34-122 40-158 88-33 44-26 108 4 152" />
				<path d="M596 92c-70-14-158-4-208 32-48 34-56 88-102 122-42 30-104 36-134 76-28 37-22 90 2 126" />
				<path d="M614 140c-56-10-124-1-164 28-39 29-47 73-86 102-35 26-86 32-110 64-23 30-18 71 0 100" />
				<path d="M630 188c-42-7-90 2-120 24-30 23-38 57-70 82-28 22-68 27-86 52-17 24-14 53-1 74" />
				<path d="M644 236c-28-4-56 4-76 20-20 17-28 42-52 62-21 17-49 22-62 40-12 17-10 36-2 48" />
				<path d="M654 284c-14-2-27 5-36 15-10 12-16 28-32 42-14 12-30 16-38 27-7 11-6 21-2 28" />
			</g>
			{/* spot elevation marks */}
			<g fill="currentColor">
				<circle cx="646" cy="318" r="3" />
				<circle cx="238" cy="180" r="3" />
				<circle cx="120" cy="420" r="3" />
			</g>
			<g
				fill="currentColor"
				fontFamily="var(--font-mono, monospace)"
				fontSize="11"
			>
				<text x="656" y="322">
					2 941
				</text>
				<text x="248" y="184">
					2 210
				</text>
				<text x="130" y="424">
					1 764
				</text>
			</g>
		</svg>
	);
}
