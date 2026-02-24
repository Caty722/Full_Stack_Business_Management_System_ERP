import { useEffect } from 'react'

export default function GlobalStyles() {
    useEffect(() => {
        // Force clean body style for dashboard
        document.body.style.backgroundColor = 'var(--bg-surface)'
        document.body.style.color = 'var(--text-main)'
    }, [])
    return null
}
