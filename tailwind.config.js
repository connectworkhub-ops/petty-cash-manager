/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                midnight: {
                    900: '#0f172a', // Deep background
                    800: '#1e293b', // Card background
                    700: '#334155', // Border/Input background
                },
                primary: '#6366f1', // Indigo - Main Action
                secondary: '#10b981', // Emerald - Success/Accent
                danger: '#ef4444', // Red - Error/Delete
                text: {
                    main: '#f8fafc', // Slate 50
                    muted: '#94a3b8', // Slate 400
                }
            },
            fontFamily: {
                sans: ['Poppins', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
