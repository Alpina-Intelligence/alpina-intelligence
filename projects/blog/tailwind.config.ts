import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		fontFamily: {
  			'mono': ['Monaco', 'Menlo', 'Consolas', 'Courier New', 'monospace'],
  			'tactical': ['Orbitron', 'Monaco', 'monospace'],
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			mgs: {
  				teal: {
  					DEFAULT: '#00ff9f',
  					50: '#f0fffe',
  					100: '#ccfff0',
  					200: '#99ffe2',
  					300: '#66ffd3',
  					400: '#33ffc4',
  					500: '#00ff9f',
  					600: '#00cc80',
  					700: '#009960',
  					800: '#006640',
  					900: '#003320',
  				},
  				orange: {
  					DEFAULT: '#ff9900',
  					50: '#fff7e6',
  					100: '#ffebcc',
  					200: '#ffd799',
  					300: '#ffc366',
  					400: '#ffaf33',
  					500: '#ff9900',
  					600: '#cc7a00',
  					700: '#995c00',
  					800: '#663d00',
  					900: '#331f00',
  				},
  				dark: {
  					DEFAULT: '#000a0a',
  					50: '#e6f2f2',
  					100: '#cce6e6',
  					200: '#99cccc',
  					300: '#66b3b3',
  					400: '#339999',
  					500: '#008080',
  					600: '#006666',
  					700: '#004d4d',
  					800: '#003333',
  					900: '#000a0a',
  				},
  				grid: {
  					DEFAULT: '#00ff9f33',
  					light: '#00ff9f1a',
  					bright: '#00ff9f66',
  				}
  			}
  		},
  		animation: {
  			'scanline': 'scanline 2s linear infinite',
  			'glitch': 'glitch 0.3s ease-in-out infinite alternate',
  			'typewriter': 'typewriter 3s steps(40) 1s infinite both',
  			'pulse-teal': 'pulse-teal 2s ease-in-out infinite',
  		},
  		keyframes: {
  			scanline: {
  				'0%': { transform: 'translateY(-100vh)' },
  				'100%': { transform: 'translateY(100vh)' },
  			},
  			glitch: {
  				'0%': {
  					textShadow: '0.05em 0 0 #00ff9f, -0.05em -0.025em 0 #ff9900, 0.025em 0.05em 0 #00ffff'
  				},
  				'15%': {
  					textShadow: '0.05em 0 0 #00ff9f, -0.05em -0.025em 0 #ff9900, 0.025em 0.05em 0 #00ffff'
  				},
  				'16%': { textShadow: '-0.05em -0.025em 0 #00ff9f, 0.025em 0.025em 0 #ff9900, -0.05em -0.05em 0 #00ffff' },
  				'49%': { textShadow: '-0.05em -0.025em 0 #00ff9f, 0.025em 0.025em 0 #ff9900, -0.05em -0.05em 0 #00ffff' },
  				'50%': { textShadow: '0.025em 0.05em 0 #00ff9f, 0.05em 0 0 #ff9900, 0 -0.05em 0 #00ffff' },
  				'99%': { textShadow: '0.025em 0.05em 0 #00ff9f, 0.05em 0 0 #ff9900, 0 -0.05em 0 #00ffff' },
  				'100%': { textShadow: '-0.025em 0 0 #00ff9f, -0.025em -0.025em 0 #ff9900, -0.025em -0.05em 0 #00ffff' },
  			},
  			typewriter: {
  				'from': { width: '0' },
  				'to': { width: '100%' },
  			},
  			'pulse-teal': {
  				'0%, 100%': { opacity: '0.4' },
  				'50%': { opacity: '1' },
  			},
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;