import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../../lib/firebase'
import { Loader2, Mail, Lock, Sun, Moon } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/logo.png'

export default function Login() {
    const navigate = useNavigate()
    const { theme, toggleTheme } = useTheme()
    const { user, role, loading: authLoading } = useAuth()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    })

    // Handle navigation when user and role are available from context
    useEffect(() => {
        if (!authLoading && user && role) {
            if (role === 'super_admin' || role === 'admin' || role === 'manager') {
                navigate('/admin')
            } else if (role === 'production') {
                navigate('/admin/inventory')
            } else {
                navigate('/store')
            }
        }
    }, [user, role, authLoading, navigate])

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleGoogleLogin = async () => {
        setError("")
        setLoading(true)
        try {
            await signInWithPopup(auth, googleProvider)
            // Navigation is handled by the useEffect watching auth state
        } catch (err) {
            console.error(err)
            setError("Google Sign-In failed.")
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        setLoading(true)
        try {
            await signInWithEmailAndPassword(auth, formData.email, formData.password)
            // Navigation is handled by the useEffect watching auth state
        } catch (err) {
            console.error(err)
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                setError("Invalid email or password.")
            } else {
                setError("An error occurred during sign in. Please try again.")
            }
            setLoading(false)
        }
    }

    return (
        <div className="login-page">
            <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle Theme">
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="login-card">
                {/* 1. Header with Logo & Brand */}
                <header className="login-header">
                    <img src={logo} alt="Ferwa Logo" className="brand-icon" />
                    <h1 className="brand-text">
                        Ferwa <span className="brand-blue">One</span>
                    </h1>
                </header>

                <div className="heading-group">
                    <h2 className="welcome-heading">Welcome Back</h2>
                    <p className="welcome-subtext">Please enter your details to sign in</p>
                </div>

                {error && (
                    <div className="error-alert">
                        {error}
                    </div>
                )}

                {/* 2. Login Form */}
                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label className="input-label">Email Address</label>
                        <div className="input-container">
                            <Mail className="input-field-icon" size={18} />
                            <input
                                name="email"
                                type="email"
                                className="styled-input"
                                placeholder="name@company.com"
                                required
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="input-label">Password</label>
                        <div className="input-container">
                            <Lock className="input-field-icon" size={18} />
                            <input
                                name="password"
                                type="password"
                                className="styled-input"
                                placeholder="••••••••"
                                required
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <button type="submit" className="login-btn-primary" disabled={loading}>
                        {loading ? <Loader2 className="spinning" size={20} /> : "Sign In"}
                    </button>
                </form>

                {/* 3. Divider */}
                <div className="divider-row">
                    <div className="divider-line"></div>
                    <span className="divider-label">or continue with</span>
                    <div className="divider-line"></div>
                </div>

                {/* 4. Social Login */}
                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="google-btn-outline"
                >
                    <svg className="google-svg" aria-hidden="true" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                    Google
                </button>

                {/* 5. Signup Link */}
                <footer className="login-footer">
                    <p className="footer-small">
                        Don't have an account?{' '}
                        <a href="/signup" className="footer-link">Sign up for free</a>
                    </p>
                </footer>
            </div>

            <style>{`
                /* Font Overrides */
                @import url('https://fonts.googleapis.com/css2?family=MuseoModerno:wght@500&display=swap');

                .login-page {
                    width: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    position: relative;
                }

                .login-card {
                    width: 100%;
                    max-width: 420px;
                    padding: 32px;
                    background: var(--bg-card);
                    border-radius: 20px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.06);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    box-sizing: border-box;
                    border: 1px solid var(--border-subtle);
                    transition: all 0.3s ease;
                }

                /* Header */
                .login-header {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    margin-bottom: 16px; /* Reduced from 24px */
                }

                .brand-icon {
                    height: 40px; /* Reduced from 48px */
                    width: auto;
                    margin-bottom: 8px; /* Reduced from 12px */
                }

                .brand-text {
                    font-family: 'MuseoModerno', cursive;
                    font-size: 32px;
                    font-weight: 500;
                    color: var(--text-main);
                    margin: 0;
                }

                .brand-blue {
                    font-family: 'Inter', sans-serif;
                    color: #5B6CFF; /* Brand Blue */
                }

                /* Heading group */
                .heading-group {
                    text-align: center;
                    margin-bottom: 12px; /* Reduced from 16px */
                }

                .welcome-heading {
                    font-size: 22px;
                    font-weight: 700;
                    color: var(--text-main);
                    margin-bottom: 4px;
                }

                .welcome-subtext {
                    font-size: 14px;
                    color: var(--text-secondary);
                    margin: 0;
                }

                /* Form */
                .login-form {
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    gap: 12px; /* Reduced from 20px */
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .input-label {
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--text-secondary);
                }

                .input-container {
                    position: relative;
                    width: 100%;
                }

                .input-field-icon {
                    position: absolute;
                    left: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #94A3B8;
                }

                .styled-input {
                    width: 100%;
                    height: 48px;
                    padding-left: 40px;
                    padding-right: 12px;
                    border: 1.5px solid var(--border-subtle);
                    border-radius: 12px;
                    font-size: 15px;
                    color: var(--text-main);
                    background: var(--bg-surface);
                    transition: all 0.2s;
                    box-sizing: border-box;
                }

                .styled-input:focus {
                    outline: none;
                    border-color: #5B6CFF;
                    box-shadow: 0 0 0 4px rgba(91, 108, 255, 0.1);
                }

                .login-btn-primary {
                    width: 100%;
                    height: 50px;
                    background-color: #5B6CFF;
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-weight: 600;
                    font-size: 16px;
                    cursor: pointer;
                    transition: background 0.2s;
                    margin-top: 10px;
                }

                .login-btn-primary:hover:not(:disabled) {
                    background-color: #4A5AE6;
                }

                .login-btn-primary:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                /* Divider */
                .divider-row {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin: 16px 0; /* Reduced from 24px 0 */
                }

                .divider-line {
                    flex: 1;
                    height: 1px;
                    background: var(--border-subtle);
                }

                .divider-label {
                    font-size: 13px;
                    color: var(--text-muted);
                    white-space: nowrap;
                }

                /* Google button */
                .google-btn-outline {
                    width: 100%;
                    height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--bg-surface);
                    border: 1.5px solid var(--border-subtle);
                    border-radius: 12px;
                    color: var(--text-main);
                    font-weight: 600;
                    font-size: 15px;
                    cursor: pointer;
                    transition: all 0.2s;
                    gap: 12px;
                }

                .google-btn-outline:hover:not(:disabled) {
                    background: var(--bg-subtle);
                    border-color: var(--text-secondary);
                }

                .google-svg {
                    width: 20px;
                    height: 20px;
                }

                /* Footer */
                .login-footer {
                    margin-top: 24px; /* Reduced from 32px */
                }

                .footer-small {
                    font-size: 14px;
                    color: var(--text-secondary);
                }

                .footer-link {
                    color: #5B6CFF;
                    text-decoration: none;
                    font-weight: 600;
                }

                .error-alert {
                    width: 100%;
                    padding: 12px;
                    background: #FEF2F2;
                    border: 1px solid #FEE2E2;
                    color: #B91C1C;
                    font-size: 14px;
                    border-radius: 8px;
                    text-align: center;
                    margin-bottom: 16px;
                }

                .theme-toggle {
                    position: fixed;
                    top: 24px;
                    right: 24px;
                    padding: 9px;
                    border-radius: 50%;
                    background: var(--bg-surface);
                    border: 1.5px solid var(--border-subtle);
                    cursor: pointer;
                    color: var(--text-secondary);
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                    z-index: 100;
                }

                .theme-toggle:hover {
                    border-color: #5B6CFF;
                    color: #5B6CFF;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(91, 108, 255, 0.15);
                }

                /* Dark Mode Specifics */
                /* Dark Mode Logo Inversion */
        :root.dark .logo-icon-img {
            filter: invert(1) brightness(2);
        }
                :root.dark .brand-icon {
                    filter: invert(1) brightness(2);
                }

            `}</style>
        </div>
    )
}
