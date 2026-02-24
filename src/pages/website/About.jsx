import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'

export default function About() {
    const features = [
        "Innovation Driven",
        "Smart Automation",
        "Future Focused"
    ]

    return (
        <section id="about" className="section bg-surface">
            <div className="container">
                <div className="about-grid">
                    <div className="about-content">
                        <h2 className="section-title">About Ferwa</h2>
                        <p className="lead">
                            We create products and digital solutions that help businesses and individuals manage their space efficiently.
                        </p>
                        <p className="description">
                            Ferwa believes in control, clarity, and smart living. From advanced cleaning solutions to intelligent billing software,
                            our goal is to simplify daily operations using technology, automation, and innovation.
                        </p>

                        <div className="features-list">
                            {features.map((item, index) => (
                                <div key={index} className="feature-item">
                                    <CheckCircle size={20} className="check-icon" />
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="about-visual">
                        <div className="visual-card main-card">
                            <h3>Control</h3>
                        </div>
                        <div className="visual-card offset-card">
                            <h3>Clarity</h3>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        .bg-surface { background-color: var(--bg-surface); }
        
        .section-title {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          color: var(--color-primary);
        }

        .lead {
          font-size: 1.25rem;
          font-weight: 500;
          color: var(--text-main);
          margin-bottom: 1rem;
        }

        .description {
          color: var(--text-muted);
          line-height: 1.8;
          margin-bottom: 2rem;
        }

        .about-grid {
          display: grid;
          gap: 4rem;
          align-items: center;
        }

        @media (min-width: 960px) {
          .about-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        .features-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-weight: 500;
          color: var(--color-secondary);
        }

        .check-icon {
          color: var(--color-accent);
        }

        .about-visual {
          position: relative;
          height: 400px;
        }

        .visual-card {
          position: absolute;
          background: white;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--color-primary);
        }

        .main-card {
          width: 80%;
          height: 80%;
          top: 0;
          left: 0;
          z-index: 1;
          border: 1px solid rgba(0,0,0,0.05);
        }

        .offset-card {
          width: 60%;
          height: 60%;
          bottom: 0;
          right: 0;
          z-index: 2;
          background: var(--color-primary);
          color: white;
        }
      `}</style>
        </section>
    )
}
