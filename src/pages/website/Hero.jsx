import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export default function Hero() {
    return (
        <section className="hero">
            <div className="container hero-content">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="hero-text"
                >
                    <div className="badge">New Era of Living</div>
                    <h1>Rule Your Space <br /> with <span className="text-gradient">Ferwa</span></h1>
                    <p className="subtext">
                        Smart products and intelligent software for modern businesses.
                        We define control, clarity, and smart living.
                    </p>

                    <div className="hero-actions">
                        <button className="btn btn-primary">
                            Get Started
                        </button>
                        <button className="btn btn-outline">
                            Explore Products <ArrowRight size={18} style={{ marginLeft: '8px' }} />
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Decorative Background Elements */}
            <div className="bg-gradient-1" />
            <div className="bg-gradient-2" />

            <style>{`
        .hero {
          position: relative;
          padding: 8rem 0 6rem;
          overflow: hidden;
          min-height: 90vh;
          display: flex;
          align-items: center;
        }

        .hero-content {
          position: relative;
          z-index: 10;
          max-width: 800px; /* Constrain width for better readability */
        }

        .badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          background: var(--bg-surface);
          color: var(--color-accent);
          border-radius: full;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          border: 1px solid rgba(37, 99, 235, 0.1);
          border-radius: 9999px;
        }

        h1 {
          font-size: 3rem;
          line-height: 1.1;
          font-weight: 800;
          letter-spacing: -0.03em;
          margin-bottom: 1.5rem;
          color: var(--color-primary);
        }

        @media (min-width: 768px) {
          h1 { font-size: 4.5rem; }
        }

        .text-gradient {
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .subtext {
          font-size: 1.125rem;
          color: var(--text-muted);
          max-width: 540px;
          margin-bottom: 2.5rem;
          line-height: 1.7;
        }

        @media (min-width: 768px) {
          .subtext { font-size: 1.25rem; }
        }

        .hero-actions {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        @media (min-width: 640px) {
          .hero-actions {
            flex-direction: row;
          }
        }

        /* Ambient Backgrounds */
        .bg-gradient-1 {
          position: absolute;
          top: -10%;
          right: -5%;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(37, 99, 235, 0.05) 0%, transparent 70%);
          border-radius: 50%;
          z-index: 0;
        }

        .bg-gradient-2 {
          position: absolute;
          bottom: 10%;
          left: -10%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(200, 200, 200, 0.1) 0%, transparent 70%);
          border-radius: 50%;
          z-index: 0;
        }
      `}</style>
        </section>
    )
}
