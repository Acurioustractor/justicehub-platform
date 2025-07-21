'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft,
  Download, 
  CheckCircle, 
  Users, 
  DollarSign, 
  Calendar,
  Target,
  AlertTriangle,
  FileText,
  Phone,
  Mail,
  Globe,
  Clock,
  Award,
  Zap,
  Book,
  Lightbulb,
  Settings,
  TrendingUp
} from 'lucide-react';

interface ReplicationStep {
  phase: string;
  duration: string;
  description: string;
  activities: string[];
  deliverables: string[];
  resources_needed: string[];
  success_criteria: string[];
  common_challenges: string[];
  tips: string[];
}

interface ProgramTemplate {
  id: string;
  name: string;
  type: string;
  success_rate: number;
  cost_range: string;
  complexity: 'low' | 'medium' | 'high';
  description: string;
  key_elements: string[];
  minimum_requirements: string[];
  implementation_time: string;
}

export default function ReplicationToolkitPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('mentorship');
  const [selectedPhase, setSelectedPhase] = useState<number>(0);

  const programTemplates: ProgramTemplate[] = [
    {
      id: 'mentorship',
      name: 'Community Mentorship Program',
      type: 'Mentorship & Support',
      success_rate: 75,
      cost_range: '$25,000 - $50,000',
      complexity: 'low',
      description: 'One-on-one mentoring with community volunteers for at-risk youth',
      key_elements: [
        'Volunteer mentor recruitment and training',
        'Youth referral and assessment process',
        'Structured mentoring activities',
        'Regular check-ins and support'
      ],
      minimum_requirements: [
        'Community coordination space',
        'Background check processes',
        'Insurance and liability coverage',
        '10+ volunteer mentors'
      ],
      implementation_time: '3-6 months'
    },
    {
      id: 'vocational',
      name: 'Vocational Training Program',
      type: 'Skills & Employment',
      success_rate: 85,
      cost_range: '$100,000 - $300,000',
      complexity: 'high',
      description: 'Hands-on skills training in trades and industry-relevant skills',
      key_elements: [
        'Workshop facilities and equipment',
        'Qualified trade instructors',
        'Industry partnerships',
        'Certification pathways'
      ],
      minimum_requirements: [
        'Workshop space (minimum 500m²)',
        'Safety equipment and insurance',
        'Trade-qualified instructors',
        'Industry partnerships for placement'
      ],
      implementation_time: '9-18 months'
    },
    {
      id: 'cultural',
      name: 'Cultural Healing Program',
      type: 'Cultural & Healing',
      success_rate: 90,
      cost_range: '$40,000 - $80,000',
      complexity: 'medium',
      description: 'Elder-led cultural programs combining traditional knowledge with support',
      key_elements: [
        'Elder and cultural leader involvement',
        'Traditional activities and ceremonies',
        'Intergenerational knowledge sharing',
        'Healing and wellness practices'
      ],
      minimum_requirements: [
        'Community elder participation',
        'Cultural protocols and permissions',
        'Appropriate meeting spaces',
        'Community support and buy-in'
      ],
      implementation_time: '6-12 months'
    }
  ];

  const replicationSteps: ReplicationStep[] = [
    {
      phase: 'Foundation & Planning',
      duration: '2-4 months',
      description: 'Establish the groundwork for your program including community assessment, stakeholder engagement, and initial planning.',
      activities: [
        'Conduct community needs assessment',
        'Engage key stakeholders and partners',
        'Secure initial funding commitments',
        'Form steering committee',
        'Develop implementation timeline',
        'Research and adapt program models'
      ],
      deliverables: [
        'Community needs assessment report',
        'Stakeholder mapping and engagement plan',
        'Program design document',
        'Initial budget and funding plan',
        'Risk assessment and mitigation strategies'
      ],
      resources_needed: [
        'Project coordinator (0.5 FTE)',
        'Community engagement budget ($5,000)',
        'Research and consultation costs ($3,000)',
        'Meeting and event costs ($2,000)'
      ],
      success_criteria: [
        'Stakeholder committee established',
        'Funding commitments secured',
        'Program model adapted to local context',
        'Community support demonstrated'
      ],
      common_challenges: [
        'Competing community priorities',
        'Skepticism from traditional services',
        'Difficulty accessing funding',
        'Lack of local expertise'
      ],
      tips: [
        'Start with trusted community champions',
        'Focus on shared goals, not methods',
        'Document everything for future reference',
        'Be prepared to adapt your approach'
      ]
    },
    {
      phase: 'Setup & Infrastructure',
      duration: '3-6 months',
      description: 'Establish the physical, legal, and operational infrastructure needed to deliver your program.',
      activities: [
        'Secure and setup program facilities',
        'Establish legal entity and insurance',
        'Recruit and hire core staff',
        'Develop policies and procedures',
        'Create referral and intake processes',
        'Setup data collection systems'
      ],
      deliverables: [
        'Operational facilities ready',
        'Legal structures and insurance in place',
        'Core staff hired and trained',
        'Policy and procedure manual',
        'Intake and referral processes',
        'Data collection and evaluation framework'
      ],
      resources_needed: [
        'Program director (1.0 FTE)',
        'Facility setup costs ($20,000-$100,000)',
        'Legal and insurance costs ($5,000)',
        'Staff recruitment and training ($15,000)',
        'IT and systems setup ($8,000)'
      ],
      success_criteria: [
        'Facilities operational and compliant',
        'All legal requirements met',
        'Core team in place and trained',
        'Systems tested and functional'
      ],
      common_challenges: [
        'Facility compliance requirements',
        'Insurance and liability concerns',
        'Difficulty recruiting skilled staff',
        'Complex regulatory requirements'
      ],
      tips: [
        'Start facility search early',
        'Engage with successful programs for guidance',
        'Invest in proper training from the start',
        'Build relationships with local authorities'
      ]
    },
    {
      phase: 'Pilot Implementation',
      duration: '6-12 months',
      description: 'Launch with a small cohort to test and refine your program before full implementation.',
      activities: [
        'Launch pilot with 8-12 participants',
        'Deliver core program activities',
        'Monitor outcomes and challenges',
        'Collect participant and stakeholder feedback',
        'Refine program delivery methods',
        'Document lessons learned'
      ],
      deliverables: [
        'Pilot program completed',
        'Outcome data and evaluation report',
        'Participant testimonials and feedback',
        'Refined program model',
        'Staff training updates',
        'Lessons learned documentation'
      ],
      resources_needed: [
        'Full program staff team',
        'Program delivery costs ($30,000-$150,000)',
        'Evaluation and monitoring costs ($8,000)',
        'Participant support costs ($10,000)',
        'Equipment and materials ($5,000-$25,000)'
      ],
      success_criteria: [
        '70%+ participant completion rate',
        'Positive participant feedback',
        'Key outcome improvements demonstrated',
        'Program model validated'
      ],
      common_challenges: [
        'Lower than expected participation',
        'Staff inexperience with target population',
        'Unforeseen operational issues',
        'Difficulty measuring short-term impact'
      ],
      tips: [
        'Set realistic expectations for first cohort',
        'Over-communicate with participants',
        'Document everything that works and doesn\'t',
        'Celebrate small wins along the way'
      ]
    },
    {
      phase: 'Scale & Sustainability',
      duration: '12+ months',
      description: 'Expand your program to serve more participants and establish long-term sustainability.',
      activities: [
        'Expand participant capacity',
        'Diversify funding sources',
        'Build community partnerships',
        'Develop staff expertise and capacity',
        'Create alumni and follow-up programs',
        'Share model with other communities'
      ],
      deliverables: [
        'Full-scale program operations',
        'Sustainable funding model',
        'Community partnership agreements',
        'Staff development and retention plan',
        'Alumni network and support system',
        'Replication toolkit for other communities'
      ],
      resources_needed: [
        'Expanded staff team',
        'Marketing and recruitment budget ($10,000)',
        'Partnership development costs ($5,000)',
        'Professional development budget ($8,000)',
        'Technology and system upgrades ($10,000)'
      ],
      success_criteria: [
        'Serving 50+ participants annually',
        'Multiple funding sources secured',
        'Strong community partnerships',
        'Measurable community impact'
      ],
      common_challenges: [
        'Maintaining quality during growth',
        'Funding dependency and sustainability',
        'Staff burnout and turnover',
        'Measuring long-term impact'
      ],
      tips: [
        'Grow slowly and maintain quality',
        'Invest heavily in staff development',
        'Build diverse funding portfolio',
        'Never stop learning and adapting'
      ]
    }
  ];

  const currentTemplate = programTemplates.find(t => t.id === selectedTemplate);
  const currentStep = replicationSteps[selectedPhase];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white z-50 border-b-2 border-black">
        <div className="container-justice py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="font-bold text-xl tracking-tight">
              JUSTICEHUB
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/grassroots" className="font-medium hover:underline">
                Grassroots
              </Link>
              <Link href="/services" className="font-medium hover:underline">
                Services
              </Link>
              <Link href="/gallery" className="font-medium hover:underline">
                Gallery
              </Link>
              <Link href="/dashboard/youth" className="cta-primary">
                START HERE
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Back Navigation */}
      <section className="pt-24 pb-4 border-b border-gray-300">
        <div className="container-justice">
          <Link href="/grassroots" className="inline-flex items-center gap-2 font-medium hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Back to Grassroots
          </Link>
        </div>
      </section>

      {/* Hero */}
      <section className="section-padding border-b-2 border-black">
        <div className="container-justice">
          <h1 className="headline-truth mb-6">
            Community Program<br />
            Replication Toolkit
          </h1>
          <p className="text-xl max-w-4xl mb-8">
            Everything you need to adapt, implement, and scale proven youth justice programs 
            in your community. No starting from scratch. No reinventing wheels.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl">
            <div className="text-center">
              <div className="font-mono text-3xl font-bold mb-2">150+</div>
              <p className="text-sm">Programs documented</p>
            </div>
            <div className="text-center">
              <div className="font-mono text-3xl font-bold mb-2">78%</div>
              <p className="text-sm">Average success rate</p>
            </div>
            <div className="text-center">
              <div className="font-mono text-3xl font-bold mb-2">95%</div>
              <p className="text-sm">Cost saving vs detention</p>
            </div>
            <div className="text-center">
              <div className="font-mono text-3xl font-bold mb-2">8</div>
              <p className="text-sm">States covered</p>
            </div>
          </div>
        </div>
      </section>

      {/* Program Templates */}
      <section className="section-padding border-b-2 border-black">
        <div className="container-justice">
          <h2 className="text-3xl font-bold mb-8">CHOOSE YOUR PROGRAM MODEL</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {programTemplates.map((template) => (
              <div 
                key={template.id}
                className={`data-card cursor-pointer transition-all ${
                  selectedTemplate === template.id ? 'border-black bg-black text-white' : 'hover:border-gray-400'
                }`}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="font-mono text-3xl font-bold mb-2">{template.success_rate}%</div>
                    <p className="text-sm">Success Rate</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-bold ${
                    template.complexity === 'low' ? 'bg-green-100 text-green-800' :
                    template.complexity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  } ${selectedTemplate === template.id ? 'bg-white text-black' : ''}`}>
                    {template.complexity.toUpperCase()}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold mb-2">{template.name}</h3>
                <p className="text-sm mb-4">{template.description}</p>
                
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-bold">Cost: </span>
                    {template.cost_range}
                  </div>
                  <div>
                    <span className="font-bold">Timeline: </span>
                    {template.implementation_time}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Selected Template Details */}
          {currentTemplate && (
            <div className="data-card">
              <h3 className="text-2xl font-bold mb-6">{currentTemplate.name} - Implementation Guide</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-bold mb-3">KEY PROGRAM ELEMENTS</h4>
                  <ul className="space-y-2 mb-6">
                    {currentTemplate.key_elements.map((element, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        {element}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-bold mb-3">MINIMUM REQUIREMENTS</h4>
                  <ul className="space-y-2">
                    {currentTemplate.minimum_requirements.map((requirement, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Target className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        {requirement}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Implementation Phases */}
      <section className="section-padding border-b-2 border-black bg-gray-50">
        <div className="container-justice">
          <h2 className="text-3xl font-bold mb-8">4-PHASE IMPLEMENTATION ROADMAP</h2>
          
          {/* Phase Navigation */}
          <div className="flex flex-wrap gap-2 mb-8">
            {replicationSteps.map((step, index) => (
              <button
                key={index}
                onClick={() => setSelectedPhase(index)}
                className={`px-4 py-2 font-bold transition-all ${
                  selectedPhase === index
                    ? 'bg-black text-white'
                    : 'border-2 border-black hover:bg-black hover:text-white'
                }`}
              >
                Phase {index + 1}: {step.phase}
              </button>
            ))}
          </div>

          {/* Current Phase Details */}
          <div className="data-card">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold mb-2">Phase {selectedPhase + 1}: {currentStep.phase}</h3>
                <p className="text-gray-600 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Duration: {currentStep.duration}
                </p>
              </div>
              <div className="text-right">
                <div className="font-mono text-xl font-bold">Phase {selectedPhase + 1}/4</div>
              </div>
            </div>

            <p className="text-lg mb-8">{currentStep.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Activities & Deliverables */}
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold mb-3 flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    KEY ACTIVITIES
                  </h4>
                  <ul className="space-y-2">
                    {currentStep.activities.map((activity, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                        <span className="text-sm">{activity}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    DELIVERABLES
                  </h4>
                  <ul className="space-y-2">
                    {currentStep.deliverables.map((deliverable, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Award className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                        <span className="text-sm">{deliverable}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Resources & Success Criteria */}
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold mb-3 flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    RESOURCES NEEDED
                  </h4>
                  <ul className="space-y-2">
                    {currentStep.resources_needed.map((resource, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Target className="h-4 w-4 text-purple-600 mt-1 flex-shrink-0" />
                        <span className="text-sm">{resource}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold mb-3 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    SUCCESS CRITERIA
                  </h4>
                  <ul className="space-y-2">
                    {currentStep.success_criteria.map((criteria, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Zap className="h-4 w-4 text-yellow-600 mt-1 flex-shrink-0" />
                        <span className="text-sm">{criteria}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Challenges and Tips */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 pt-8 border-t border-gray-300">
              <div>
                <h4 className="font-bold mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  COMMON CHALLENGES
                </h4>
                <ul className="space-y-2">
                  {currentStep.common_challenges.map((challenge, index) => (
                    <li key={index} className="text-sm text-red-700">
                      • {challenge}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-bold mb-3 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-green-600" />
                  EXPERT TIPS
                </h4>
                <ul className="space-y-2">
                  {currentStep.tips.map((tip, index) => (
                    <li key={index} className="text-sm text-green-700">
                      • {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Resources & Downloads */}
      <section className="section-padding border-b-2 border-black">
        <div className="container-justice">
          <h2 className="text-3xl font-bold mb-8">RESOURCES & TOOLS</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="data-card">
              <Book className="h-8 w-8 mb-4" />
              <h3 className="font-bold text-lg mb-2">Implementation Workbook</h3>
              <p className="mb-4 text-sm">
                Step-by-step worksheets and templates for each phase of implementation.
              </p>
              <button className="cta-secondary w-full text-sm">
                <Download className="mr-2 h-4 w-4" />
                DOWNLOAD WORKBOOK
              </button>
            </div>

            <div className="data-card">
              <FileText className="h-8 w-8 mb-4" />
              <h3 className="font-bold text-lg mb-2">Policy Templates</h3>
              <p className="mb-4 text-sm">
                Ready-to-adapt policies, procedures, and operational documents.
              </p>
              <button className="cta-secondary w-full text-sm">
                <Download className="mr-2 h-4 w-4" />
                DOWNLOAD TEMPLATES
              </button>
            </div>

            <div className="data-card">
              <Users className="h-8 w-8 mb-4" />
              <h3 className="font-bold text-lg mb-2">Training Materials</h3>
              <p className="mb-4 text-sm">
                Staff training curricula, volunteer guides, and orientation materials.
              </p>
              <button className="cta-secondary w-full text-sm">
                <Download className="mr-2 h-4 w-4" />
                DOWNLOAD TRAINING
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Support & Contact */}
      <section className="section-padding bg-black text-white">
        <div className="container-justice">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold mb-6">IMPLEMENTATION SUPPORT</h2>
              <p className="text-xl mb-8">
                You don't have to do this alone. Connect with experienced practitioners 
                who can guide your implementation journey.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5" />
                  <span>1-800-JUSTICE (1-800-587-8423)</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5" />
                  <span>toolkit@justicehub.org.au</span>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5" />
                  <span>Community forum and peer support</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold mb-6">GET STARTED TODAY</h3>
              <div className="space-y-4">
                <Link href="/grassroots/toolkit/assessment" className="cta-primary w-full text-center block">
                  <Target className="mr-2 h-5 w-5" />
                  COMMUNITY READINESS ASSESSMENT
                </Link>
                <Link href="/grassroots" className="border-2 border-white px-8 py-4 font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all w-full text-center block">
                  <Award className="mr-2 h-5 w-5" />
                  EXPLORE EXISTING PROGRAMS
                </Link>
                <button className="border-2 border-white px-8 py-4 font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all w-full">
                  <Calendar className="mr-2 h-5 w-5" />
                  SCHEDULE CONSULTATION
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}