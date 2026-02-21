import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const userName = searchParams.get('userName');
    const userId = searchParams.get('userId');
    const error = searchParams.get('error');

    if (error) {
      alert('Google sign-in failed. Please try again.');
      navigate('/');
      return;
    }

    if (token) {
      login(token, { userName, _id: userId });
      navigate('/home');
    } else {
      navigate('/');
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
        <p className="text-gray-600">Completing sign-in...</p>
      </div>
    </div>
  );
}