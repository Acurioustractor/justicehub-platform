'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserContext } from '@/contexts/UserContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  ArrowRight,
  Plus,
  X,
  Save,
  Eye,
  Send,
  AlertCircle,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  FileText,
  Building
} from 'lucide-react';
import { format } from 'date-fns';

const OPPORTUNITY_TYPES = [
  { value: 'job', label: 'Job' },
  { value: 'internship', label: 'Internship' },
  { value: 'apprenticeship', label: 'Apprenticeship' },
  { value: 'volunteer', label: 'Volunteer' },
  { value: 'education', label: 'Education' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'mentorship', label: 'Mentorship' },
  { value: 'scholarship', label: 'Scholarship' },
  { value: 'program', label: 'Program' },
];

export default function CreateOpportunityPage() {
  const router = useRouter();
  const { user, isLoading: userLoading } = useUserContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Form data
  const [formData, setFormData] = useState({
    // Basic Info
    title: '',
    type: '',
    shortDescription: '',
    description: '',
    
    // Location
    locationType: 'remote',
    city: '',
    state: '',
    address: '',
    
    // Duration
    durationType: 'fixed',
    duration: '',
    durationUnit: 'months',
    hoursPerWeek: '',
    schedule: 'full-time',
    startDate: '',
    endDate: '',
    
    // Application
    applicationDeadline: '',
    applicationUrl: '',
    applicationEmail: '',
    applicationInstructions: '',
    
    // Compensation
    compensationType: 'unpaid',
    compensationAmount: '',
    compensationCurrency: 'USD',
    compensationFrequency: 'hourly',
    
    // Requirements
    requirements: [''],
    qualifications: [''],
    responsibilities: [''],
    benefits: [''],
    skills: [''],
    tags: [''],
    
    // Eligibility
    minAge: '',
    maxAge: '',
    eligibilityCriteria: [''],
    
    // Capacity
    spots: '1',
    
    // Contact
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    
    // Status
    status: 'draft',
  });

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || user.role !== 'organization_staff') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Organization Access Only</CardTitle>
            <CardDescription>Only organization staff can create opportunities.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/opportunities')}>
              Browse Opportunities
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateArrayField = (field: string, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field as keyof typeof prev].map((item: any, i: number) => 
        i === index ? value : item
      ),
    }));
  };

  const addArrayField = (field: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field as keyof typeof prev], ''],
    }));
  };

  const removeArrayField = (field: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field as keyof typeof prev].filter((_: any, i: number) => i !== index),
    }));
  };

  const handleSubmit = async (status: 'draft' | 'active') => {
    setIsSubmitting(true);
    
    try {
      const dataToSubmit = {
        ...formData,
        status,
        // Filter out empty array items
        requirements: formData.requirements.filter(r => r.trim()),
        qualifications: formData.qualifications.filter(q => q.trim()),
        responsibilities: formData.responsibilities.filter(r => r.trim()),
        benefits: formData.benefits.filter(b => b.trim()),
        skills: formData.skills.filter(s => s.trim()),
        tags: formData.tags.filter(t => t.trim()),
        eligibilityCriteria: formData.eligibilityCriteria.filter(e => e.trim()),
        // Build location object
        location: {
          type: formData.locationType,
          city: formData.city || null,
          state: formData.state || null,
          address: formData.address || null,
        },
        // Build duration object
        duration: formData.durationType !== 'ongoing' ? {
          type: formData.durationType,
          length: formData.duration ? parseInt(formData.duration) : null,
          unit: formData.durationUnit,
          hoursPerWeek: formData.hoursPerWeek ? parseInt(formData.hoursPerWeek) : null,
          schedule: formData.schedule,
        } : null,
        // Build compensation object
        compensation: {
          type: formData.compensationType,
          amount: formData.compensationAmount ? parseFloat(formData.compensationAmount) : null,
          currency: formData.compensationCurrency,
          frequency: formData.compensationFrequency,
        },
        // Convert numeric fields
        spots: parseInt(formData.spots),
        minAge: formData.minAge ? parseInt(formData.minAge) : null,
        maxAge: formData.maxAge ? parseInt(formData.maxAge) : null,
      };

      const response = await fetch('/api/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSubmit),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create opportunity');
      }

      const data = await response.json();
      
      if (status === 'active') {
        alert('Opportunity published successfully!');
      } else {
        alert('Opportunity saved as draft!');
      }
      
      router.push(`/opportunities/${data.opportunity.slug}`);
    } catch (error: any) {
      alert(error.message || 'Failed to create opportunity');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return formData.title && formData.type && formData.shortDescription && formData.description;
      case 2:
        return formData.locationType === 'remote' || (formData.city && formData.state);
      case 3:
        return true; // Optional step
      case 4:
        return formData.requirements.some(r => r.trim());
      case 5:
        return true; // Optional step
      default:
        return true;
    }
  };

  const totalSteps = 5;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">Create New Opportunity</h1>
          <p className="text-gray-600">
            Post an opportunity for youth in your community
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[...Array(totalSteps)].map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-2 mx-1 rounded-full ${
                  i + 1 <= currentStep ? 'bg-primary' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-600 text-center">
            Step {currentStep} of {totalSteps}
          </p>
        </div>

        {/* Form Steps */}
        <Card>
          <CardContent className="p-8">
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
                
                <div>
                  <Label htmlFor="title">Opportunity Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    placeholder="e.g., Summer Web Development Internship"
                  />
                </div>

                <div>
                  <Label htmlFor="type">Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => updateField('type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select opportunity type" />
                    </SelectTrigger>
                    <SelectContent>
                      {OPPORTUNITY_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="shortDescription">Short Description *</Label>
                  <Textarea
                    id="shortDescription"
                    value={formData.shortDescription}
                    onChange={(e) => updateField('shortDescription', e.target.value)}
                    placeholder="Brief overview of the opportunity (1-2 sentences)"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Full Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="Detailed description of the opportunity"
                    rows={8}
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">Location & Schedule</h2>
                
                <div>
                  <Label>Location Type *</Label>
                  <RadioGroup
                    value={formData.locationType}
                    onValueChange={(value) => updateField('locationType', value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="remote" id="remote" />
                      <label htmlFor="remote">Remote</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="onsite" id="onsite" />
                      <label htmlFor="onsite">On-site</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="hybrid" id="hybrid" />
                      <label htmlFor="hybrid">Hybrid</label>
                    </div>
                  </RadioGroup>
                </div>

                {formData.locationType !== 'remote' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => updateField('city', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State *</Label>
                        <Input
                          id="state"
                          value={formData.state}
                          onChange={(e) => updateField('state', e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="address">Address (Optional)</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => updateField('address', e.target.value)}
                      />
                    </div>
                  </>
                )}

                <div>
                  <Label>Duration Type</Label>
                  <Select 
                    value={formData.durationType} 
                    onValueChange={(value) => updateField('durationType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed Duration</SelectItem>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.durationType === 'fixed' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="duration">Duration</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={formData.duration}
                        onChange={(e) => updateField('duration', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Unit</Label>
                      <Select 
                        value={formData.durationUnit} 
                        onValueChange={(value) => updateField('durationUnit', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weeks">Weeks</SelectItem>
                          <SelectItem value="months">Months</SelectItem>
                          <SelectItem value="years">Years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => updateField('startDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => updateField('endDate', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">Application & Compensation</h2>
                
                <div>
                  <Label htmlFor="applicationDeadline">Application Deadline</Label>
                  <Input
                    id="applicationDeadline"
                    type="date"
                    value={formData.applicationDeadline}
                    onChange={(e) => updateField('applicationDeadline', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="applicationUrl">External Application URL</Label>
                  <Input
                    id="applicationUrl"
                    type="url"
                    value={formData.applicationUrl}
                    onChange={(e) => updateField('applicationUrl', e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <Label htmlFor="applicationEmail">Application Email</Label>
                  <Input
                    id="applicationEmail"
                    type="email"
                    value={formData.applicationEmail}
                    onChange={(e) => updateField('applicationEmail', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="applicationInstructions">Application Instructions</Label>
                  <Textarea
                    id="applicationInstructions"
                    value={formData.applicationInstructions}
                    onChange={(e) => updateField('applicationInstructions', e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Compensation Type</Label>
                  <RadioGroup
                    value={formData.compensationType}
                    onValueChange={(value) => updateField('compensationType', value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="unpaid" id="unpaid" />
                      <label htmlFor="unpaid">Unpaid</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="paid" id="paid" />
                      <label htmlFor="paid">Paid</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="stipend" id="stipend" />
                      <label htmlFor="stipend">Stipend</label>
                    </div>
                  </RadioGroup>
                </div>

                {formData.compensationType !== 'unpaid' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="compensationAmount">Amount</Label>
                      <Input
                        id="compensationAmount"
                        type="number"
                        value={formData.compensationAmount}
                        onChange={(e) => updateField('compensationAmount', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Frequency</Label>
                      <Select 
                        value={formData.compensationFrequency} 
                        onValueChange={(value) => updateField('compensationFrequency', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="one-time">One-time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="spots">Number of Spots Available</Label>
                  <Input
                    id="spots"
                    type="number"
                    min="1"
                    value={formData.spots}
                    onChange={(e) => updateField('spots', e.target.value)}
                  />
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">Requirements & Qualifications</h2>
                
                <div>
                  <Label>Requirements *</Label>
                  <p className="text-sm text-gray-600 mb-2">What are the must-have requirements?</p>
                  {formData.requirements.map((req, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Input
                        value={req}
                        onChange={(e) => updateArrayField('requirements', index, e.target.value)}
                        placeholder="e.g., Must be 18+ years old"
                      />
                      {formData.requirements.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeArrayField('requirements', index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayField('requirements')}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Requirement
                  </Button>
                </div>

                <div>
                  <Label>Preferred Qualifications</Label>
                  {formData.qualifications.map((qual, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Input
                        value={qual}
                        onChange={(e) => updateArrayField('qualifications', index, e.target.value)}
                        placeholder="e.g., Experience with React"
                      />
                      {formData.qualifications.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeArrayField('qualifications', index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayField('qualifications')}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Qualification
                  </Button>
                </div>

                <div>
                  <Label>Skills Required</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.skills.filter(s => s.trim()).map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeArrayField('skills', index)}
                          className="ml-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a skill"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const target = e.target as HTMLInputElement;
                          if (target.value.trim()) {
                            const lastIndex = formData.skills.length - 1;
                            updateArrayField('skills', lastIndex, target.value);
                            addArrayField('skills');
                            target.value = '';
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minAge">Minimum Age</Label>
                    <Input
                      id="minAge"
                      type="number"
                      min="13"
                      value={formData.minAge}
                      onChange={(e) => updateField('minAge', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxAge">Maximum Age</Label>
                    <Input
                      id="maxAge"
                      type="number"
                      max="30"
                      value={formData.maxAge}
                      onChange={(e) => updateField('maxAge', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">Contact & Review</h2>
                
                <div>
                  <Label htmlFor="contactName">Contact Person Name</Label>
                  <Input
                    id="contactName"
                    value={formData.contactName}
                    onChange={(e) => updateField('contactName', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => updateField('contactEmail', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => updateField('contactPhone', e.target.value)}
                  />
                </div>

                <Card className="bg-gray-50 dark:bg-gray-800">
                  <CardHeader>
                    <CardTitle className="text-lg">Review Your Opportunity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Title:</span> {formData.title}
                    </div>
                    <div>
                      <span className="font-medium">Type:</span> {formData.type}
                    </div>
                    <div>
                      <span className="font-medium">Location:</span>{' '}
                      {formData.locationType === 'remote' ? 'Remote' : `${formData.city}, ${formData.state}`}
                    </div>
                    <div>
                      <span className="font-medium">Compensation:</span>{' '}
                      {formData.compensationType === 'unpaid' ? 'Unpaid' : 
                       formData.compensationAmount ? `$${formData.compensationAmount} ${formData.compensationFrequency}` : 
                       formData.compensationType}
                    </div>
                    <div>
                      <span className="font-medium">Spots:</span> {formData.spots}
                    </div>
                    {formData.applicationDeadline && (
                      <div>
                        <span className="font-medium">Application Deadline:</span>{' '}
                        {format(new Date(formData.applicationDeadline), 'MMMM d, yyyy')}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              {currentStep < totalSteps ? (
                <Button
                  type="button"
                  onClick={() => setCurrentStep(prev => Math.min(totalSteps, prev + 1))}
                  disabled={!isStepValid(currentStep)}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSubmit('draft')}
                    disabled={isSubmitting}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save as Draft
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleSubmit('active')}
                    disabled={isSubmitting || !isStepValid(4)}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Publish Opportunity
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}