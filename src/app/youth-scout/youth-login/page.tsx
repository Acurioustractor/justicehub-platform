'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Rocket,
  Shield,
  UserPlus
} from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';

export default function YouthLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true); // true = login, false = signup
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    age: '',
    agreeToTerms: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    if (!isLogin) {
      // Signup validation
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (!formData.agreeToTerms) {
        setError('Please agree to the terms and conditions');
        return;
      }
      if (!formData.firstName || !formData.age) {
        setError('Please provide your name and age');
        return;
      }
      const ageNum = parseInt(formData.age);
      if (isNaN(ageNum) || ageNum < 13 || ageNum > 25) {
        setError('Youth Scout is for ages 13-25');
        return;
      }
    }

    setLoading(true);

    try {
      // TODO: Implement actual authentication
      // For now, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock successful login/signup
      if (isLogin) {
        // Redirect to youth dashboard
        router.push('/youth-scout/dashboard');
      } else {
        // Redirect to onboarding
        router.push('/youth-scout/onboarding');
      }
    } catch (err) {
      setError(isLogin ? 'Invalid email or password' : 'Failed to create account');
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen page-content bg-gradient-to-br from-blue-50 via-purple-50 to-orange-50">
      <Navigation />

      <main className="header-offset">
        <div className="container-justice py-12">
          {/* Back Link */}
          <Link
            href="/youth-scout"
            className="inline-flex items-center gap-2 text-black hover:underline font-medium mb-8"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Youth Scout
          </Link>

          <div className="max-w-md mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-800 text-white font-bold text-sm uppercase tracking-wider mb-4">
                <Rocket className="h-4 w-4" />
                Youth Scout
              </div>

              <h1 className="text-3xl font-black mb-3 text-blue-800">
                {isLogin ? 'Welcome Back!' : 'Start Your Journey'}
              </h1>

              <p className="text-gray-700">
                {isLogin
                  ? 'Log in to continue tracking your growth and connecting with opportunities'
                  : 'Create your account to begin your personalized path to success'}
              </p>
            </div>

            {/* Login/Signup Form */}
            <div className="bg-white border-2 border-black p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              {error && (
                <div className="mb-6 bg-red-50 border-2 border-red-600 p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-800 font-medium text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Sign Up Only Fields */}
                {!isLogin && (
                  <>
                    <div>
                      <label htmlFor="firstName" className="block font-bold mb-2 text-sm">
                        First Name *
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required={!isLogin}
                        placeholder="What should we call you?"
                        className="w-full px-4 py-3 border-2 border-black focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
                      />
                    </div>

                    <div>
                      <label htmlFor="age" className="block font-bold mb-2 text-sm">
                        Your Age *
                      </label>
                      <input
                        type="number"
                        id="age"
                        name="age"
                        value={formData.age}
                        onChange={handleInputChange}
                        required={!isLogin}
                        min="13"
                        max="25"
                        placeholder="Ages 13-25"
                        className="w-full px-4 py-3 border-2 border-black focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        Youth Scout is designed for ages 13-25
                      </p>
                    </div>
                  </>
                )}

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block font-bold mb-2 text-sm">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="your.email@example.com"
                      className="w-full pl-11 pr-4 py-3 border-2 border-black focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block font-bold mb-2 text-sm">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      placeholder={isLogin ? 'Enter your password' : 'Create a strong password'}
                      className="w-full pl-11 pr-11 py-3 border-2 border-black focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-black"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {!isLogin && (
                    <p className="text-xs text-gray-600 mt-1">
                      At least 8 characters with a mix of letters and numbers
                    </p>
                  )}
                </div>

                {/* Confirm Password (Sign Up Only) */}
                {!isLogin && (
                  <div>
                    <label htmlFor="confirmPassword" className="block font-bold mb-2 text-sm">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        required={!isLogin}
                        placeholder="Re-enter your password"
                        className="w-full pl-11 pr-4 py-3 border-2 border-black focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
                      />
                    </div>
                  </div>
                )}

                {/* Remember Me / Forgot Password (Login Only) */}
                {isLogin && (
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="rounded" />
                      <span>Remember me</span>
                    </label>
                    <Link href="/youth-scout/forgot-password" className="text-blue-800 hover:underline font-medium">
                      Forgot password?
                    </Link>
                  </div>
                )}

                {/* Terms & Conditions (Sign Up Only) */}
                {!isLogin && (
                  <div className="bg-blue-50 border-2 border-blue-800 p-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="agreeToTerms"
                        checked={formData.agreeToTerms}
                        onChange={handleInputChange}
                        required={!isLogin}
                        className="mt-1"
                      />
                      <div className="text-sm">
                        <span>I agree to the </span>
                        <Link href="/terms" className="text-blue-800 hover:underline font-bold">
                          Terms of Service
                        </Link>
                        <span> and </span>
                        <Link href="/privacy" className="text-blue-800 hover:underline font-bold">
                          Privacy Policy
                        </Link>
                      </div>
                    </label>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-800 hover:bg-blue-700 text-white font-bold py-4 px-6 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                      {isLogin ? 'Logging in...' : 'Creating account...'}
                    </>
                  ) : (
                    <>
                      {isLogin ? (
                        <>
                          <Lock className="h-5 w-5" />
                          Log In
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-5 w-5" />
                          Create Account
                        </>
                      )}
                    </>
                  )}
                </button>
              </form>

              {/* Toggle Between Login/Signup */}
              <div className="mt-6 text-center border-t-2 border-gray-200 pt-6">
                <p className="text-sm text-gray-700">
                  {isLogin ? "Don't have an account?" : 'Already have an account?'}
                  {' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setError(null);
                      setFormData({
                        email: '',
                        password: '',
                        confirmPassword: '',
                        firstName: '',
                        age: '',
                        agreeToTerms: false
                      });
                    }}
                    className="text-blue-800 hover:underline font-bold"
                  >
                    {isLogin ? 'Sign up here' : 'Log in here'}
                  </button>
                </p>
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="mt-6 bg-white border-2 border-black p-6 text-center">
              <Shield className="h-8 w-8 text-blue-800 mx-auto mb-3" />
              <h3 className="font-bold mb-2">Your Privacy is Protected</h3>
              <p className="text-sm text-gray-700">
                We use industry-standard encryption to protect your data. We'll never share your information
                without your explicit consent.
              </p>
            </div>

            {/* Quick Preview Link */}
            <div className="mt-6 text-center">
              <Link
                href="/youth-scout/youth-preview"
                className="text-blue-800 hover:underline font-medium text-sm"
              >
                Want to see what Youth Scout offers? Take a quick tour →
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}