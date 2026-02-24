import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { validateInviteCode, createUserDocument, markInviteCodeUsed } from '../../services/db'
import { ShieldCheck, Loader2, Sun, Moon } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import logo from '../../assets/logo.png'

export default function Signup() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [isGoogleSignup, setIsGoogleSignup] = useState(false)

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        inviteCode: ""
    })

    useEffect(() => {
        // If user is logged in via Google, pre-fill and lock fields
        if (user?.uid && !user.role) { // Using 'role' existence as proxy for DB doc existence from AuthContext
            setIsGoogleSignup(true)
            setFormData(prev => ({
                ...prev,
                name: user.displayName || "",
                email: user.email || ""
            }))
        }
    }, [user])

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            // 1. Verify Invite Code
            const { isValid, codeId, role: invitedRole } = await validateInviteCode(formData.inviteCode)

            if (!isValid) {
                throw new Error("Invalid or expired invite code.")
            }

            let targetUid = user?.uid

            if (!isGoogleSignup) {
                // 2. Create Auth User (Email/Pass)
                const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password)
                targetUid = userCredential.user.uid
            }

            // 3. Create Firestore Document
            await createUserDocument(targetUid, {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                role: invitedRole,   // use the role from the invite code
                status: 'approved'
            })

            // 4. Mark Code as Used
            await markInviteCodeUsed(codeId, targetUid)

            if (invitedRole === 'admin' || invitedRole === 'manager') {
                navigate('/admin')
            } else if (invitedRole === 'production') {
                navigate('/admin/inventory')
            } else {
                navigate('/store')
            }

        } catch (err) {
            console.error(err)
            setError(err.message || "Failed to sign up.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="signup-page">
            <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle Theme">
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="signup-card">
                {/* 1. Header Section */}
                <div className="signup-header">
                    <img src={logo} alt="Ferwa Logo" className="brand-icon" />
                    <h1 className="brand-text">Ferwa <span className="brand-blue">One</span></h1>
                </div>

                {/* 2. Heading Section */}
                <div className="heading-group">
                    <h2 className="welcome-heading">
                        {isGoogleSignup ? "Complete Your Profile" : "Create Account"}
                    </h2>
                    <p className="welcome-subtext">
                        {isGoogleSignup ? "Please enter an invite code to finish." : "Enter your invite code to join Ferwa."}
                    </p>
                </div>

                {error && <div className="alert-error mb-4">{error}</div>}

                <form onSubmit={handleSubmit} className="signup-form">
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input
                            name="name"
                            type="text"
                            placeholder="John Doe"
                            required
                            onChange={handleChange}
                            value={formData.name}
                            disabled={isGoogleSignup}
                            className={`styled-input ${isGoogleSignup ? "input-disabled" : ""}`}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            name="email"
                            type="email"
                            placeholder="name@company.com"
                            required
                            onChange={handleChange}
                            value={formData.email}
                            disabled={isGoogleSignup}
                            className={`styled-input ${isGoogleSignup ? "input-disabled" : ""}`}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Phone Number</label>
                        <input
                            name="phone"
                            type="tel"
                            placeholder="+91 98765 43210"
                            required
                            onChange={handleChange}
                            className="styled-input"
                        />
                    </div>

                    {!isGoogleSignup && (
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                name="password"
                                type="password"
                                placeholder="Min. 6 characters"
                                required
                                onChange={handleChange}
                                className="styled-input"
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Invite Code</label>
                        <input
                            name="inviteCode"
                            type="text"
                            placeholder="XXXXXX"
                            className="styled-input input-code"
                            required
                            onChange={handleChange}
                        />
                    </div>

                    <button type="submit" className="signup-btn-primary" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Complete & Join"}
                    </button>
                </form>

                {!isGoogleSignup && (
                    <div className="signup-footer">
                        <p className="footer-small">
                            Already have an account? <a href="/login" className="footer-link">Sign In</a>
                        </p>
                    </div>
                )}

                <style>{`
                @import url('https://fonts.googleapis.com/css2?family=MuseoModerno:wght@400;500;700&display=swap');

                .signup-page {
                    width: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    position: relative;
                }

                .signup-card {
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

                /* Header */
                .signup-header {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    margin-bottom: 16px;
                }

                .brand-icon {
                    height: 40px;
                    width: auto;
                    margin-bottom: 8px;
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
                    color: #5B6CFF;
                }

                /* Heading group */
                .heading-group {
                    text-align: center;
                    margin-bottom: 12px;
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
                .signup-form {
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    width: 100%;
                }

                .form-label {
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--text-secondary);
                    margin-left: 4px;
                }

                .styled-input {
                    height: 48px;
                    padding: 0 16px;
                    background: var(--bg-surface);
                    border: 1.5px solid var(--border-subtle);
                    border-radius: 12px;
                    font-size: 15px;
                    color: var(--text-main);
                    transition: all 0.2s ease;
                    outline: none;
                    width: 100%;
                    box-sizing: border-box;
                }

                .styled-input:focus {
                    border-color: #5B6CFF;
                    background: white;
                    box-shadow: 0 0 0 4px rgba(91, 108, 255, 0.1);
                }

                .input-code { 
                    letter-spacing: 0.1em; 
                    font-weight: 600; 
                    text-transform: uppercase; 
                }

                .input-disabled { 
                    background-color: var(--bg-subtle); 
                    color: var(--text-muted); 
                    cursor: not-allowed; 
                }

                .google-btn-outline:hover:not(:disabled) {
                    background: var(--bg-subtle);
                    border-color: var(--text-secondary);
                }

                /* Button */
                .signup-btn-primary {
                    height: 50px;
                    background: #5B6CFF;
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    margin-top: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .signup-btn-primary:hover {
                    background: #4A5AE5;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(91, 108, 255, 0.25);
                }

                .signup-btn-primary:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                    transform: none;
                }

                /* Footer */
                .signup-footer {
                    margin-top: 24px;
                }

                .footer-small {
                    font-size: 14px;
                    color: var(--text-secondary);
                    margin: 0;
                }

                .footer-link {
                    color: #5B6CFF;
                    font-weight: 600;
                    text-decoration: none;
                    transition: color 0.2s;
                }

                .footer-link:hover {
                    color: #4A5AE5;
                    text-decoration: underline;
                }

                .alert-error {
                    background: #fee2e2;
                    color: #b91c1c;
                    padding: 12px;
                    border-radius: 12px;
                    font-size: 14px;
                    text-align: center;
                    width: 100%;
                    box-sizing: border-box;
                }

                /* Dark Mode Specifics */
                :root.dark .brand-icon {
                    filter: invert(1) brightness(2);
                }

            `}</style>
            </div>
        </div>
    )
}
