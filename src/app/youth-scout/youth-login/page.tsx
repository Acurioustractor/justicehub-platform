'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';

export default function YouthLoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    age: '',
    location: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In real app, would handle authentication here
    // For now, redirect to dashboard
    window.location.href = '/youth-scout/dashboard';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-orange-50">
      <Navigation />

      <main className="pt-32 pb-16">
        <div className="container-justice">
          {/* Back Link */}
          <div className="mb-8">
            <Link 
              href="/youth-scout"
              className="inline-flex items-center gap-2 font-medium text-gray-700 hover:text-black transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Youth Scout
            </Link>
          </div>

          <div className="max-w-md mx-auto">
            <div className="bg-white border-4 border-blue-800 p-8 shadow-xl">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-800 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-8 w-8" />
                </div>
                <h1 className="text-2xl font-black text-blue-800 mb-2">
                  {isLogin ? 'WELCOME BACK!' : 'JOIN YOUTH SCOUT'}
                </h1>
                <p className="text-gray-600">
                  {isLogin 
                    ? 'Ready to continue your journey?' 
                    : 'Start your personalized growth journey today'
                  }
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {!isLogin && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold mb-2">First Name</label>
                        <input
                          type="text"
                          required
                          value={formData.firstName}
                          onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                          className="w-full p-3 border-2 border-black focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
                          placeholder="Your first name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-2">Last Name</label>
                        <input
                          type="text"
                          required
                          value={formData.lastName}
                          onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                          className="w-full p-3 border-2 border-black focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
                          placeholder="Your last name"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold mb-2">Age</label>
                        <select
                          required
                          value={formData.age}
                          onChange={(e) => setFormData({...formData, age: e.target.value})}
                          className="w-full p-3 border-2 border-black focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
                        >
                          <option value="">Select age</option>
                          {Array.from({length: 13}, (_, i) => i + 12).map(age => (
                            <option key={age} value={age}>{age}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-2">Location</label>
                        <select
                          required
                          value={formData.location}
                          onChange={(e) => setFormData({...formData, location: e.target.value})}
                          className="w-full p-3 border-2 border-black focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
                        >
                          <option value="">Select state</option>
                          <option value="NSW">NSW</option>
                          <option value="VIC">VIC</option>
                          <option value="QLD">QLD</option>
                          <option value="SA">SA</option>
                          <option value="WA">WA</option>
                          <option value="TAS">TAS</option>
                          <option value="NT">NT</option>
                          <option value="ACT">ACT</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-bold mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full pl-12 pr-4 py-3 border-2 border-black focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full pl-12 pr-12 py-3 border-2 border-black focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
                      placeholder="Create a strong password"
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {isLogin && (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm">Remember me</span>
                    </label>
                    <Link href="#" className="text-sm text-blue-800 hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-blue-800 hover:bg-blue-700 text-white py-4 font-bold text-lg transition-all transform hover:scale-105"
                >
                  {isLogin ? 'LOG IN' : 'START MY JOURNEY'}
                </button>

                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    {isLogin ? "Don't have an account? " : 'Already have an account? '}
                    <button
                      type="button"
                      onClick={() => setIsLogin(!isLogin)}
                      className="text-blue-800 hover:underline font-bold"
                    >
                      {isLogin ? 'Sign Up' : 'Log In'}
                    </button>
                  </p>
                </div>
              </form>

              {!isLogin && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-xs text-gray-600 text-center">
                    By signing up, you agree to our Terms of Service and Privacy Policy. 
                    We're committed to keeping your information safe and only using it to help you grow.
                  </p>
                </div>
              )}
            </div>

            {/* Demo Access */}
            <div className="mt-6 text-center">
              <div className="bg-green-100 border-2 border-green-600 p-4">
                <h3 className="font-bold text-green-800 mb-2">Demo Access</h3>
                <p className="text-sm text-green-700 mb-3">
                  Want to explore without signing up? Try our demo version.
                </p>
                <Link 
                  href="/youth-scout/dashboard"
                  className="inline-block bg-green-600 text-white px-6 py-2 font-bold hover:bg-green-700 transition-all"
                >
                  Enter Demo Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}