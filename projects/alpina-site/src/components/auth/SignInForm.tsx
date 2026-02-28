import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface SignInData {
	email: string;
	password: string;
}

interface SignInFormProps {
	onSubmit: (data: SignInData) => void;
	error?: string;
	loading?: boolean;
}

export function SignInForm({ onSubmit, error, loading }: SignInFormProps) {
	const id = useId();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		onSubmit({ email, password });
	}

	return (
		<Card className="w-full max-w-sm">
			<CardHeader>
				<CardTitle>Sign In</CardTitle>
				<CardDescription>
					Enter your credentials to continue.
				</CardDescription>
			</CardHeader>
			<form onSubmit={handleSubmit}>
				<CardContent className="flex flex-col gap-4">
					{error && (
						<p className="text-xs text-status-error font-mono">
							{error}
						</p>
					)}
					<div className="flex flex-col gap-1.5">
						<Label htmlFor={`${id}-email`}>Email</Label>
						<Input
							id={`${id}-email`}
							type="email"
							placeholder="you@example.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							disabled={loading}
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor={`${id}-password`}>Password</Label>
						<Input
							id={`${id}-password`}
							type="password"
							placeholder="••••••••"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							disabled={loading}
						/>
					</div>
				</CardContent>
				<CardFooter>
					<Button type="submit" className="w-full" disabled={loading}>
						{loading ? "Signing in..." : "Sign In"}
					</Button>
				</CardFooter>
			</form>
		</Card>
	);
}
