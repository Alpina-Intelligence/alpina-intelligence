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
import { type SignUpData, signUpSchema } from "@/lib/schemas/auth";

export type { SignUpData };

interface SignUpFormProps {
	onSubmit: (data: SignUpData) => void;
	error?: string;
	loading?: boolean;
}

export function SignUpForm({ onSubmit, error, loading }: SignUpFormProps) {
	const id = useId();
	const form = useForm<SignUpData>({
		resolver: zodResolver(signUpSchema),
		defaultValues: { name: "", email: "", password: "" },
	});

	return (
		<Card className="w-full max-w-sm">
			<CardHeader>
				<CardTitle>Create Account</CardTitle>
				<CardDescription>
					Enter your details to get started.
				</CardDescription>
			</CardHeader>
			<form onSubmit={form.handleSubmit(onSubmit)}>
				<CardContent>
					<FieldGroup>
						{error && (
							<p className="text-xs text-status-error font-mono">
								{error}
							</p>
						)}
						<Controller
							name="name"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel htmlFor={`${id}-name`}>
										Name
									</FieldLabel>
									<Input
										{...field}
										id={`${id}-name`}
										type="text"
										placeholder="Your name"
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
						{loading ? "Creating account..." : "Sign Up"}
					</Button>
				</CardFooter>
			</form>
		</Card>
	);
}
