/**
 * Storyteller Registration Form
 * 
 * Allows new storytellers to register and create their profile in the Empathy Ledger.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, User, MapPin, Calendar, FileText } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  organization_id: string;
}

interface RegistrationFormProps {
  onSuccess?: (storyteller: any) => void;
  onError?: (error: string) => void;
}

export function StorytellerRegistrationForm({ onSuccess, onError }: RegistrationFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: '',
    location: '',
    bio: '',
    organizationId: '',
    projectId: '',
    privacySettings: {
      show_name: true,
      show_location: false,
      show_age: false,
      allow_contact: false
    },
    consentGranted: false
  });

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    if (formData.organizationId) {
      fetchProjects(formData.organizationId);
    } else {
      setProjects([]);
      setFormData(prev => ({ ...prev, projectId: '' }));
    }
  }, [formData.organizationId]);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/storytellers');
      const data = await response.json();
      
      if (data.success) {
        setOrganizations(data.organizations || []);
      }
    } catch (err) {
      console.error('Error fetching organizations:', err);
    }
  };

  const fetchProjects = async (organizationId: string) => {
    try {
      const response = await fetch(`/api/projects?organizationId=${organizationId}`);
      const data = await response.json();
      
      if (data.success) {
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePrivacyChange = (field: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      privacySettings: {
        ...prev.privacySettings,
        [field]: value
      }
    }));
  };

  const validateStep = (stepNumber: number): boolean => {
    switch (stepNumber) {
      case 1:
        return !!(formData.name && formData.organizationId && formData.projectId);
      case 2:
        return true; // Optional fields
      case 3:
        return formData.consentGranted;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
      setError(null);
    } else {
      setError('Please fill in all required fields');
    }
  };

  const handleBack = () => {
    setStep(step - 1);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(3)) {
      setError('Please grant consent to continue');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/storytellers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email || undefined,
          age: formData.age ? parseInt(formData.age) : undefined,
          location: formData.location || undefined,
          bio: formData.bio || undefined,
          organizationId: formData.organizationId,
          projectId: formData.projectId,
          privacySettings: formData.privacySettings,
          consentGranted: formData.consentGranted
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      if (onSuccess) {
        onSuccess(data.storyteller);
      }

    } catch (err: any) {
      const errorMessage = err.message || 'Registration failed';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedOrganization = organizations.find(org => org.id === formData.organizationId);
  const selectedProject = projects.find(proj => proj.id === formData.projectId);

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Join as a Storyteller
          </CardTitle>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span className={`px-2 py-1 rounded ${step >= 1 ? 'bg-primary-100 text-primary-800' : 'bg-gray-100'}`}>
              1. Basic Info
            </span>
            <span className={`px-2 py-1 rounded ${step >= 2 ? 'bg-primary-100 text-primary-800' : 'bg-gray-100'}`}>
              2. Profile
            </span>
            <span className={`px-2 py-1 rounded ${step >= 3 ? 'bg-primary-100 text-primary-800' : 'bg-gray-100'}`}>
              3. Consent
            </span>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Step 1: Basic Information */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Your name or preferred name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization *
                  </label>
                  <select
                    value={formData.organizationId}
                    onChange={(e) => handleInputChange('organizationId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="">Select an organization</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                  {selectedOrganization?.description && (
                    <p className="text-sm text-gray-600 mt-1">{selectedOrganization.description}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project *
                  </label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => handleInputChange('projectId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                    disabled={!formData.organizationId}
                  >
                    <option value="">Select a project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  {selectedProject?.description && (
                    <p className="text-sm text-gray-600 mt-1">{selectedProject.description}</p>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={!validateStep(1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Profile Details */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">Profile Details</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email (optional)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age (optional)
                  </label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Your age"
                    min="13"
                    max="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="City, State/Country"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio (optional)
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    placeholder="Tell us a bit about yourself..."
                  />
                </div>

                <div>
                  <h4 className="text-md font-medium mb-3">Privacy Settings</h4>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.privacySettings.show_name}
                        onChange={(e) => handlePrivacyChange('show_name', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm">Show my name on stories</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.privacySettings.show_location}
                        onChange={(e) => handlePrivacyChange('show_location', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm">Show my location on stories</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.privacySettings.show_age}
                        onChange={(e) => handlePrivacyChange('show_age', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm">Show my age on stories</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.privacySettings.allow_contact}
                        onChange={(e) => handlePrivacyChange('allow_contact', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm">Allow others to contact me</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNext}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Consent */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">Consent & Agreement</h3>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Storytelling Consent</h4>
                  <p className="text-sm text-gray-700 mb-4">
                    By joining as a storyteller, you agree to share your experiences through the Empathy Ledger platform. 
                    Your stories will help create understanding and drive positive change in youth justice and community support.
                  </p>
                  
                  <div className="space-y-2 text-sm text-gray-700">
                    <p>• You retain ownership of your stories</p>
                    <p>• You can control who sees your stories through privacy settings</p>
                    <p>• You can edit or remove your stories at any time</p>
                    <p>• Your personal information is protected according to our privacy policy</p>
                    <p>• Your stories may be used for research and advocacy (anonymized)</p>
                  </div>
                </div>

                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.consentGranted}
                    onChange={(e) => handleInputChange('consentGranted', e.target.checked)}
                    className="mt-1"
                    required
                  />
                  <span className="text-sm">
                    I understand and agree to the terms above. I consent to sharing my stories through the Empathy Ledger platform 
                    and understand that I can withdraw this consent at any time.
                  </span>
                </label>

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !formData.consentGranted}
                    className="flex items-center"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating Profile...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Create Storyteller Profile
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}