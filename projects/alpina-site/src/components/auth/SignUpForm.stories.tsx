import type { Meta, StoryObj } from "@storybook/react-vite";
import { SignUpForm } from "./SignUpForm";

const meta = {
	title: "Auth/SignUpForm",
	component: SignUpForm,
	args: {
		onSubmit: (data) => console.log("signUp", data),
	},
	parameters: {
		layout: "centered",
	},
} satisfies Meta<typeof SignUpForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithError: Story = {
	args: {
		error: "An account with this email already exists.",
	},
};

export const Loading: Story = {
	args: {
		loading: true,
	},
};
