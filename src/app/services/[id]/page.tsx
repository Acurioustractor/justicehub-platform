'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  Clock,
  DollarSign,
  Users,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Bot
} from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';

interface ServiceDetail {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  location: string;
  contact: string;
  cost: string;
  rating: number;
  verified: boolean;
  lastUpdated: string;
  source?: string;
  aiDiscovered: boolean;
  eligibility?: string[];
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
  };
  confidenceScore?: number;
  extractionTimestamp?: string;
}

export default function ServiceDetailPage() {
  const params = useParams();
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      loadServiceDetail(params.id as string);
    }
  }, [params.id]);

  const loadServiceDetail = async (serviceId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Get specific service details
      const response = await fetch(`/api/scraped-services/${serviceId}`);
      const data = await response.json();

      if (response.ok) {
        setService(data.service);
      } else {
        setError(data.error || 'Service not found');
      }
    } catch (error) {
      console.error('Error loading service:', error);
      setError('Failed to load service details');
    } finally {
      setLoading(false);
    }
  };

  const getCostColor = (cost: string) => {
    switch (cost) {
      case 'free': return 'text-green-600 bg-green-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      case 'moderate': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'legal': 'bg-blue-100 text-blue-800',
      'emergency': 'bg-red-100 text-red-800',
      'health': 'bg-green-100 text-green-800',
      'education': 'bg-purple-100 text-purple-800',
      'family': 'bg-orange-100 text-orange-800',
      'housing': 'bg-indigo-100 text-indigo-800',
      'employment': 'bg-yellow-100 text-yellow-800',
      'substance': 'bg-pink-100 text-pink-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <main className="header-offset">
          <div className="container-justice py-16">
            <div className="text-center">
              <div className="text-xl text-gray-600 mb-4">🤖 Loading AI-discovered service...</div>
              <div className="text-sm text-gray-500">Fetching detailed information</div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <main className="header-offset">
          <div className="container-justice py-16">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-4">Service Not Found</h1>
              <p className="text-gray-600 mb-8">{error || 'The service you\'re looking for doesn\'t exist.'}</p>
              <Link
                href="/services"
                className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-all"
              >
                <ArrowLeft className="h-5 w-5" />
                Back to Services
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="header-offset">
        {/* Back Navigation */}
        <section className="border-b-2 border-black py-4">
          <div className="container-justice">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 text-black hover:underline font-medium"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Service Finder
            </Link>
          </div>
        </section>

        {/* Service Header */}
        <section className="section-padding border-b-2 border-black bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="container-justice">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  {service.aiDiscovered && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      <Bot className="h-4 w-4 mr-1" />
                      AI-Discovered
                    </span>
                  )}
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(service.category)}`}>
                    {service.category.charAt(0).toUpperCase() + service.category.slice(1)}
                  </span>
                  {service.verified && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Verified
                    </span>
                  )}
                </div>

                <h1 className="headline-truth mb-4">{service.name}</h1>

                <p className="text-xl text-gray-700 leading-relaxed mb-6">
                  {service.description}
                </p>

                <div className="flex items-center gap-6 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-current text-yellow-400" />
                    <span className="font-bold text-lg">{service.rating}</span>
                    <span className="text-gray-600">rating</span>
                  </div>

                  <div className={`px-4 py-2 rounded-full font-bold ${getCostColor(service.cost)}`}>
                    {service.cost.charAt(0).toUpperCase() + service.cost.slice(1)} Cost
                  </div>

                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>Updated {service.lastUpdated}</span>
                  </div>
                </div>
              </div>

              {service.source && service.aiDiscovered && (
                <div className="lg:w-80 bg-white border-2 border-black p-6">
                  <h3 className="font-bold mb-3 text-black">🤖 AI Discovery Info</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="font-medium text-gray-700">Data Source:</div>
                      <a
                        href={service.source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        Government Website <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    {service.confidenceScore && (
                      <div>
                        <div className="font-medium text-gray-700">AI Confidence:</div>
                        <div className="text-green-600 font-bold">
                          {Math.round(service.confidenceScore * 100)}%
                        </div>
                      </div>
                    )}
                    {service.extractionTimestamp && (
                      <div>
                        <div className="font-medium text-gray-700">Discovered:</div>
                        <div>{new Date(service.extractionTimestamp).toLocaleDateString()}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Service Details */}
        <section className="section-padding">
          <div className="container-justice">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Contact Information */}
              <div className="border-2 border-black p-6 bg-white">
                <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-gray-500" />
                    <div>
                      <div className="font-medium">Location</div>
                      <div className="text-gray-700">{service.location}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-500" />
                    <div>
                      <div className="font-medium">Contact</div>
                      <div className="text-gray-700">{service.contact}</div>
                    </div>
                  </div>

                  {service.contactInfo?.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-gray-500" />
                      <div>
                        <div className="font-medium">Website</div>
                        <a
                          href={service.contactInfo.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Visit Website
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Eligibility */}
              {service.eligibility && service.eligibility.length > 0 && (
                <div className="border-2 border-black p-6 bg-white">
                  <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Eligibility Criteria
                  </h3>

                  <ul className="space-y-2">
                    {service.eligibility.map((criteria, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                        <span className="text-gray-700">{criteria}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Additional Info */}
              <div className="border-2 border-black p-6 bg-white">
                <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Service Details
                </h3>

                <div className="space-y-4">
                  <div>
                    <div className="font-medium text-gray-700">Cost Structure</div>
                    <div className={`inline-block px-3 py-1 rounded font-bold ${getCostColor(service.cost)}`}>
                      {service.cost.charAt(0).toUpperCase() + service.cost.slice(1)}
                    </div>
                  </div>

                  {service.subcategory && (
                    <div>
                      <div className="font-medium text-gray-700">Service Type</div>
                      <div className="text-gray-900">{service.subcategory.replace('_', ' ')}</div>
                    </div>
                  )}

                  <div>
                    <div className="font-medium text-gray-700">Last Updated</div>
                    <div className="text-gray-900">{service.lastUpdated}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-12 text-center border-t-2 border-black pt-8">
              <h3 className="text-2xl font-bold mb-6">Ready to Get Help?</h3>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href={`tel:${service.contact.replace(/\D/g, '')}`}
                  className="px-8 py-4 bg-black text-white font-bold hover:bg-gray-800 transition-all inline-flex items-center gap-2"
                >
                  <Phone className="h-5 w-5" />
                  Call Now
                </a>

                {service.source && (
                  <a
                    href={service.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-8 py-4 border-2 border-black font-bold hover:bg-black hover:text-white transition-all inline-flex items-center gap-2"
                  >
                    <ExternalLink className="h-5 w-5" />
                    Visit Source
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}