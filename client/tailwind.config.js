/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    safelist: [
        { pattern: /text-(blue|red|purple|orange|emerald|pink|yellow)-[45]00/ },
        { pattern: /bg-(blue|red|purple|orange|emerald|pink|yellow)-500\/(10|20|50)/ },
        { pattern: /border-(blue|red|purple|orange|emerald|pink|yellow)-500\/(20|30|50)/ },
    ],
    theme: {
        extend: {
            colors: {
                background: '#0a0a0a',
                surface: '#121212',
                primary: '#7c3aed',
                secondary: '#a78bfa',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
