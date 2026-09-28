// ──────────────────────────────────────────────
// NotFound — 404 page
// ──────────────────────────────────────────────

import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="not-found">
      <div className="not-found-content">
        <div className="not-found-code">404</div>
        <h1 className="not-found-title">Page not found</h1>
        <p className="not-found-desc">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <button className="not-found-btn" onClick={() => navigate('/')}>
          <svg className="not-found-btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back home
        </button>
      </div>

      <style>{`
        .not-found {
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f9fafb;
          padding: 2rem;
        }
        .not-found-content {
          text-align: center;
          max-width: 28rem;
        }
        .not-found-code {
          font-size: 7rem;
          font-weight: 800;
          line-height: 1;
          background: linear-gradient(135deg, #f2a93b, #f5b961);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.5rem;
        }
        .not-found-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 0.75rem;
        }
        .not-found-desc {
          font-size: 1rem;
          color: #6b7280;
          line-height: 1.6;
          margin: 0 0 2rem;
        }
        .not-found-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #f2a93b, #f5b961);
          color: #fff;
          font-size: 1rem;
          font-weight: 600;
          border: none;
          border-radius: 0.75rem;
          cursor: pointer;
          transition: all 0.15s;
          box-shadow: 0 4px 12px rgba(242, 169, 59, 0.25);
        }
        .not-found-btn:hover {
          box-shadow: 0 6px 20px rgba(242, 169, 59, 0.35);
          transform: translateY(-1px);
        }
        .not-found-btn:active {
          transform: translateY(0);
        }
        .not-found-btn-icon {
          width: 1.125rem;
          height: 1.125rem;
        }
      `}</style>
    </div>
  )
}