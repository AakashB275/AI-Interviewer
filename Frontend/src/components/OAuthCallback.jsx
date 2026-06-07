import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      alert('Google sign-in failed. Please try again.');
      navigate('/');
      return;
    }

    if (!code) {
      navigate('/');
      return;
    }

    fetch(`${API_BASE}/api/auth/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ code })
    })
      .then(async (r) => {
        const text = await r.text();
        const data = text ? JSON.parse(text) : {};

        if (r.ok && data.success) {
          login(data.token, data.user);
          navigate('/home');
        } else {
          console.error('Exchange failed:', data.error || r.status);
          alert('Sign-in failed: ' + (data.error || 'Please try again'));
          navigate('/');
        }
      })
      .catch((err) => {
        console.error('OAuth exchange error:', err);
        alert('Sign-in failed. Please try again.');
        navigate('/');
      });
  }, [searchParams, login, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
        <p className="text-gray-600">Completing sign-in...</p>
      </div>
    </div>
  );
}
