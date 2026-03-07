import { useId } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { type TimeUnit, UNIT_MS, msToParts } from "@/lib/admin-utils";

export interface TaskConfigData {
	taskName: string;
	enabled: boolean;
	intervalLiveMs: number;
	intervalGamedayMs: number;
	intervalQuietMs: number;
	intervalOffseasonMs: number;
	batchSize: number | null;
}

const GAME_STATES = [
	{ key: "intervalLiveMs" as const, label: "Live" },
	{ key: "intervalGamedayMs" as const, label: "Gameday" },
	{ key: "intervalQuietMs" as const, label: "Quiet" },
	{ key: "intervalOffseasonMs" as const, label: "Offseason" },
];

const intervalPartSchema = z.object({
	value: z.string().refine(
		(v) => {
			const n = Number(v);
			return v !== "" && n > 0 && Number.isFinite(n);
		},
		{ message: "Must be > 0" },
	),
	unit: z.enum(["s", "m", "h"]),
});

const formSchema = z.object({
	enabled: z.boolean(),
	intervalLiveMs: intervalPartSchema,
	intervalGamedayMs: intervalPartSchema,
	intervalQuietMs: intervalPartSchema,
	intervalOffseasonMs: intervalPartSchema,
	batchSize: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

export function TaskConfigCard({
	config,
	onSave,
	saving,
}: {
	config: TaskConfigData;
	onSave: (data: Partial<TaskConfigData> & { taskName: string }) => void;
	saving?: boolean;
}) {
	const id = useId();

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			enabled: config.enabled,
			intervalLiveMs: msToParts(config.intervalLiveMs),
			intervalGamedayMs: msToParts(config.intervalGamedayMs),
			intervalQuietMs: msToParts(config.intervalQuietMs),
			intervalOffseasonMs: msToParts(config.intervalOffseasonMs),
			batchSize: config.batchSize?.toString() ?? "",
		},
	});

	function handleSave(values: FormValues) {
		const parsed: Record<string, number> = {};
		for (const { key } of GAME_STATES) {
			const { value, unit } = values[key];
			parsed[key] = Number(value) * UNIT_MS[unit];
		}

		onSave({
			taskName: config.taskName,
			enabled: values.enabled,
			...parsed,
			batchSize: values.batchSize
				? Number.parseInt(values.batchSize, 10)
				: null,
		});
	}

	return (
		<Card className="corner-accent">
			<CardHeader className="pb-2">
				<div className="flex items-center justify-between">
					<CardTitle className="font-mono text-xs uppercase tracking-ultra">
						{config.taskName}
					</CardTitle>
					<Controller
						name="enabled"
						control={form.control}
						render={({ field }) => (
							<div className="flex items-center gap-2">
								<span
									className={cn(
										"font-mono text-[10px] uppercase tracking-wide",
										field.value
											? "text-status-active"
											: "text-foreground-subtle",
									)}
								>
									{field.value ? "ON" : "OFF"}
								</span>
								<Switch
									checked={field.value}
									onCheckedChange={field.onChange}
								/>
							</div>
						)}
					/>
				</div>
			</CardHeader>
			<CardContent className="space-y-3">
				<div className="grid grid-cols-2 gap-2">
					{GAME_STATES.map(({ key, label }) => (
						<Controller
							key={key}
							name={key}
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel
										htmlFor={`${id}-${key}`}
										className="data-label"
									>
										{label}
									</FieldLabel>
									<div className="flex gap-1">
										<Input
											id={`${id}-${key}`}
											type="text"
											inputMode="decimal"
											value={field.value.value}
											onChange={(e) => {
												const raw = e.target.value;
												if (
													raw !== "" &&
													!/^\d*\.?\d*$/.test(raw)
												)
													return;
												field.onChange({
													...field.value,
													value: raw,
												});
											}}
											onBlur={field.onBlur}
											className="font-mono text-xs h-8 flex-1 min-w-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
										/>
										<Select
											value={field.value.unit}
											onValueChange={(val) =>
												field.onChange({
													...field.value,
													unit: val as TimeUnit,
												})
											}
										>
											<SelectTrigger
												size="sm"
												className="h-8 w-[4.5rem] font-mono text-xs"
											>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="s">
													sec
												</SelectItem>
												<SelectItem value="m">
													min
												</SelectItem>
												<SelectItem value="h">
													hr
												</SelectItem>
											</SelectContent>
										</Select>
									</div>
									{fieldState.invalid && (
										<FieldError
											errors={[fieldState.error]}
										/>
									)}
								</Field>
							)}
						/>
					))}
				</div>
				{config.batchSize !== null && (
					<Controller
						name="batchSize"
						control={form.control}
						render={({ field }) => (
							<Field>
								<FieldLabel
									htmlFor={`${id}-batch`}
									className="data-label"
								>
									Batch Size
								</FieldLabel>
								<Input
									id={`${id}-batch`}
									type="text"
									inputMode="numeric"
									value={field.value}
									onChange={(e) => {
										if (
											e.target.value === "" ||
											/^\d+$/.test(e.target.value)
										)
											field.onChange(e.target.value);
									}}
									onBlur={field.onBlur}
									className="font-mono text-xs h-8 w-20"
								/>
							</Field>
						)}
					/>
				)}
				<Button
					variant="terminal"
					size="xs"
					onClick={form.handleSubmit(handleSave)}
					disabled={saving}
					className="w-full"
				>
					{saving ? "Saving..." : "Save"}
				</Button>
			</CardContent>
		</Card>
	);
}
