import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus, HelpCircle, Mail, ArrowLeft, Lock } from 'lucide-react';

export const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  
  const { user, signIn } = useAuthStore();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verificationPendingEmail, setVerificationPendingEmail] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // If user is already authenticated, redirect (unless resetting password)
  useEffect(() => {
    if (user && !isResetMode) {
      navigate(redirect);
    }
  }, [user, navigate, redirect, isResetMode]);

  // Check if routed for password reset (recovery type in hash or reset query param)
  useEffect(() => {
    const hasResetParam = searchParams.get('reset') === 'true';
    const hasRecoveryHash = window.location.hash.includes('type=recovery') || window.location.hash.includes('access_token=');
    if (hasResetParam || hasRecoveryHash) {
      setIsResetMode(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isResetMode) {
        if (password !== confirmPassword) {
          setMessage({ type: 'error', text: 'Passwords do not match!' });
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Your password has been successfully reset! Redirecting to login...' });
        setTimeout(() => {
          setIsResetMode(false);
          setIsLogin(true);
          setPassword('');
          setConfirmPassword('');
          setMessage(null);
          navigate('/auth');
        }, 3000);
      } else if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?reset=true`,
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Password reset link sent to your email!' });
      } else if (isLogin) {
        await signIn(email, password);
        navigate(redirect);
      } else {
        try {
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName,
              },
            },
          });
          if (error) throw error;
          setVerificationPendingEmail(email);
          setMessage({ 
            type: 'success', 
            text: 'Registration successful! A verification link has been sent to your email.' 
          });
        } catch (signUpErr: any) {
          console.warn('Supabase sign up failed, registering user locally:', signUpErr);
          
          // Local Register Fallback
          const localUsers = JSON.parse(localStorage.getItem('animemaze_local_users') || '[]');
          if (localUsers.some((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
            throw new Error('An account with this email already exists locally.');
          }

          const newUser = {
            id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            email: email.trim(),
            password: password,
            full_name: fullName.trim(),
            role: 'user',
            created_at: new Date().toISOString()
          };

          localUsers.push(newUser);
          localStorage.setItem('animemaze_local_users', JSON.stringify(localUsers));

          setMessage({
            type: 'success',
            text: 'Registration successful (Local Offline Mode)! You can now log in using your credentials.'
          });

          // Switch to login tab after 2 seconds
          setTimeout(() => {
            setIsLogin(true);
            setMessage(null);
            setPassword('');
          }, 2000);
        }
      }
    } catch (error: any) {
      console.error('Auth action failed:', error);
      let errMsg = 'Authentication failed. Please check details.';
      if (error) {
        if (typeof error === 'string') {
          errMsg = error;
        } else if (error.message && typeof error.message === 'string') {
          errMsg = error.message;
        } else if (error.error_description && typeof error.error_description === 'string') {
          errMsg = error.error_description;
        } else if (typeof error === 'object') {
          errMsg = error.message || JSON.stringify(error);
        }
      }
      if (errMsg === '{}' || errMsg.includes('confirmation mail')) {
        errMsg = 'SMTP Configuration Error: Supabase failed to send the confirmation email. Please verify your SMTP Host, Port, Password, and Sender Email in the Supabase Dashboard.';
      }
      setMessage({ type: 'error', text: errMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!verificationPendingEmail) return;
    setResending(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: verificationPendingEmail,
      });
      if (error) throw error;
      setMessage({ type: 'success', text: 'Verification link resent successfully to your email!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to resend verification link.' });
    } finally {
      setResending(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setMessage(null);
      const targetRedirect = redirect && !redirect.includes('/auth') ? redirect : '/dashboard';
      const redirectUrl = `${window.location.origin}${targetRedirect}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      setMessage({
        type: 'error',
        text: err?.message || 'Failed to initialize Google Sign In. Please make sure Google Provider is enabled in Supabase.',
      });
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full">
        {!verificationPendingEmail && !isResetMode && (
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">
              {isForgotPassword ? 'Reset Password' : isLogin ? 'Welcome Back' : 'Create an Account'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {isForgotPassword
                ? 'Enter your email to receive a recovery link'
                : isLogin
                ? "Sign in to track orders and manage your saved fittings"
                : 'Create an account to streamline checkout and track deliveries'}
            </p>
          </div>
        )}

        {verificationPendingEmail ? (
          <div className="glass-card p-8 rounded-2xl border border-gray-200 shadow-sm text-center space-y-6">
            <div className="w-16 h-16 bg-primary/10 border border-primary/20 text-primary rounded-full flex items-center justify-center mx-auto">
              <Mail className="h-8 w-8 text-primary" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Verify Your Email</h2>
              <p className="text-sm text-gray-600">
                We've sent a verification link to <strong className="text-gray-900">{verificationPendingEmail}</strong>.
              </p>
              <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                Please click the link in the email to activate your Elite Bath Collections account.
              </p>
            </div>

            {/* Spam Warning */}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
              <p className="text-amber-800 font-bold text-sm flex items-center justify-center gap-2">
                <span className="text-lg">⚠️</span>
                CHECK YOUR SPAM FOLDER!
              </p>
              <p className="text-amber-700 text-xs mt-1">
                If you don't see the email in your inbox, check your spam/junk folder.
              </p>
            </div>

            {message && (
              <div
                className={`p-4 rounded-lg text-sm border font-medium ${
                  message.type === 'success'
                    ? 'bg-success/10 border-success/30 text-success'
                    : 'bg-danger/10 border-danger/30 text-danger'
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="pt-4 space-y-3">
              <Button onClick={handleResendVerification} fullWidth loading={resending} variant="outline">
                Resend Verification Link
              </Button>
              <button
                onClick={() => {
                  setVerificationPendingEmail(null);
                  setIsLogin(true);
                  setMessage(null);
                }}
                className="text-xs text-gray-500 hover:text-gray-900 transition-colors flex items-center justify-center gap-1.5 mx-auto"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
              </button>
            </div>
          </div>
        ) : isResetMode ? (
          <div className="glass-card p-8 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              <span>Set New Password</span>
            </h3>

            {message && (
              <div
                className={`mb-6 p-4 rounded-lg text-sm border font-medium ${
                  message.type === 'success'
                    ? 'bg-success/10 border-success/30 text-success'
                    : 'bg-danger/10 border-danger/30 text-danger'
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="New Password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <Input
                label="Confirm New Password"
                type="password"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <div className="flex gap-4 justify-end pt-4">
                <Button variant="outline" type="button" onClick={() => {
                  setIsResetMode(false);
                  setIsLogin(true);
                  setMessage(null);
                  navigate('/auth');
                }}>
                  Cancel
                </Button>
                <Button type="submit" loading={loading}>
                  Save Password
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <div className="glass-card p-8 rounded-2xl border border-gray-200 shadow-sm">
            {message && (
              <>
                <div
                  className={`mb-4 p-4 rounded-lg text-sm border font-medium ${
                    message.type === 'success'
                      ? 'bg-success/10 border-success/30 text-success'
                      : 'bg-danger/10 border-danger/30 text-danger'
                  }`}
                >
                  {message.text}
                </div>

                {/* Spam Warning for password reset */}
                {message.type === 'success' && isForgotPassword && (
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4 mb-4">
                    <p className="text-amber-800 font-bold text-sm flex items-center justify-center gap-2">
                      <span className="text-lg">⚠️</span>
                      CHECK YOUR SPAM FOLDER!
                    </p>
                    <p className="text-amber-700 text-xs mt-1">
                      If you don't see the email in your inbox, check your spam/junk folder.
                    </p>
                  </div>
                )}
              </>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <AnimatePresence mode="wait">
                {!isLogin && !isForgotPassword && (
                  <motion.div
                    key="signup-fields"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Input
                      label="Full Name"
                      type="text"
                      required
                      placeholder="E.g. Rajesh Mehra"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <Input
                label="Email Address"
                type="email"
                required
                placeholder="rajesh.mehra@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              {!isForgotPassword && (
                <Input
                  label="Password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              )}

              {isLogin && !isForgotPassword && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-xs text-primary hover:text-primary-dark transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <Button type="submit" fullWidth loading={loading} className="mt-4">
                {isForgotPassword ? (
                  <span className="flex items-center justify-center space-x-2">
                    <HelpCircle className="h-4 w-4" />
                    <span>Send Recovery Email</span>
                  </span>
                ) : isLogin ? (
                  <span className="flex items-center justify-center space-x-2">
                    <LogIn className="h-4 w-4" />
                    <span>Sign In</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center space-x-2">
                    <UserPlus className="h-4 w-4" />
                    <span>Sign Up</span>
                  </span>
                )}
              </Button>
            </form>

            {/* Google OAuth Divider & Button */}
            {!isForgotPassword && (
              <div className="mt-6">
                <div className="relative mb-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 text-gray-500 font-semibold tracking-wider">Or continue with</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 text-gray-800 text-sm font-semibold transition-all shadow-sm hover:shadow active:scale-[0.99]"
                >
                  <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </div>
            )}

            {/* Toggle Links */}
            <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
              {isForgotPassword ? (
                <button
                  onClick={() => {
                    setIsForgotPassword(false);
                    setIsLogin(true);
                    setMessage(null);
                  }}
                  className="text-primary hover:text-primary-dark font-medium transition-colors"
                >
                  Back to Sign In
                </button>
              ) : isLogin ? (
                <p>
                  Don't have an account?{' '}
                  <button
                    onClick={() => {
                      setIsLogin(false);
                      setMessage(null);
                    }}
                    className="text-primary hover:text-primary-dark font-medium transition-colors"
                  >
                    Sign Up
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button
                    onClick={() => {
                      setIsLogin(true);
                      setMessage(null);
                    }}
                    className="text-primary hover:text-primary-dark font-medium transition-colors"
                  >
                    Sign In
                  </button>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
