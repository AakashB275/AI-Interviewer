import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

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

    // Exchange the authorization code for a JWT token
    (async () => {
      try {
        const response = await fetch('/api/users/auth/exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', // Include cookies in request
          body: JSON.stringify({ code })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to exchange authorization code');
        }

        const data = await response.json();
        if (data.success) {
          login(data.token, data.user);
          navigate('/home');
        } else {
          throw new Error(data.error || 'Sign-in failed');
        }
      } catch (err) {
        console.error('OAuth exchange error:', err.message);
        alert(`Sign-in failed: ${err.message}`);
        navigate('/');
      }
    })();
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