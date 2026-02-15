'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Award,
  ExternalLink,
  Download,
  MapPin,
  ChevronRight,
  BookOpen,
  AlertCircle,
  Shield
} from 'lucide-react';

interface Outcome {
  metric: string;
  value: string;
  context: string;
}

interface Resource {
  title: string;
  type: 'research' | 'policy' | 'report';
  url: string;
  description: string;
}

interface BestPracticeModel {
  id: string;
  name: string;
  state: string;
  tagline: string;
  overview: string;
  keyFeatures: string[];
  outcomes: Outcome[];
  strengths: string[];
  challenges: string[];
  resources: Resource[];
  color: string;
}

interface AustralianFrameworksListProps {
  frameworks: BestPracticeModel[];
}

export default function AustralianFrameworksList({ frameworks }: AustralianFrameworksListProps) {
  const [expandedModel, setExpandedModel] = useState<string | null>(null);

  const toggleModel = (modelId: string) => {
    setExpandedModel(expandedModel === modelId ? null : modelId);
  };

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'border-blue-600 bg-blue-50',
      purple: 'border-purple-600 bg-purple-50',
      yellow: 'border-yellow-600 bg-yellow-50',
      red: 'border-red-600 bg-red-50'
    };
    return colors[color as keyof typeof colors] || 'border-gray-600 bg-gray-50';
  };

  return (
    <div className="space-y-8">
      {frameworks.map((model) => (
        <div
          key={model.id}
          className="border-2 border-black bg-white hover:shadow-brutal transition-all"
        >
          {/* Model Header */}
          <div className={`p-6 border-b-2 border-black ${getColorClasses(model.color)}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="h-6 w-6" />
                  <span className="text-sm font-bold text-gray-600 uppercase tracking-wider">
                    {model.state}
                  </span>
                </div>
                <h2 className="text-3xl font-bold mb-2">{model.name}</h2>
                <p className="text-lg text-gray-700 italic">&quot;{model.tagline}&quot;</p>
              </div>
              <button
                onClick={() => toggleModel(model.id)}
                className="px-6 py-3 border-2 border-black font-bold hover:bg-black hover:text-white transition-all flex items-center gap-2"
              >
                {expandedModel === model.id ? 'Show Less' : 'Learn More'}
                <ChevronRight
                  className={`h-5 w-5 transition-transform ${
                    expandedModel === model.id ? 'rotate-90' : ''
                  }`}
                />
              </button>
            </div>

            <p className="text-gray-700 leading-relaxed">{model.overview}</p>
          </div>

          {/* Key Outcomes */}
          <div className="p-6 bg-white border-b-2 border-black">
            <h3 className="text-xl font-bold mb-4">Key Outcomes</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {model.outcomes.map((outcome, idx) => (
                <div key={idx} className="border-2 border-black p-4 bg-gray-50">
                  <div className="text-2xl font-bold mb-1 text-blue-600">{outcome.value}</div>
                  <div className="font-bold text-sm mb-1">{outcome.metric}</div>
                  <div className="text-xs text-gray-600">{outcome.context}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Expanded Content */}
          {expandedModel === model.id && (
            <>
              {/* Key Features */}
              <div className="p-6 bg-white border-b-2 border-black">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Award className="h-6 w-6" />
                  Key Features
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {model.keyFeatures.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <ChevronRight className="h-5 w-5 flex-shrink-0 mt-0.5 text-blue-600" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths & Challenges */}
              <div className="p-6 bg-white border-b-2 border-black">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-700">
                      <Shield className="h-6 w-6" />
                      Strengths
                    </h3>
                    <ul className="space-y-2">
                      {model.strengths.map((strength, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-green-600 font-bold text-lg">✓</span>
                          <span className="text-gray-700 text-sm">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-orange-700">
                      <AlertCircle className="h-6 w-6" />
                      Challenges
                    </h3>
                    <ul className="space-y-2">
                      {model.challenges.map((challenge, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-orange-600 font-bold text-lg">⚠</span>
                          <span className="text-gray-700 text-sm">{challenge}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Resources */}
              <div className="p-6 bg-white">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <BookOpen className="h-6 w-6" />
                  Research & Resources
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {model.resources.map((resource, idx) => (
                    <a
                      key={idx}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border-2 border-black p-4 hover:shadow-brutal transition-all bg-gray-50 hover:bg-white group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {resource.type === 'research' && <BookOpen className="h-4 w-4" />}
                          {resource.type === 'report' && <Download className="h-4 w-4" />}
                          {resource.type === 'policy' && <ExternalLink className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold mb-1 group-hover:underline">
                            {resource.title}
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            {resource.description}
                          </div>
                          <div className="flex items-center gap-2 text-xs font-bold text-blue-600">
                            <span className="uppercase">{resource.type}</span>
                            <ExternalLink className="h-3 w-3" />
                          </div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
