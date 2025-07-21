'use client';

import { useState } from 'react';
import { 
  Phone, 
  Mail, 
  MessageCircle, 
  Video, 
  Calendar, 
  Users, 
  Globe,
  MapPin,
  Clock,
  Send,
  Share2,
  BookOpen,
  Heart,
  Award,
  Target,
  AlertCircle,
  CheckCircle,
  UserPlus,
  Settings,
  Filter,
  Search,
  Star,
  MessageSquare,
  FileText,
  Download,
  Link as LinkIcon,
  ExternalLink
} from 'lucide-react';

// Core interfaces for contact and collaboration
export interface ContactInfo {
  id: string;
  name: string;
  role: string;
  organization: string;
  location: string;
  email: string;
  phone?: string;
  website?: string;
  expertise: string[];
  availability: 'available' | 'busy' | 'limited';
  response_time: string;
  languages: string[];
  time_zone: string;
  preferred_contact: 'email' | 'phone' | 'video' | 'message';
}

export interface CollaborationRequest {
  id: string;
  type: 'mentorship' | 'resource_sharing' | 'joint_program' | 'consultation' | 'training';
  title: string;
  description: string;
  requested_by: ContactInfo;
  requested_from?: ContactInfo;
  status: 'pending' | 'accepted' | 'declined' | 'in_progress' | 'completed';
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  created_date: string;
  deadline?: string;
  skills_needed: string[];
  resources_offered: string[];
  expected_commitment: string;
  location_preference: 'local' | 'remote' | 'hybrid' | 'travel_ok';
}

export interface ResourceShare {
  id: string;
  title: string;
  type: 'document' | 'template' | 'training' | 'funding' | 'equipment' | 'space' | 'expertise';
  description: string;
  shared_by: ContactInfo;
  availability: 'free' | 'cost' | 'trade' | 'collaboration';
  location: string;
  contact_method: 'direct' | 'platform' | 'referral';
  tags: string[];
  created_date: string;
  expiry_date?: string;
  usage_count: number;
  rating: number;
}

export interface CommunityForum {
  id: string;
  title: string;
  category: 'general' | 'implementation' | 'funding' | 'evaluation' | 'challenges' | 'success_stories';
  created_by: ContactInfo;
  created_date: string;
  replies_count: number;
  last_activity: string;
  is_pinned: boolean;
  is_solved: boolean;
  tags: string[];
}

