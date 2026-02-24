import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
            <div className="container navbar-content">
                <a href="#" className="logo">Ferwa</a>

                <div className="desktop-nav">
                    <a href="#solutions" className="nav-link">Solutions</a>
                    <a href="#products" className="nav-link">Products</a>
                    <a href="#about" className="nav-link">Company</a>
                    <a href="#contact" className="btn btn-primary sm">Get Started</a>
                </div>

                <button
                    className="mobile-toggle"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {isMobileMenuOpen && (
                <div className="mobile-menu">
                    <a href="#solutions" onClick={() => setIsMobileMenuOpen(false)}>Solutions</a>
                    <a href="#products" onClick={() => setIsMobileMenuOpen(false)}>Products</a>
                    <a href="#about" onClick={() => setIsMobileMenuOpen(false)}>Company</a>
                    <a href="#contact" onClick={() => setIsMobileMenuOpen(false)} className="btn btn-primary">Get Started</a>
                </div>
            )}

            <style>{`
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          transition: all 0.3s ease;
          padding: 1.5rem 0;
          background: transparent;
        }

        .navbar.scrolled {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          padding: 1rem 0;
          box-shadow: var(--shadow-sm);
        }

        .navbar-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logo {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--color-primary);
          letter-spacing: -0.02em;
        }

        .desktop-nav {
          display: none;
          align-items: center;
          gap: 2rem;
        }

        @media (min-width: 768px) {
          .desktop-nav {
            display: flex;
          }
          .mobile-toggle {
            display: none;
          }
        }

        .nav-link {
          font-weight: 500;
          color: var(--color-secondary);
          transition: color 0.2s;
        }

        .nav-link:hover {
          color: var(--color-primary);
        }

        .btn.sm {
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
        }

        .mobile-toggle {
          color: var(--color-primary);
        }

        .mobile-menu {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          box-shadow: var(--shadow-md);
          border-top: 1px solid var(--bg-surface);
        }
        
        .mobile-menu a {
          padding: 0.5rem;
          font-weight: 500;
        }
      `}</style>
        </nav>
    )
}
