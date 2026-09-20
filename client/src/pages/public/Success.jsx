import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { setPageTitle } from '../../utils/seo';

export default function Success() {
  const [caseId, setCaseId] = useState(null);

  useEffect(() => {
    setPageTitle('Report Submitted');
    try {
      const raw = sessionStorage.getItem('snarenet_last_case');
      if (raw) {
        const { caseId: id } = JSON.parse(raw);
        setCaseId(id);
      }
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '90px 0 100px' }}>
      <div className="card" style={{ maxWidth: 620, width: '100%', textAlign: 'center' }}>
        <div className="success-badge" aria-hidden="true">
          <span className="success-ring r1" />
          <span className="success-ring r2" />
          <span className="success-ring r3" />
          <span className="success-core">✓</span>
        </div>

        <h1 className="section-title" style={{ fontSize: 30 }}>Report Submitted Successfully</h1>
        <p className="muted" style={{ fontSize: 16 }}>
          Your report has been received. The team will review the available information and may
          contact you using your preferred contact method.
        </p>

        {caseId ? (
          <>
            <div
              className="mt-4"
              style={{
                background: 'var(--background-color)',
                border: '1px dashed var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '26px 20px',
              }}
            >
              <div className="muted" style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '.1em' }}>Case ID</div>
              <div className="mono" style={{ fontSize: 30, fontWeight: 800, letterSpacing: '0.04em', color: 'var(--primary-color)', marginTop: 6 }}>
                {caseId}
              </div>
              <div className="muted" style={{ fontSize: 14, marginTop: 12 }}>
                Keep your Case ID for your records.
              </div>
            </div>
          </>
        ) : null}

        <div className="alert alert-warning mt-4" style={{ textAlign: 'left' }}>
          <span aria-hidden="true">📌</span>
          <span>
            Save your Case ID now. If you lose it, your report can only be located using the contact
            details you provided.
          </span>
        </div>

        <div className="mt-4" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/report" className="btn btn-primary">Submit Another Report</Link>
          <Link to="/" className="btn btn-secondary">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}