// Contact card component
export function ContactCard({ 
  contact, 
  onContact,
  onCollaborate,
  showDetails = false 
}: { 
  contact: ContactInfo;
  onContact?: (contact: ContactInfo, method: string) => void;
  onCollaborate?: (contact: ContactInfo) => void;
  showDetails?: boolean;
}) {
  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'bg-green-100 text-green-800 border-green-300';
      case 'busy': return 'bg-red-100 text-red-800 border-red-300';
      case 'limited': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="data-card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-bold text-lg mb-1">{contact.name}</h3>
          <p className="text-gray-600 mb-1">{contact.role}</p>
          <p className="text-sm font-medium">{contact.organization}</p>
          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
            <MapPin className="h-3 w-3" />
            {contact.location}
          </p>
        </div>
        <div className="text-right">
          <span className={`px-2 py-1 text-xs font-bold border rounded ${getAvailabilityColor(contact.availability)}`}>
            {contact.availability.toUpperCase()}
          </span>
          <p className="text-xs text-gray-500 mt-1">
            <Clock className="h-3 w-3 inline mr-1" />
            {contact.response_time}
          </p>
        </div>
      </div>

      {/* Expertise tags */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-1">
          {contact.expertise.slice(0, 3).map((skill, index) => (
            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
              {skill}
            </span>
          ))}
          {contact.expertise.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
              +{contact.expertise.length - 3} more
            </span>
          )}
        </div>
      </div>

      {showDetails && (
        <div className="mb-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-bold mb-1">Languages</p>
              <p>{contact.languages.join(', ')}</p>
            </div>
            <div>
              <p className="font-bold mb-1">Time Zone</p>
              <p>{contact.time_zone}</p>
            </div>
          </div>
        </div>
      )}

      {/* Contact methods */}
      <div className="flex gap-2">
        <button 
          onClick={() => onContact?.(contact, 'email')}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-black hover:bg-black hover:text-white transition-all text-sm font-medium"
        >
          <Mail className="h-4 w-4" />
          Email
        </button>
        
        {contact.phone && (
          <button 
            onClick={() => onContact?.(contact, 'phone')}
            className="flex items-center justify-center gap-1 px-3 py-2 border border-black hover:bg-black hover:text-white transition-all text-sm font-medium"
          >
            <Phone className="h-4 w-4" />
          </button>
        )}
        
        {onCollaborate && (
          <button 
            onClick={() => onCollaborate(contact)}
            className="flex items-center justify-center gap-1 px-3 py-2 bg-black text-white hover:bg-gray-800 transition-all text-sm font-medium"
          >
            <UserPlus className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// Collaboration request form
export function CollaborationRequestForm({ 
  onSubmit,
  onCancel,
  targetContact 
}: { 
  onSubmit: (request: Partial<CollaborationRequest>) => void;
  onCancel: () => void;
  targetContact?: ContactInfo;
}) {
  const [formData, setFormData] = useState({
    type: 'mentorship' as CollaborationRequest['type'],
    title: '',
    description: '',
    urgency: 'medium' as CollaborationRequest['urgency'],
    skills_needed: [] as string[],
    resources_offered: [] as string[],
    expected_commitment: '',
    location_preference: 'remote' as CollaborationRequest['location_preference'],
    deadline: ''
  });

  const collaborationTypes = [
    { id: 'mentorship', label: 'Mentorship & Guidance', description: 'Get advice from experienced practitioners' },
    { id: 'resource_sharing', label: 'Resource Sharing', description: 'Share or access materials, tools, or knowledge' },
    { id: 'joint_program', label: 'Joint Program', description: 'Collaborate on program development or delivery' },
    { id: 'consultation', label: 'Consultation', description: 'Get expert input on specific challenges' },
    { id: 'training', label: 'Training Exchange', description: 'Share or receive training and capacity building' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold">Request Collaboration</h2>
          {targetContact && (
            <p className="text-gray-600">With {targetContact.name} from {targetContact.organization}</p>
          )}
        </div>

        <div className="p-6 space-y-6">
          {/* Collaboration type */}
          <div>
            <label className="font-bold mb-3 block">Type of Collaboration</label>
            <div className="space-y-2">
              {collaborationTypes.map((type) => (
                <label key={type.id} className="flex items-start gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value={type.id}
                    checked={formData.type === type.id}
                    onChange={(e) => setFormData({...formData, type: e.target.value as CollaborationRequest['type']})}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium">{type.label}</div>
                    <div className="text-sm text-gray-600">{type.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="font-bold mb-2 block">Request Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Brief, descriptive title for your collaboration request"
              className="w-full p-3 border-2 border-black"
            />
          </div>

          {/* Description */}
          <div>
            <label className="font-bold mb-2 block">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Describe what you're looking for, what you can offer, and what success looks like"
              rows={4}
              className="w-full p-3 border-2 border-black"
            />
          </div>

          {/* Urgency and commitment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold mb-2 block">Urgency</label>
              <select
                value={formData.urgency}
                onChange={(e) => setFormData({...formData, urgency: e.target.value as CollaborationRequest['urgency']})}
                className="w-full p-3 border-2 border-black"
              >
                <option value="low">Low - When convenient</option>
                <option value="medium">Medium - Within 2-4 weeks</option>
                <option value="high">High - Within 1 week</option>
                <option value="urgent">Urgent - ASAP</option>
              </select>
            </div>

            <div>
              <label className="font-bold mb-2 block">Expected Commitment</label>
              <input
                type="text"
                value={formData.expected_commitment}
                onChange={(e) => setFormData({...formData, expected_commitment: e.target.value})}
                placeholder="e.g., 2 hours/week for 1 month"
                className="w-full p-3 border-2 border-black"
              />
            </div>
          </div>

          {/* Location preference */}
          <div>
            <label className="font-bold mb-2 block">Location Preference</label>
            <div className="flex gap-2">
              {[
                { id: 'remote', label: 'Remote Only' },
                { id: 'local', label: 'Local Only' },
                { id: 'hybrid', label: 'Hybrid' },
                { id: 'travel_ok', label: 'Travel OK' }
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => setFormData({...formData, location_preference: option.id as CollaborationRequest['location_preference']})}
                  className={`px-4 py-2 font-medium transition-all ${
                    formData.location_preference === option.id
                      ? 'bg-black text-white'
                      : 'border border-black hover:bg-black hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="font-bold mb-2 block">Deadline (Optional)</label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({...formData, deadline: e.target.value})}
              className="w-full p-3 border-2 border-black"
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-4">
          <button
            onClick={() => onSubmit(formData)}
            className="cta-primary flex-1"
            disabled={!formData.title || !formData.description}
          >
            <Send className="mr-2 h-4 w-4" />
            Send Request
          </button>
          <button
            onClick={onCancel}
            className="cta-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// Resource sharing component
export function ResourceShareCard({ 
  resource,
  onContact,
  onShare 
}: { 
  resource: ResourceShare;
  onContact?: (resource: ResourceShare) => void;
  onShare?: (resource: ResourceShare) => void;
}) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document': return <FileText className="h-5 w-5" />;
      case 'template': return <BookOpen className="h-5 w-5" />;
      case 'training': return <Award className="h-5 w-5" />;
      case 'funding': return <Target className="h-5 w-5" />;
      case 'equipment': return <Settings className="h-5 w-5" />;
      case 'space': return <MapPin className="h-5 w-5" />;
      case 'expertise': return <Users className="h-5 w-5" />;
      default: return <Share2 className="h-5 w-5" />;
    }
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'free': return 'bg-green-100 text-green-800';
      case 'cost': return 'bg-blue-100 text-blue-800';
      case 'trade': return 'bg-yellow-100 text-yellow-800';
      case 'collaboration': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="data-card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {getTypeIcon(resource.type)}
          <div>
            <h3 className="font-bold text-lg">{resource.title}</h3>
            <p className="text-sm text-gray-600 capitalize">{resource.type.replace('_', ' ')}</p>
          </div>
        </div>
        <span className={`px-2 py-1 text-xs font-bold rounded ${getAvailabilityColor(resource.availability)}`}>
          {resource.availability.toUpperCase()}
        </span>
      </div>

      <p className="text-gray-700 mb-4">{resource.description}</p>

      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {resource.shared_by.name}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {resource.location}
          </span>
          <span className="flex items-center gap-1">
            <Star className="h-4 w-4" />
            {resource.rating.toFixed(1)}
          </span>
        </div>
        <span>{resource.usage_count} uses</span>
      </div>

      <div className="flex flex-wrap gap-1 mb-4">
        {resource.tags.map((tag, index) => (
          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
            {tag}
          </span>
        ))}
      </div>

      <div className="flex gap-2">
        <button 
          onClick={() => onContact?.(resource)}
          className="flex-1 cta-secondary text-sm"
        >
          <MessageCircle className="mr-1 h-4 w-4" />
          Contact
        </button>
        <button 
          onClick={() => onShare?.(resource)}
          className="cta-primary text-sm"
        >
          <Share2 className="mr-1 h-4 w-4" />
          Share
        </button>
      </div>
    </div>
  );
}

// Collaboration dashboard
export function CollaborationDashboard({ 
  contacts = [],
  resources = [],
  requests = [],
  onContactSelect,
  onNewRequest,
  onResourceShare
}: {
  contacts?: ContactInfo[];
  resources?: ResourceShare[];
  requests?: CollaborationRequest[];
  onContactSelect?: (contact: ContactInfo) => void;
  onNewRequest?: () => void;
  onResourceShare?: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'contacts' | 'resources' | 'requests'>('contacts');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterExpertise, setFilterExpertise] = useState('');

  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.expertise.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const tabs = [
    { id: 'contacts' as const, label: 'Find Collaborators', count: contacts.length },
    { id: 'resources' as const, label: 'Shared Resources', count: resources.length },
    { id: 'requests' as const, label: 'Your Requests', count: requests.length }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Community Collaboration Hub</h2>
        <div className="flex gap-2">
          <button onClick={onNewRequest} className="cta-primary">
            <UserPlus className="mr-2 h-4 w-4" />
            Request Collaboration
          </button>
          <button onClick={onResourceShare} className="cta-secondary">
            <Share2 className="mr-2 h-4 w-4" />
            Share Resource
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b-2 border-black">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-black text-white'
                : 'hover:bg-gray-100'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Search and filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search collaborators, resources, or skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-2 border-black"
          />
        </div>
        <button className="px-4 py-3 border-2 border-black hover:bg-black hover:text-white transition-all">
          <Filter className="h-4 w-4" />
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'contacts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onContact={(contact, method) => {
                console.log(`Contacting ${contact.name} via ${method}`);
              }}
              onCollaborate={onContactSelect}
            />
          ))}
        </div>
      )}

      {activeTab === 'resources' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource) => (
            <ResourceShareCard
              key={resource.id}
              resource={resource}
              onContact={(resource) => {
                console.log(`Contacting about resource: ${resource.title}`);
              }}
              onShare={(resource) => {
                console.log(`Sharing resource: ${resource.title}`);
              }}
            />
          ))}
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-bold mb-2">No collaboration requests yet</h3>
              <p className="text-gray-600 mb-6">Start collaborating with other programs and practitioners</p>
              <button onClick={onNewRequest} className="cta-primary">
                Create Your First Request
              </button>
            </div>
          ) : (
            requests.map((request) => (
              <div key={request.id} className="data-card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{request.title}</h3>
                    <p className="text-gray-600 capitalize">{request.type.replace('_', ' ')}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-bold rounded ${
                    request.status === 'completed' ? 'bg-green-100 text-green-800' :
                    request.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    request.status === 'accepted' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {request.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-700 mb-4">{request.description}</p>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Created: {new Date(request.created_date).toLocaleDateString()}</span>
                  {request.deadline && (
                    <span>Deadline: {new Date(request.deadline).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}