import { Outlet } from 'react-router-dom'
import { ShieldCheck, Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      title="Toggle Theme"
    >
      {theme === 'dark' ? <Sun size={20} className="text-white" /> : <Moon size={20} className="text-slate-800" />}
    </button>
  )
}


export default function AuthLayout() {
  return (
    <div className="auth-layout">
      {/* Centered content area */}
      <div className="auth-content-container">
        <Outlet />
      </div>

      <style>{`
        .auth-layout {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #F8FAFC; /* Fintech light bg */
          padding: 1.5rem;
          position: relative;
        }

        .auth-content-container {
          width: 100%;
          max-width: 450px; /* Synchronized with Login.jsx content width */
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* Ensure smooth background transition */
        :root[class='dark'] .auth-layout {
            background-color: var(--bg-body);
        }
      `}</style>
    </div>
  )
}
