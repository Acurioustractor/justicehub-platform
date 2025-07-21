'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Building2, Mail, Lock, Eye, EyeOff, Users } from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';

export default function TalentScoutLoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    organizationName: '',
    contactName: '',
    role: '',
    organizationType: '',
    location: '',
    website: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In real app, would handle authentication here
    // For now, redirect to talent dashboard
    window.location.href = '/youth-scout/talent-dashboard';
  };

  const organizationTypes = [
    'Community Program',
    'Non-profit Organization',
    'Government Agency',
    'Educational Institution',
    'Corporate Social Responsibility',
    'Social Enterprise',
    'Youth Service Provider',
    'Training Provider',
    'Other'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-yellow-50 to-blue-50">
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

          <div className="max-w-lg mx-auto">
            <div className="bg-white border-4 border-orange-600 p-8 shadow-xl">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-orange-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-8 w-8" />
                </div>
                <h1 className="text-2xl font-black text-orange-600 mb-2">
                  {isLogin ? 'WELCOME BACK!' : 'JOIN AS TALENT SCOUT'}
                </h1>
                <p className="text-gray-600">
                  {isLogin 
                    ? 'Continue making impact in young lives' 
                    : 'Connect with emerging talent and make real difference'
                  }
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {!isLogin && (
                  <>
                    <div>
                      <label className="block text-sm font-bold mb-2">Organization Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.organizationName}
                        onChange={(e) => setFormData({...formData, organizationName: e.target.value})}
                        className="w-full p-3 border-2 border-black focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
                        placeholder="e.g., BackTrack Youth Works"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold mb-2">Your Name *</label>
                        <input
                          type="text"
                          required
                          value={formData.contactName}
                          onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                          className="w-full p-3 border-2 border-black focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
                          placeholder="Full name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-2">Your Role *</label>
                        <input
                          type="text"
                          required
                          value={formData.role}
                          onChange={(e) => setFormData({...formData, role: e.target.value})}
                          className="w-full p-3 border-2 border-black focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
                          placeholder="e.g., Program Manager"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold mb-2">Organization Type *</label>
                      <select
                        required
                        value={formData.organizationType}
                        onChange={(e) => setFormData({...formData, organizationType: e.target.value})}
                        className="w-full p-3 border-2 border-black focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
                      >
                        <option value="">Select organization type</option>
                        {organizationTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold mb-2">Location *</label>
                        <select
                          required
                          value={formData.location}
                          onChange={(e) => setFormData({...formData, location: e.target.value})}
                          className="w-full p-3 border-2 border-black focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
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
                          <option value="National">National</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-2">Website</label>
                        <input
                          type="url"
                          value={formData.website}
                          onChange={(e) => setFormData({...formData, website: e.target.value})}
                          className="w-full p-3 border-2 border-black focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
                          placeholder="https://yourorg.org.au"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-bold mb-2">Work Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full pl-12 pr-4 py-3 border-2 border-black focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
                      placeholder="your.name@organization.org"
                    />
                  </div>
                  {!isLogin && (
                    <p className="text-xs text-gray-600 mt-1">
                      Please use your work email for verification
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full pl-12 pr-12 py-3 border-2 border-black focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
                      placeholder="Create a secure password"
                      minLength={8}
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
                    <Link href="#" className="text-sm text-orange-600 hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 font-bold text-lg transition-all transform hover:scale-105"
                >
                  {isLogin ? 'ACCESS DASHBOARD' : 'JOIN TALENT SCOUT NETWORK'}
                </button>

                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    {isLogin ? "Don't have an account? " : 'Already registered? '}
                    <button
                      type="button"
                      onClick={() => setIsLogin(!isLogin)}
                      className="text-orange-600 hover:underline font-bold"
                    >
                      {isLogin ? 'Register Organization' : 'Log In'}
                    </button>
                  </p>
                </div>
              </form>

              {!isLogin && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="bg-orange-50 border border-orange-200 p-4 mb-4">
                    <h4 className="font-bold text-orange-800 mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Verification Process
                    </h4>
                    <p className="text-sm text-orange-700">
                      All organizations go through our verification process to ensure the safety and quality of connections. 
                      You'll receive an email within 1-2 business days with next steps.
                    </p>
                  </div>
                  
                  <p className="text-xs text-gray-600 text-center">
                    By registering, you agree to our Terms of Service and Privacy Policy. 
                    We're committed to connecting genuine organizations with talented youth.
                  </p>
                </div>
              )}
            </div>

            {/* Demo Access */}
            <div className="mt-6 text-center">
              <div className="bg-green-100 border-2 border-green-600 p-4">
                <h3 className="font-bold text-green-800 mb-2">Demo Access</h3>
                <p className="text-sm text-green-700 mb-3">
                  Explore the Talent Scout dashboard without registration.
                </p>
                <Link 
                  href="/youth-scout/talent-dashboard"
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