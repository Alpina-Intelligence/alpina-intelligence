import { useId } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { type SignInData, signInSchema } from "@/lib/schemas/auth";

export type { SignInData };

interface SignInFormProps {
	onSubmit: (data: SignInData) => void;
	error?: string;
	loading?: boolean;
}

export function SignInForm({ onSubmit, error, loading }: SignInFormProps) {
	const id = useId();
	const form = useForm<SignInData>({
		resolver: zodResolver(signInSchema),
		defaultValues: { email: "", password: "" },
	});

	return (
		<Card className="w-full max-w-sm">
			<CardHeader>
				<CardTitle>Sign In</CardTitle>
				<CardDescription>
					Enter your credentials to continue.
				</CardDescription>
			</CardHeader>
			<form onSubmit={form.handleSubmit(onSubmit)}>
				<CardContent>
					<FieldGroup>
						{error && (
							<p className="text-xs text-destructive font-mono">
								{error}
							</p>
						)}
						<Controller
							name="email"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel htmlFor={`${id}-email`}>
										Email
									</FieldLabel>
									<Input
										{...field}
										id={`${id}-email`}
										type="email"
										placeholder="you@example.com"
										aria-invalid={fieldState.invalid}
										disabled={loading}
									/>
									{fieldState.invalid && (
										<FieldError
											errors={[fieldState.error]}
										/>
									)}
								</Field>
							)}
						/>
						<Controller
							name="password"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel htmlFor={`${id}-password`}>
										Password
									</FieldLabel>
									<Input
										{...field}
										id={`${id}-password`}
										type="password"
										placeholder="••••••••"
										aria-invalid={fieldState.invalid}
										disabled={loading}
									/>
									{fieldState.invalid && (
										<FieldError
											errors={[fieldState.error]}
										/>
									)}
								</Field>
							)}
						/>
					</FieldGroup>
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
