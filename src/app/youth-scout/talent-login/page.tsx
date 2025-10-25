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
  Building2,
  Shield,
  Briefcase,
  Users,
  UserPlus
} from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';

export default function TalentLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true); // true = login, false = signup
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    organization: '',
    role: '',
    agreeToTerms: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
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
      if (!formData.fullName || !formData.organization || !formData.role) {
        setError('Please provide all required information');
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
        // Redirect to talent scout dashboard
        router.push('/youth-scout/talent-dashboard');
      } else {
        // Redirect to onboarding
        router.push('/youth-scout/talent-onboarding');
      }
    } catch (err) {
      setError(isLogin ? 'Invalid email or password' : 'Failed to create account');
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    'Mentor',
    'Recruiter',
    'Program Manager',
    'Social Worker',
    'Teacher/Educator',
    'Business Owner',
    'HR Professional',
    'Community Leader',
    'Other'
  ];

  return (
    <div className="min-h-screen page-content bg-gradient-to-br from-orange-50 via-yellow-50 to-pink-50">
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
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white font-bold text-sm uppercase tracking-wider mb-4">
                <Building2 className="h-4 w-4" />
                Talent Scout
              </div>

              <h1 className="text-3xl font-black mb-3 text-orange-600">
                {isLogin ? 'Welcome Back, Scout!' : 'Join as Talent Scout'}
              </h1>

              <p className="text-gray-700">
                {isLogin
                  ? 'Log in to discover emerging talent and make meaningful connections'
                  : 'Create your account to start connecting with exceptional young people'}
              </p>
            </div>

            {/* Login/Signup Form */}
            <div className="bg-white border-2 border-black p-8 shadow-lg">
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
                      <label htmlFor="fullName" className="block font-bold mb-2 text-sm">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required={!isLogin}
                        placeholder="Your full name"
                        className="w-full px-4 py-3 border-2 border-black focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
                      />
                    </div>

                    <div>
                      <label htmlFor="organization" className="block font-bold mb-2 text-sm">
                        Organization *
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          id="organization"
                          name="organization"
                          value={formData.organization}
                          onChange={handleInputChange}
                          required={!isLogin}
                          placeholder="Company, non-profit, or program name"
                          className="w-full pl-11 pr-4 py-3 border-2 border-black focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="role" className="block font-bold mb-2 text-sm">
                        Your Role *
                      </label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <select
                          id="role"
                          name="role"
                          value={formData.role}
                          onChange={handleInputChange}
                          required={!isLogin}
                          className="w-full pl-11 pr-4 py-3 border-2 border-black focus:ring-2 focus:ring-orange-600 focus:border-orange-600 appearance-none bg-white"
                        >
                          <option value="">Select your role...</option>
                          {roleOptions.map(role => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block font-bold mb-2 text-sm">
                    Work Email Address *
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
                      placeholder="your.email@organization.com"
                      className="w-full pl-11 pr-4 py-3 border-2 border-black focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Use your professional email address
                  </p>
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
                      className="w-full pl-11 pr-11 py-3 border-2 border-black focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
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
                        className="w-full pl-11 pr-4 py-3 border-2 border-black focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
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
                    <Link href="/youth-scout/forgot-password" className="text-orange-600 hover:underline font-medium">
                      Forgot password?
                    </Link>
                  </div>
                )}

                {/* Terms & Conditions (Sign Up Only) */}
                {!isLogin && (
                  <div className="bg-orange-50 border-2 border-orange-600 p-4">
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
                        <Link href="/terms" className="text-orange-600 hover:underline font-bold">
                          Terms of Service
                        </Link>
                        <span> and </span>
                        <Link href="/privacy" className="text-orange-600 hover:underline font-bold">
                          Privacy Policy
                        </Link>
                        <p className="mt-2 text-xs text-gray-700">
                          By signing up, I commit to using this platform ethically to support
                          and empower young people.
                        </p>
                      </div>
                    </label>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 px-6 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                        fullName: '',
                        organization: '',
                        role: '',
                        agreeToTerms: false
                      });
                    }}
                    className="text-orange-600 hover:underline font-bold"
                  >
                    {isLogin ? 'Sign up here' : 'Log in here'}
                  </button>
                </p>
              </div>
            </div>

            {/* What You Get */}
            {!isLogin && (
              <div className="mt-6 bg-white border-2 border-black p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-orange-600" />
                  What You Get as a Talent Scout
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 font-bold">•</span>
                    <span>Access to profiles of emerging young talent with verified skills</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 font-bold">•</span>
                    <span>Tools to track mentorship outcomes and measure impact</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 font-bold">•</span>
                    <span>Connection with grassroots programs and community leaders</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 font-bold">•</span>
                    <span>Insights from youth voices to transform your organization</span>
                  </li>
                </ul>
              </div>
            )}

            {/* Privacy Notice */}
            <div className="mt-6 bg-white border-2 border-black p-6 text-center">
              <Shield className="h-8 w-8 text-orange-600 mx-auto mb-3" />
              <h3 className="font-bold mb-2">Verified & Secure Platform</h3>
              <p className="text-sm text-gray-700">
                All talent scouts are verified to ensure the safety and privacy of young people
                in our network. Your data is encrypted and protected.
              </p>
            </div>

            {/* Quick Preview Link */}
            <div className="mt-6 text-center">
              <Link
                href="/youth-scout/talent-preview"
                className="text-orange-600 hover:underline font-medium text-sm"
              >
                Want to learn more about Talent Scout? Take a quick tour →
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}