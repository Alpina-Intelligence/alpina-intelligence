import type { Meta, StoryObj } from "@storybook/react-vite";
import { SignInForm } from "./SignInForm";

const meta = {
	title: "Auth/SignInForm",
	component: SignInForm,
	args: {
		onSubmit: (data) => console.log("signIn", data),
	},
	parameters: {
		layout: "centered",
	},
} satisfies Meta<typeof SignInForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithError: Story = {
	args: {
		error: "Invalid email or password.",
	},
};

export const Loading: Story = {
	args: {
		loading: true,
	},
};
