import { FormEvent, useState } from 'react';
import '../styles/LoginView.css';

type AuthSuccess = {
  username: string;
  access: string;
  refresh: string;
};

type LoginViewProps = {
  onLoginSuccess: (payload: AuthSuccess) => void;
};

export function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) || 'http://localhost:8000';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/api/auth/token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.detail || 'Login failed. Check your credentials and try again.');
        return;
      }

      onLoginSuccess({
        username,
        access: data.access,
        refresh: data.refresh,
      });
    } catch {
      setError('Unable to reach the server. Confirm Django is running and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-view">
      <section className="login-card" aria-label="Login form">
        <h1 className="login-card__title">Sign in</h1>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-form__label" htmlFor="username">
            Username
          </label>
          <input
            className="login-form__input"
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            disabled={loading}
          />

          <label className="login-form__label" htmlFor="password">
            Password
          </label>
          <input
            className="login-form__input"
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={loading}
          />

          {error && <p className="login-form__error">{error}</p>}

          <button className="login-form__button" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  );
}
