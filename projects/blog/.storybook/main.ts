import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';

const config: StorybookConfig = {
  "stories": [
    "../app/components/**/*.mdx",
    "../app/components/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@chromatic-com/storybook",
    "@storybook/addon-docs",
    "@storybook/addon-onboarding",
    "@storybook/addon-a11y",
    "@storybook/addon-vitest",
    "@storybook/addon-themes"
  ],
  "framework": {
    "name": "@storybook/react-vite",
    "options": {}
  },
  async viteFinal(config) {
    return mergeConfig(config, {
      plugins: [
        tsConfigPaths(),
      ],
    });
  },
};
export default config;