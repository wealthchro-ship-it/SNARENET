import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { setPageTitle } from '../../utils/seo';
import { InlineSpinner } from '../../components/Spinner';
import Logo from '../../components/Logo';
import './admin.css';

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPageTitle('Admin Login');
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="card login-card" role="main">
        <div className="center mb-4">
          <Logo size="lg" />
          <h1 style={{ fontSize: 24, marginTop: 18, marginBottom: 4 }}>Admin Portal</h1>
          <p className="muted" style={{ fontSize: 14, margin: 0 }}>
            Restricted access — authorized personnel only.
          </p>
        </div>

        {error && (
          <div className="alert alert-error mb-3" role="alert">
            <span aria-hidden="true">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={onSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              className="form-control"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              className="form-control"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading || !email || !password}>
            {loading ? (
              <>
                <InlineSpinner /> Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}