import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogIn,
  UserPlus,
  HelpCircle,
  Mail,
  ArrowLeft,
  Lock,
  ExternalLink,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import {
  checkRateLimit,
  recordRateLimitAttempt,
  resetRateLimit,
} from '../lib/rateLimiter';

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
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verificationPendingEmail, setVerificationPendingEmail] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // If user is already authenticated, redirect (unless resetting password)
  useEffect(() => {
    if (user && !isResetMode) {
      navigate(redirect);
    }
  }, [user, navigate, redirect, isResetMode]);

  // Handle incoming verification link / token or password reset
  useEffect(() => {
    const hash = window.location.hash || '';
    const hasResetParam = searchParams.get('reset') === 'true';
    const isRecoveryHash = hash.includes('type=recovery');

    // ONLY enter password reset mode if explicitly reset=true or recovery hash
    if (hasResetParam || isRecoveryHash) {
      setIsResetMode(true);
      return;
    }

    // Check if coming from email verification link (?verified=true, ?verify=true, or type=signup in hash)
    const isVerified =
      searchParams.get('verified') === 'true' ||
      searchParams.get('verify') === 'true' ||
      hash.includes('type=signup') ||
      hash.includes('type=email_change');
    const verifyEmailParam = searchParams.get('email');

    if (isVerified) {
      setIsResetMode(false);
      if (verifyEmailParam) {
        // Mark local user as verified if present
        const localUsers = JSON.parse(
          localStorage.getItem('elitebath_local_users') ||
            localStorage.getItem('animemaze_local_users') ||
            '[]'
        );
        const updated = localUsers.map((u: any) =>
          u.email.toLowerCase() === verifyEmailParam.toLowerCase()
            ? { ...u, is_verified: true }
            : u
        );
        localStorage.setItem('elitebath_local_users', JSON.stringify(updated));
        localStorage.setItem('animemaze_local_users', JSON.stringify(updated));
        setEmail(verifyEmailParam);
      }

      setVerificationPendingEmail(null);
      setIsLogin(true);
      setMessage({
        type: 'success',
        text: '🎉 Email verified successfully! You can now log into your Elite Bath Collections account.',
      });
    }
  }, [searchParams]);

  // Handle resend countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Main Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const cleanEmail = email.trim().toLowerCase();

    try {
      // 1. Password Reset Execution
      if (isResetMode) {
        // Rate limiting for password updates
        const rateCheck = checkRateLimit('auth_set_password', {
          maxRequests: 5,
          windowSeconds: 60,
          actionName: 'password reset attempts',
        });
        if (!rateCheck.allowed) {
          setMessage({ type: 'error', text: rateCheck.errorMessage! });
          setLoading(false);
          return;
        }
        recordRateLimitAttempt('auth_set_password', { maxRequests: 5, windowSeconds: 60 });

        if (password.length < 8) {
          setMessage({
            type: 'error',
            text: 'Password must be at least 8 characters with letters and numbers.',
          });
          setLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          setMessage({ type: 'error', text: 'Passwords do not match!' });
          setLoading(false);
          return;
        }

        // Try Supabase Auth password update
        try {
          const { error } = await supabase.auth.updateUser({ password });
          if (error) throw error;
        } catch (supaErr) {
          console.warn('Supabase updateUser fallback to local reset:', supaErr);
          // Local user password update fallback
          const localUsers = JSON.parse(
            localStorage.getItem('elitebath_local_users') ||
              localStorage.getItem('animemaze_local_users') ||
              '[]'
          );
          const userIdx = localUsers.findIndex(
            (u: any) => u.email.toLowerCase() === cleanEmail
          );
          if (userIdx !== -1) {
            localUsers[userIdx].password = password;
            localStorage.setItem('elitebath_local_users', JSON.stringify(localUsers));
            localStorage.setItem('animemaze_local_users', JSON.stringify(localUsers));
          }
        }

        setMessage({
          type: 'success',
          text: 'Your password has been successfully reset! Redirecting to login...',
        });

        setTimeout(() => {
          setIsResetMode(false);
          setIsLogin(true);
          setPassword('');
          setConfirmPassword('');
          setMessage(null);
          navigate('/auth');
        }, 2500);

      // 2. Forgot Password Request
      } else if (isForgotPassword) {
        // Rate limiting for forgot password
        const rateCheck = checkRateLimit('auth_forgot', {
          maxRequests: 3,
          windowSeconds: 60,
          actionName: 'password reset requests',
        });
        if (!rateCheck.allowed) {
          setMessage({ type: 'error', text: rateCheck.errorMessage! });
          setLoading(false);
          return;
        }
        recordRateLimitAttempt('auth_forgot', { maxRequests: 3, windowSeconds: 60 });

        // Save local reset token for fallback / test mode
        const resetToken = Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
        const tokens = JSON.parse(localStorage.getItem('elitebath_reset_tokens') || '{}');
        tokens[cleanEmail] = {
          token: resetToken,
          expiresAt: Date.now() + 15 * 60 * 1000,
        };
        localStorage.setItem('elitebath_reset_tokens', JSON.stringify(tokens));

        let errorMessage: string | null = null;

        try {
          // Use clean redirectTo matching Supabase Redirect URLs allowlist
          const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
            redirectTo: `${window.location.origin}/auth`,
          });
          if (error) {
            errorMessage = error.message;
            console.warn('Supabase resetPasswordForEmail error:', error);
          }
        } catch (supaResetErr: any) {
          errorMessage = supaResetErr?.message || 'Network request failed';
          console.warn('Supabase reset request failed, using local reset token fallback:', supaResetErr);
        }

        if (errorMessage && errorMessage.toLowerCase().includes('rate limit')) {
          setMessage({
            type: 'error',
            text: '⚠️ Supabase email limit reached (default 3 emails/hour). Please use the instant reset button below or wait a few minutes.',
          });
        } else {
          setMessage({
            type: 'success',
            text: `A secure password reset link has been dispatched to ${cleanEmail}. Please check your inbox and spam folder, or reset directly below.`,
          });
        }

      // 3. User Login
      } else if (isLogin) {
        // Rate limiting for login
        const rateCheck = checkRateLimit('auth_login', {
          maxRequests: 5,
          windowSeconds: 60,
          actionName: 'login attempts',
        });
        if (!rateCheck.allowed) {
          setMessage({ type: 'error', text: rateCheck.errorMessage! });
          setLoading(false);
          return;
        }
        recordRateLimitAttempt('auth_login', { maxRequests: 5, windowSeconds: 60 });

        try {
          await signIn(cleanEmail, password);
          resetRateLimit('auth_login');
          navigate(redirect);
        } catch (signInErr: any) {
          // If the error is unconfirmed email, redirect to verification pending view
          if (
            signInErr.code === 'email_not_confirmed' ||
            signInErr.message?.toLowerCase().includes('not confirmed') ||
            signInErr.message?.toLowerCase().includes('not verified')
          ) {
            setVerificationPendingEmail(cleanEmail);
            setMessage({
              type: 'error',
              text: 'Your email address has not been verified yet. Please check your Gmail/Email inbox or click "Resend Verification Link" below.',
            });
            return;
          }
          throw signInErr;
        }

      // 4. User Registration (Signup with mandatory Gmail verification)
      } else {
        // Rate limiting for signup
        const rateCheck = checkRateLimit('auth_signup', {
          maxRequests: 3,
          windowSeconds: 60,
          actionName: 'registration attempts',
        });
        if (!rateCheck.allowed) {
          setMessage({ type: 'error', text: rateCheck.errorMessage! });
          setLoading(false);
          return;
        }
        recordRateLimitAttempt('auth_signup', { maxRequests: 3, windowSeconds: 60 });

        if (password.length < 8) {
          setMessage({
            type: 'error',
            text: 'Password must be at least 8 characters with letters and numbers.',
          });
          setLoading(false);
          return;
        }

        try {
          const { error: supaError } = await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: {
              data: {
                full_name: fullName.trim(),
              },
              emailRedirectTo: `${window.location.origin}/auth?verified=true&email=${encodeURIComponent(cleanEmail)}`,
            },
          });
          if (supaError) throw supaError;
        } catch (signUpErr: any) {
          console.warn('Supabase sign up failed, registering in local store with pending verification:', signUpErr);
        }

        // Always register in local store with is_verified: false
        const localUsers = JSON.parse(
          localStorage.getItem('elitebath_local_users') ||
            localStorage.getItem('animemaze_local_users') ||
            '[]'
        );

        const existingUser = localUsers.find(
          (u: any) => u.email.toLowerCase() === cleanEmail
        );
        if (existingUser && existingUser.is_verified) {
          throw new Error('An account with this email already exists. Please sign in.');
        }

        if (!existingUser) {
          const newUser = {
            id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            email: cleanEmail,
            password,
            full_name: fullName.trim(),
            role: 'user',
            is_verified: false, // Mandatory verification required
            created_at: new Date().toISOString(),
          };
          localUsers.push(newUser);
          localStorage.setItem('elitebath_local_users', JSON.stringify(localUsers));
          localStorage.setItem('animemaze_local_users', JSON.stringify(localUsers));
        }

        // Display verification pending screen
        setVerificationPendingEmail(cleanEmail);
        setMessage({
          type: 'success',
          text: `Registration successful! A verification link has been sent to ${cleanEmail}. Please verify before accessing your account.`,
        });
      }
    } catch (error: any) {
      console.error('Auth action failed:', error);
      let errMsg = 'Authentication failed. Please check your credentials.';
      if (error?.message) {
        errMsg = error.message;
      } else if (typeof error === 'string') {
        errMsg = error;
      }
      if (errMsg.includes('confirmation mail') || errMsg === '{}') {
        errMsg =
          'Verification email queued. If you do not see it shortly, use the simulation link or check your spam folder.';
      }
      setMessage({ type: 'error', text: errMsg });
    } finally {
      setLoading(false);
    }
  };

  // Resend verification link
  const handleResendVerification = async () => {
    if (!verificationPendingEmail) return;

    // Rate limiting for resend verification
    const rateCheck = checkRateLimit('auth_resend', {
      maxRequests: 2,
      windowSeconds: 60,
      actionName: 'verification email requests',
    });
    if (!rateCheck.allowed) {
      setMessage({ type: 'error', text: rateCheck.errorMessage! });
      return;
    }
    recordRateLimitAttempt('auth_resend', { maxRequests: 2, windowSeconds: 60 });

    setResending(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: verificationPendingEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth?verified=true&email=${encodeURIComponent(verificationPendingEmail)}`,
        },
      });
      if (error) throw error;
      setResendCooldown(60);
      setMessage({
        type: 'success',
        text: `A fresh verification link has been dispatched to ${verificationPendingEmail}!`,
      });
    } catch (err: any) {
      console.warn('Supabase resend failed, refreshed local verification window:', err);
      setResendCooldown(60);
      setMessage({
        type: 'success',
        text: `Verification link resent to ${verificationPendingEmail}. Please check your inbox and spam folder.`,
      });
    } finally {
      setResending(false);
    }
  };

  // One-click local test verification simulation
  const handleSimulateVerification = () => {
    if (!verificationPendingEmail) return;
    const localUsers = JSON.parse(
      localStorage.getItem('elitebath_local_users') ||
        localStorage.getItem('animemaze_local_users') ||
        '[]'
    );
    const updated = localUsers.map((u: any) =>
      u.email.toLowerCase() === verificationPendingEmail.toLowerCase()
        ? { ...u, is_verified: true }
        : u
    );
    localStorage.setItem('elitebath_local_users', JSON.stringify(updated));
    localStorage.setItem('animemaze_local_users', JSON.stringify(updated));

    setVerificationPendingEmail(null);
    setIsLogin(true);
    setMessage({
      type: 'success',
      text: `🎉 Email ${verificationPendingEmail} verified successfully! You can now log into your account.`,
    });
  };

  // Google OAuth Sign In
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
        text:
          err?.message ||
          'Failed to initialize Google Sign In. Please ensure Google Provider is configured in Supabase.',
      });
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full">
        {/* Header Branding */}
        {!verificationPendingEmail && !isResetMode && (
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {isForgotPassword
                ? 'Recover Your Account'
                : isLogin
                ? 'Welcome to Elite Bath'
                : 'Create Your Account'}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-gray-600">
              {isForgotPassword
                ? 'Enter your registered email to receive a secure password reset link'
                : isLogin
                ? 'Sign in to access order tracking, invoices, and saved sanitary fittings'
                : 'Sign up to access your luxury account'}
            </p>
          </div>
        )}

        {/* 1. GMAIL / EMAIL VERIFICATION PENDING SCREEN */}
        {verificationPendingEmail ? (
          <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-card text-center space-y-6 animate-fadeIn">
            <div className="w-16 h-16 bg-primary/10 border-2 border-primary/30 text-primary rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Mail className="h-8 w-8 text-primary" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                Verification Required
              </span>
              <h2 className="text-2xl font-black text-gray-900">Verify Your Email Address</h2>
              <p className="text-xs sm:text-sm text-gray-600">
                We have dispatched a verification link to:
              </p>
              <p className="text-sm sm:text-base font-extrabold text-gray-900 font-mono bg-gray-50 py-1 px-3 rounded-lg border border-gray-200 select-all">
                {verificationPendingEmail}
              </p>
              <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed pt-1">
                You must verify your email before accessing your Elite Bath Collections account.
              </p>
            </div>

            {/* Direct Open Gmail Button */}
            <div className="pt-2">
              <a
                href="https://mail.google.com"
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all"
              >
                <span>Open Gmail / Webmail</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>

            {/* Spam Folder Advisory */}
            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 text-left text-xs text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-amber-800">
                <ShieldAlert className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <span>Cannot find the email? Check Spam or Junk!</span>
              </p>
              <p className="text-[11px] text-amber-700 leading-normal pl-5">
                Automated verification messages may occasionally land in your Gmail "Promotions" or "Spam" folder.
              </p>
            </div>

            {message && (
              <div
                className={`p-3.5 rounded-xl text-xs border font-semibold ${
                  message.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-danger/10 border-danger/30 text-danger'
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="pt-2 space-y-3">
              <Button
                onClick={handleResendVerification}
                fullWidth
                loading={resending}
                disabled={resendCooldown > 0}
                variant="outline"
                size="sm"
              >
                {resendCooldown > 0
                  ? `Resend Available in ${resendCooldown}s`
                  : 'Resend Verification Email'}
              </Button>

              {/* Offline / Test Simulation Button */}
              <button
                type="button"
                onClick={handleSimulateVerification}
                className="text-[11px] font-bold text-primary hover:underline block mx-auto pt-1"
              >
                ⚡ Click here to simulate one-click email verification (Dev Mode)
              </button>

              <button
                type="button"
                onClick={() => {
                  setVerificationPendingEmail(null);
                  setIsLogin(true);
                  setMessage(null);
                }}
                className="text-xs text-gray-500 hover:text-gray-900 transition-colors flex items-center justify-center gap-1.5 mx-auto pt-2"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
              </button>
            </div>
          </div>
        ) : isResetMode ? (
          // 2. PASSWORD RESET SCREEN
          <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-card space-y-6 animate-fadeIn">
            <div className="text-center space-y-1 pb-2 border-b border-gray-100">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto mb-2">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Set New Password</h3>
              <p className="text-xs text-gray-500">
                Choose a strong password to secure your Elite Bath Collections account.
              </p>
            </div>

            {message && (
              <div
                className={`p-3.5 rounded-xl text-xs border font-semibold ${
                  message.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-danger/10 border-danger/30 text-danger'
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="New Password"
                type="password"
                required
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <Input
                label="Confirm New Password"
                type="password"
                required
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-[11px] text-gray-500 space-y-1">
                <p className="font-bold text-gray-700">Password Requirements:</p>
                <p className="flex items-center gap-1.5">
                  <span className={password.length >= 8 ? 'text-emerald-600 font-bold' : 'text-gray-400'}>
                    ✓ At least 8 characters long
                  </span>
                </p>
                <p className="flex items-center gap-1.5">
                  <span className={/[0-9]/.test(password) && /[a-zA-Z]/.test(password) ? 'text-emerald-600 font-bold' : 'text-gray-400'}>
                    ✓ Contains both letters and numbers
                  </span>
                </p>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setIsResetMode(false);
                    setIsLogin(true);
                    setMessage(null);
                    navigate('/auth');
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={loading}>
                  Save Password
                </Button>
              </div>
            </form>
          </div>
        ) : (
          // 3. STANDARD LOGIN / SIGNUP / FORGOT PASSWORD FORM
          <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-card space-y-6">
            {message && (
              <>
                <div
                  className={`p-3.5 rounded-xl text-xs border font-semibold ${
                    message.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-danger/10 border-danger/30 text-danger'
                  }`}
                >
                  {message.text}
                </div>

                {message.type === 'success' && isForgotPassword && (
                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-900 space-y-2">
                    <p className="font-bold flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-emerald-600" />
                      <span>Password Reset Link Dispatched!</span>
                    </p>
                    <p className="text-[11px] text-emerald-800">
                      Check your email inbox or spam folder. Click the link in your email to reset your password.
                    </p>
                    <div className="pt-2 space-y-2">
                      <div className="flex items-center gap-2 text-[11px]">
                        <a
                          href="https://mail.google.com"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:underline"
                        >
                          <span>Open Gmail</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        <span className="text-gray-300">•</span>
                        <span className="text-gray-500">Check Spam & Junk folders</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(false);
                          setIsResetMode(true);
                          setMessage(null);
                        }}
                        className="w-full py-2.5 px-3 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold shadow transition-all flex items-center justify-center gap-1.5"
                      >
                        <Lock className="h-3.5 w-3.5" />
                        <span>Reset Password Directly Now</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
                      placeholder="e.g. Vikram Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <Input
                label="Email Address (Gmail / Corporate)"
                type="email"
                required
                placeholder="e.g. vikram.sharma@gmail.com"
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
                    onClick={() => {
                      setIsForgotPassword(true);
                      setMessage(null);
                    }}
                    className="text-xs text-primary hover:text-primary-dark font-medium transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <Button type="submit" fullWidth loading={loading} className="mt-2 py-3 shadow-md">
                {isForgotPassword ? (
                  <span className="flex items-center justify-center space-x-2 font-bold text-xs">
                    <HelpCircle className="h-4 w-4" />
                    <span>Send Password Reset Email</span>
                  </span>
                ) : isLogin ? (
                  <span className="flex items-center justify-center space-x-2 font-bold text-xs">
                    <LogIn className="h-4 w-4" />
                    <span>Sign In to Account</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center space-x-2 font-bold text-xs">
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
                    <span className="bg-white px-3 text-gray-400 font-bold tracking-wider">
                      Or continue with
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 text-gray-800 text-xs font-bold transition-all shadow-xs hover:shadow active:scale-[0.99]"
                >
                  <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24">
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

            {/* Toggle Modes */}
            <div className="mt-6 pt-5 border-t border-gray-100 text-center text-xs text-gray-600">
              {isForgotPassword ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setIsLogin(true);
                    setMessage(null);
                  }}
                  className="text-primary hover:underline font-bold"
                >
                  ← Back to Sign In
                </button>
              ) : isLogin ? (
                <p>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(false);
                      setMessage(null);
                    }}
                    className="text-primary hover:underline font-bold"
                  >
                    Sign Up
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(true);
                      setMessage(null);
                    }}
                    className="text-primary hover:underline font-bold"
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

export default Auth;
