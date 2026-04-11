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
                    900: '#0f172a', // Original Blue Background
                    800: '#1e293b', // Original Card Background
                    700: '#334155', // Original Border Background
                },
                primary: '#6366f1', // Original Indigo
                secondary: '#10b981', // Original Emerald
                danger: '#ef4444', 
                text: {
                    main: '#f8fafc', // Original Slate 50
                    muted: '#94a3b8', // Original Slate 400
                }
            },
            fontFamily: {
                sans: ['Poppins', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
