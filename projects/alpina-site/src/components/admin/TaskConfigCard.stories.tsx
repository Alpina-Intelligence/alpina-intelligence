import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { TaskConfigCard } from "./TaskConfigCard";

const defaultConfig = {
	taskName: "scores",
	enabled: true,
	intervalLiveMs: 30_000,
	intervalGamedayMs: 300_000,
	intervalQuietMs: 3_600_000,
	intervalOffseasonMs: 7_200_000,
	batchSize: 50,
};

const meta = {
	title: "Admin/TaskConfigCard",
	component: TaskConfigCard,
	args: {
		config: defaultConfig,
		onSave: fn(),
		saving: false,
	},
	parameters: {
		layout: "centered",
	},
} satisfies Meta<typeof TaskConfigCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
	args: {
		config: { ...defaultConfig, enabled: false },
	},
};

export const NoBatchSize: Story = {
	args: {
		config: { ...defaultConfig, batchSize: null },
	},
};

export const Saving: Story = {
	args: {
		saving: true,
	},
};

export const FormSubmit: Story = {
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);

		const liveInput = canvas.getByLabelText("Live");
		await userEvent.clear(liveInput);
		await userEvent.type(liveInput, "45");

		const saveButton = canvas.getByRole("button", { name: /save/i });
		await userEvent.click(saveButton);

		await expect(args.onSave).toHaveBeenCalled();
	},
};

export const ToggleSwitch: Story = {
	args: {
		config: { ...defaultConfig, enabled: true },
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const toggle = canvas.getByRole("switch");
		await expect(toggle).toHaveAttribute("data-state", "checked");

		await userEvent.click(toggle);

		await expect(toggle).toHaveAttribute("data-state", "unchecked");
		await expect(canvas.getByText("OFF")).toBeInTheDocument();
	},
};

export const ValidationError: Story = {
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);

		const liveInput = canvas.getByLabelText("Live");
		await userEvent.clear(liveInput);

		const saveButton = canvas.getByRole("button", { name: /save/i });
		await userEvent.click(saveButton);

		await expect(args.onSave).not.toHaveBeenCalled();
		await expect(canvas.getByText("Must be > 0")).toBeInTheDocument();
	},
};
