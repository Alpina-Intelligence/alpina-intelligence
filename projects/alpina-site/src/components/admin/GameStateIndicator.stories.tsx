import type { Meta, StoryObj } from "@storybook/react-vite";
import { GameStateIndicator } from "./GameStateIndicator";

const meta = {
	title: "Admin/GameStateIndicator",
	component: GameStateIndicator,
	parameters: {
		layout: "centered",
	},
} satisfies Meta<typeof GameStateIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Live: Story = {
	args: { state: "live" },
};

export const Gameday: Story = {
	args: { state: "gameday" },
};

export const Quiet: Story = {
	args: { state: "quiet" },
};

export const Offseason: Story = {
	args: { state: "offseason" },
};

export const NullState: Story = {
	args: { state: null },
};
