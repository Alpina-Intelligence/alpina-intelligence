import { MountainsIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { Separator } from "#/components/ui/separator.tsx";

export function SiteFooter() {
	return (
		<footer className="border-t">
			<div className="mx-auto max-w-6xl px-4 py-12">
				<div className="flex flex-col justify-between gap-8 md:flex-row">
					<div className="max-w-xs space-y-3">
						<div className="flex items-center gap-2 font-semibold">
							<MountainsIcon size={20} weight="fill" />
							Alpina Intelligence
						</div>
						<p className="text-muted-foreground text-sm">
							Data platforms and AI systems, built to run without us. Calgary ·
							remote everywhere.
						</p>
					</div>
					<div className="grid grid-cols-2 gap-12 text-sm sm:grid-cols-3">
						<div className="space-y-2">
							<div className="font-medium">Work</div>
							<ul className="space-y-2 text-muted-foreground">
								<li>
									<Link
										to="/"
										hash="services"
										className="hover:text-foreground"
									>
										Services
									</Link>
								</li>
								<li>
									<Link
										to="/"
										hash="approach"
										className="hover:text-foreground"
									>
										Approach
									</Link>
								</li>
								<li>
									<Link to="/" hash="faq" className="hover:text-foreground">
										FAQ
									</Link>
								</li>
							</ul>
						</div>
						<div className="space-y-2">
							<div className="font-medium">Writing</div>
							<ul className="space-y-2 text-muted-foreground">
								<li>
									<Link to="/blog" className="hover:text-foreground">
										Field notes
									</Link>
								</li>
							</ul>
						</div>
						<div className="space-y-2">
							<div className="font-medium">Contact</div>
							<ul className="space-y-2 text-muted-foreground">
								<li>
									<a
										href="mailto:hello@alpina-intelligence.com"
										className="hover:text-foreground"
									>
										hello@alpina-intelligence.com
									</a>
								</li>
							</ul>
						</div>
					</div>
				</div>
				<Separator className="my-8" />
				<p className="text-muted-foreground text-xs">
					© {new Date().getFullYear()} Alpina Intelligence Ltd. Surveyed, not
					guessed.
				</p>
			</div>
		</footer>
	);
}
