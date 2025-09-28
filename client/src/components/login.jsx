import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import loginImage from '../assets/login-image.png';
import '../Login.css';


const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(email, password);
    
    if (!result.success) {
      setError(result.message);
    }
    // If successful, AuthContext will handle redirecting
    
    setIsLoading(false);
  };

  const fillTestCredentials = (role) => {
    if (role === 'admin') {
      setEmail('admin@test.com');
      setPassword('admin123');
    } else {
      setEmail('john@test.com');
      setPassword('client123');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1F2937' }}>
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <img
            src={loginImage}
            alt="Company Logo"
            className="mx-auto h-32 w-auto"
          />
          <p className="mt-2 text-center text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Sign in to your account
          </p>
        </div>

        {/* Test Account Buttons */}
        <div className="bg-gray-50 p-4 rounded-md">
          <p className="text-sm text-gray-700 mb-2 font-medium">Quick Test Login:</p>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => fillTestCredentials('admin')}
              className="flex-1 py-1 px-3 text-xs border border-gray-300 rounded-md hover:bg-gray-100"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => fillTestCredentials('client')}
              className="flex-1 py-1 px-3 text-xs border border-gray-300 rounded-md hover:bg-gray-100"
            >
              Client
            </button>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Adresse Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500"
              placeholder="Enter your password"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              style={{ 
                backgroundColor: '#EF4444',
                fontFamily: 'Poppins, sans-serif'
              }}
            >
              {isLoading ? 'Signing in...' : 'Se connecter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;