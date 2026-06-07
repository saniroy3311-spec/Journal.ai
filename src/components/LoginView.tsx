import React, { useState } from 'react';
import { Sparkles, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (token: string, username: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!username.trim()) {
      setError('Username is required.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }
    if (isRegistering && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (isRegistering && password.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to authenticate.');
      }

      onLoginSuccess(data.token, data.user.username);
    } catch (err: any) {
      setError(err.message || 'Server connection failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF7] text-[#1C1C1E] flex items-center justify-center p-4 font-sans select-none antialiased relative overflow-hidden">
      {/* Decorative Premium Background Gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-gradient-to-tr from-[#244230]/5 to-[#5C8A6E]/10 blur-3xl" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-gradient-to-tr from-[#244230]/5 to-[#5C8A6E]/10 blur-3xl" />

      {/* Main Glass Card */}
      <div className="w-full max-w-md bg-white border border-[#D9D9D2] rounded-3xl p-6 md:p-8 shadow-2xl relative z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center space-y-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#244230] to-[#5C8A6E] flex items-center justify-center shadow-lg shadow-[#244230]/20">
            <span className="text-white text-xl font-black font-display">J</span>
          </div>
          <div>
            <h1 className="text-2xl font-black font-display text-[#1C1C1E] tracking-tight">
              Journal.ai
            </h1>
            <p className="text-xs text-[#5C5C5E] font-semibold tracking-wide uppercase mt-0.5">
              Portfolio & Analytics Engine
            </p>
          </div>
        </div>

        {/* Auth Toggle Tab */}
        <div className="bg-[#EAEAE2] p-1 rounded-xl flex border border-[#D9D9D2]/35">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(false);
              setError('');
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-extrabold transition-all ${
              !isRegistering
                ? 'bg-white text-[#1C1C1E] shadow-sm'
                : 'text-[#5C5C5E] hover:text-[#1C1C1E]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegistering(true);
              setError('');
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-extrabold transition-all ${
              isRegistering
                ? 'bg-white text-[#1C1C1E] shadow-sm'
                : 'text-[#5C5C5E] hover:text-[#1C1C1E]'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="bg-[#FADCDC] border border-red-200/50 rounded-xl p-3 flex items-start gap-2.5 text-xs text-[#991B1B] font-semibold">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Forms */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-[#5C5C5E] uppercase tracking-wider block">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full bg-[#FAFAF7] border border-[#D9D9D2] rounded-xl px-4 py-3 text-xs font-extrabold text-[#1C1C1E] focus:outline-none focus:ring-1 focus:ring-[#244230]"
              disabled={isLoading}
              autoComplete="username"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-[#5C5C5E] uppercase tracking-wider block">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-[#FAFAF7] border border-[#D9D9D2] rounded-xl pl-4 pr-10 py-3 text-xs font-extrabold text-[#1C1C1E] focus:outline-none focus:ring-1 focus:ring-[#244230]"
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5C5C5E] hover:text-[#1C1C1E] p-1 rounded transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {isRegistering && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-[#5C5C5E] uppercase tracking-wider block">
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full bg-[#FAFAF7] border border-[#D9D9D2] rounded-xl px-4 py-3 text-xs font-extrabold text-[#1C1C1E] focus:outline-none focus:ring-1 focus:ring-[#244230]"
                disabled={isLoading}
                autoComplete="new-password"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-[#244230] hover:bg-[#1b3224] text-white py-3 rounded-xl text-xs font-extrabold shadow-md shadow-[#244230]/20 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles size={14} />
                <span>{isRegistering ? 'Register & Set Up' : 'Sign In to Dashboard'}</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Hint */}
        <div className="text-center pt-2">
          <p className="text-[10px] text-[#5C5C5E] font-medium leading-relaxed">
            {isRegistering 
              ? 'Creating an account will automatically seed a demo trading history so you can test all platform features instantly.'
              : 'Sign in to access your secure, private trade logs and customized journal insights.'}
          </p>
          {!isRegistering && (
            <p className="text-[10px] text-[#244230] font-extrabold mt-2">
              Tip: Use username <span className="underline">demo</span> and password <span className="underline">demo</span> to explore.
            </p>
          )}
        </div>

      </div>
    </div>
  );
};
