export default function Vision() {
    return (
        <section className="section text-center">
            <div className="container">
                <div className="vision-content">
                    <span className="label">Our Vision</span>
                    <h2>Empower every business with smart technology.</h2>

                    <div className="divider"></div>

                    <span className="label">Our Mission</span>
                    <h2>Deliver simple, powerful, and reliable solutions.</h2>
                </div>
            </div>

            <style>{`
        .vision-content {
          max-width: 800px;
          margin: 0 auto;
        }

        .label {
          display: block;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--color-accent);
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }

        .vision-content h2 {
          font-size: 2.5rem;
          font-weight: 800;
          color: var(--color-primary);
          line-height: 1.3;
        }

        @media (min-width: 768px) {
          .vision-content h2 { font-size: 3.5rem; }
        }

        .divider {
          width: 2px;
          height: 80px;
          background: var(--bg-surface);
          margin: 4rem auto;
        }
      `}</style>
        </section>
    )
}
