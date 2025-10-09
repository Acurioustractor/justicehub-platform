'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Award,
  ArrowLeft,
  ExternalLink,
  Download,
  MapPin,
  Users,
  TrendingDown,
  Heart,
  Shield,
  ChevronRight,
  BookOpen,
  AlertCircle
} from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';

interface BestPracticeModel {
  id: string;
  name: string;
  state: string;
  tagline: string;
  overview: string;
  keyFeatures: string[];
  outcomes: {
    metric: string;
    value: string;
    context: string;
  }[];
  strengths: string[];
  challenges: string[];
  resources: {
    title: string;
    type: 'research' | 'policy' | 'report';
    url: string;
    description: string;
  }[];
  color: string;
}

const AUSTRALIAN_MODELS: BestPracticeModel[] = [
  {
    id: 'nsw-youth-koori-court',
    name: 'NSW Youth Koori Court',
    state: 'New South Wales',
    tagline: '40% reduction in custodial sentences for Aboriginal young people',
    overview: 'Established in 2015 at Parramatta Children\'s Court, the Youth Koori Court uses Elders and respected people from Aboriginal and Torres Strait Islander communities to address underlying causes of offending. The court develops Action and Support Plans addressing risk factors like homelessness, education disengagement, and health issues while strengthening cultural connections.',
    keyFeatures: [
      'Elders and respected Aboriginal community members guide proceedings',
      'Action and Support Plans developed collaboratively with young person',
      'Addresses underlying risk factors: housing, education, health, substance use',
      'Strengthens cultural connections and community engagement',
      'Monitored implementation over months with regular reviews',
      'Operating in Parramatta (2015), Surry Hills (2019), Dubbo (2023)',
      'Overwhelming support from participants, families, and stakeholders'
    ],
    outcomes: [
      {
        metric: 'Custody Reduction at Sentencing',
        value: '40%',
        context: 'less likely to receive custodial sentence at court finalisation'
      },
      {
        metric: 'Custody at Re-conviction',
        value: '84%',
        context: 'less likely to receive custody if they reoffend'
      },
      {
        metric: 'Average Detention Time',
        value: '57 → 25 days',
        context: 'average custody time reduced from 57 to 25 days'
      }
    ],
    strengths: [
      'Significant 40% reduction in custodial sentences',
      '84% less custody at re-conviction demonstrates lasting impact',
      'Halves average detention time (57 to 25 days)',
      'Strong cultural foundation with Elder involvement',
      'Addresses root causes, not just offending behavior',
      'Overwhelming participant and stakeholder satisfaction',
      'Successfully expanded to three locations',
      'BOCSAR independent evaluation confirms effectiveness'
    ],
    challenges: [
      'No statistically significant reduction in reoffending rates overall',
      'Requires substantial Elder and community involvement',
      'Resource intensive model needing dedicated staff',
      'Limited to areas with strong Aboriginal community presence',
      'Takes months to complete Action Plans',
      'Need for more long-term outcome data',
      'Expansion requires careful community consultation'
    ],
    resources: [
      {
        title: 'BOCSAR Evaluation: Impact on Sentencing and Re-offending Outcomes (2022)',
        type: 'research',
        url: 'https://bocsar.nsw.gov.au/media/2022/mr-ykc-outcomes.html',
        description: 'Independent evaluation by NSW Bureau of Crime Statistics and Research'
      },
      {
        title: 'Full Evaluation Report PDF',
        type: 'report',
        url: 'https://childrenscourt.nsw.gov.au/documents/reports/2022-Report-Impact-NSW_Youth-Koori-Court-on-sentencing-and-reoffending-outcomes-V8.pdf',
        description: 'Comprehensive PDF report with detailed methodology and findings'
      },
      {
        title: 'Youth Koori Court - Children\'s Court NSW',
        type: 'policy',
        url: 'https://childrenscourt.nsw.gov.au/criminal/koori-court.html',
        description: 'Official court information and procedures'
      }
    ],
    color: 'blue'
  },
  {
    id: 'victoria-therapeutic-services',
    name: 'Victoria\'s Therapeutic Youth Justice Model',
    state: 'Victoria',
    tagline: 'Evidence-based Risk-Need-Responsivity approach with MST and FFT trials',
    overview: 'Victoria\'s youth justice system uses a Risk-Need-Responsivity (RNR) framework that matches interventions to risk levels, addresses offending-related needs, and responds to individual characteristics. The state is trialling evidence-based family therapeutic interventions including Multi-Systemic Therapy (MST) and Functional Family Therapy (FFT), with strong emphasis on community-based rather than custodial responses.',
    keyFeatures: [
      'Risk-Need-Responsivity framework guides all interventions',
      'Multi-Systemic Therapy (MST) trials for serious offenders',
      'Functional Family Therapy (FFT) for family engagement',
      'Therapeutic Treatment Orders for community-based care',
      'SABTS program for youth with harmful sexual behaviors (since 2007)',
      'Diversion and early intervention prioritized',
      'Youth Justice Strategic Plan 2020-2030 for system transformation'
    ],
    outcomes: [
      {
        metric: 'Community-Based Success',
        value: 'Similar/Lower',
        context: 'recidivism rates vs residential treatment at far reduced cost'
      },
      {
        metric: 'SABTS Program',
        value: '17 years',
        context: 'of proven community-based treatment since 2007'
      },
      {
        metric: 'Evidence Base',
        value: 'Strongest',
        context: 'for community settings with defined therapeutic approaches'
      }
    ],
    strengths: [
      'Strong evidence base for therapeutic interventions',
      'MST and FFT proven effective internationally',
      'Community-based approaches more cost-effective',
      'Therapeutic Treatment Orders keep youth out of custody',
      'SABTS 17-year track record demonstrates sustainability',
      'Strategic Plan provides long-term vision (2020-2030)',
      'Focus on family involvement addresses systemic issues',
      'Diversion prioritized for most young people'
    ],
    challenges: [
      'Staff morale and retention issues impact implementation',
      'Therapeutic models require highly trained staff',
      'Resource intensive interventions (MST/FFT)',
      'Limited availability of evidence-based programs',
      'Still developing consistent statewide approach',
      'Need for more rigorous outcome evaluation',
      'Balancing therapeutic approach with community safety concerns'
    ],
    resources: [
      {
        title: 'Victorian Youth Justice Strategic Plan 2020-2030',
        type: 'policy',
        url: 'https://www.justice.vic.gov.au/justice-system/youth-justice/youth-justice-strategic-plan-2020-2030-reducing-reoffending-and',
        description: 'Long-term strategic framework for youth justice transformation'
      },
      {
        title: 'Youth Justice Overview - Department of Justice and Community Safety',
        type: 'policy',
        url: 'https://www.justice.vic.gov.au/justice-system/youth-justice',
        description: 'Current programs, services, and therapeutic approaches'
      },
      {
        title: 'Victorian Juvenile Justice Rehabilitation Review',
        type: 'report',
        url: 'https://www.aic.gov.au/sites/default/files/2020-05/victorian-juvenile-justice-rehabilitation-reveiw.pdf',
        description: 'Comprehensive review of rehabilitation programs and outcomes'
      }
    ],
    color: 'purple'
  },
  {
    id: 'queensland-diversion-model',
    name: 'Queensland Youth Justice Diversion & Restorative Justice',
    state: 'Queensland',
    tagline: 'First Nations-led programs with $134M investment, identifying critical improvement areas',
    overview: 'Queensland has invested significantly in youth justice diversion and restorative justice programs, particularly for First Nations young people. The state spent $134M between 2018-2023, with 32% allocated to First Nations-led organizations. However, recent audits and reviews have identified critical challenges including high reoffending rates (75% within 2 weeks, 84-96% within 12 months) and limited program effectiveness assessment.',
    keyFeatures: [
      'Restorative justice programs for First Nations youth',
      '$134M investment 2018-2023 in youth justice services',
      '32% ($42M) to First Nations-led organizations',
      'Youth Justice Strategy 2019-2023 framework',
      'Community-based service providers (68% NGO-delivered)',
      '72-hour post-release plans for serious offenders',
      'Focus on cultural responsiveness and community participation'
    ],
    outcomes: [
      {
        metric: 'Reoffending Rate (2 weeks)',
        value: '75%',
        context: 'reoffend within 2 weeks of release - major challenge identified'
      },
      {
        metric: 'Reoffending Rate (12 months)',
        value: '84-96%',
        context: 'reoffend within 12 months - among highest in Australia'
      },
      {
        metric: 'Program Investment',
        value: '$134M',
        context: 'spent 2018-2023, but limited effectiveness assessment'
      }
    ],
    strengths: [
      'Significant investment in youth justice services ($134M)',
      'Strong commitment to First Nations-led programs (32% funding)',
      'Comprehensive Youth Justice Strategy developed',
      'Restorative justice programs available',
      'NGO partnerships bring community expertise',
      'Recognition of need for cultural responsiveness',
      'Programs tailored to community needs'
    ],
    challenges: [
      'Extremely high reoffending rates (75% within 2 weeks)',
      '84-96% reoffend within 12 months - critical systemic issue',
      'Limited assessment of program effectiveness despite $134M spend',
      'Youth Justice Strategy 2019-2023 not implemented effectively',
      'Only partial action plan developed',
      'Restorative justice adopted in limited capacity',
      'Significant lack of program uptake and referrals',
      'Limited evaluation culture across programs',
      'Post-release plans not preventing rapid reoffending'
    ],
    resources: [
      {
        title: 'Queensland Audit Office: Reducing Serious Youth Crime (2024)',
        type: 'report',
        url: 'https://www.qao.qld.gov.au/reports-resources/reports-parliament/reducing-serious-youth-crime',
        description: 'Critical audit of youth justice outcomes and program effectiveness'
      },
      {
        title: 'Review of Restorative Justice Programmes for First Nations Peoples',
        type: 'research',
        url: 'https://www.tandfonline.com/doi/full/10.1080/01924036.2024.2319295',
        description: 'Academic review examining restorative justice capacity and uptake'
      },
      {
        title: 'Youth Justice Strategy - Department of Youth Justice',
        type: 'policy',
        url: 'https://www.youthjustice.qld.gov.au/our-department/strategies-reform/strategy',
        description: 'Strategic framework and reform initiatives'
      }
    ],
    color: 'yellow'
  },
  {
    id: 'wa-aboriginal-youth-programs',
    name: 'WA Aboriginal Youth Justice Programs',
    state: 'Western Australia',
    tagline: 'Addressing severe overrepresentation: 71% in detention are Aboriginal (6% of population)',
    overview: 'Western Australia faces the most severe Aboriginal youth overrepresentation in Australia, with 71% of children in detention being Aboriginal despite comprising only 6% of the youth population. First Nations young people are 27 times more likely to be under youth justice supervision and 40 times overrepresented in detention. Community-led justice reinvestment programs show promise but face critical underfunding.',
    keyFeatures: [
      'Community-led justice reinvestment initiatives',
      'Aboriginal-led program design and delivery',
      'Diversionary programs including cautions and conferencing',
      'Circle sentencing and Indigenous court processes',
      'Prisoner through-care arrangements',
      'Focus on keeping young people in communities and schools',
      'Partnership between Aboriginal organizations and government'
    ],
    outcomes: [
      {
        metric: 'Detention Overrepresentation',
        value: '71%',
        context: 'of children in detention are Aboriginal (6% of youth population)'
      },
      {
        metric: 'Supervision Overrepresentation',
        value: '27 times',
        context: 'more likely to be under youth justice supervision'
      },
      {
        metric: 'Detention Disparity',
        value: '40 times',
        context: 'overrepresentation in detention vs non-Indigenous youth'
      }
    ],
    strengths: [
      'Community-led programs proven to keep kids out of jail',
      'Aboriginal-steered policies more effective',
      'Justice reinvestment approach addresses root causes',
      'Strong community knowledge and cultural connections',
      'Young people remain in communities and schools',
      'Aboriginal Legal Service advocacy and support',
      'Recognition of need for comprehensive reform'
    ],
    challenges: [
      'Worst overrepresentation in Australia (71% vs 6% population)',
      '27-40 times overrepresentation demonstrates systemic crisis',
      'Aboriginal programs critically underfunded',
      'Magistrates report funding gaps force detention',
      'Declining police commitment to diversion',
      'Lack of focus on youth vs adult offender needs',
      'Limited clarity on youth justice role',
      'Decline in quality of support for at-risk families',
      'Federal action needed but lacking'
    ],
    resources: [
      {
        title: 'AIHW Youth Justice in Australia 2022-23: Western Australia',
        type: 'report',
        url: 'https://www.aihw.gov.au/reports/youth-justice/youth-justice-in-australia-annual-report-2022-23/contents/fact-sheets/western-australia',
        description: 'Official statistics on WA youth justice system and overrepresentation'
      },
      {
        title: 'Indigenous Justice Clearinghouse: Youth Justice in Western Australia',
        type: 'research',
        url: 'https://www.indigenousjustice.gov.au/resources/youth-justice-in-western-australia/',
        description: 'Analysis of Indigenous youth justice issues in WA'
      },
      {
        title: 'Aboriginal Legal Service WA: Youth Justice Crisis',
        type: 'policy',
        url: 'https://nit.com.au/17-10-2024/14313/alswa-calls-for-federal-action-to-address-crisis-in-was-youth-justice-system',
        description: 'ALSWA advocacy for federal action on youth justice crisis'
      }
    ],
    color: 'red'
  }
];

export default function BestPracticePage() {
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
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="header-offset">
        {/* Header */}
        <section className="section-padding bg-gradient-to-br from-green-50 via-white to-blue-50 border-b-2 border-black">
          <div className="container-justice">
            <Link
              href="/centre-of-excellence"
              className="inline-flex items-center gap-2 font-bold text-gray-700 hover:text-black mb-6 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Centre of Excellence
            </Link>

            <div className="inline-block px-4 py-2 bg-green-100 border-2 border-black mb-6">
              <span className="font-bold">AUSTRALIAN BEST PRACTICE</span>
            </div>

            <h1 className="headline-truth mb-6">
              Australian Youth Justice Frameworks
            </h1>

            <p className="text-xl text-gray-700 max-w-4xl mb-6 leading-relaxed">
              Leading state and territory approaches to youth justice across Australia. These frameworks showcase innovations, challenges, and evidence-based practices from Queensland, NSW, Victoria, and Western Australia.
            </p>

            {/* Map Link */}
            <div className="mb-8">
              <Link
                href="/centre-of-excellence/map"
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-bold hover:bg-green-700 transition-all"
              >
                <MapPin className="h-5 w-5" />
                View Australian Frameworks on Map
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="border-2 border-black p-6 bg-white text-center">
                <TrendingDown className="h-10 w-10 mx-auto mb-3 text-blue-600" />
                <div className="text-3xl font-bold mb-1">40%</div>
                <div className="text-sm text-gray-600">Custody reduction NSW Youth Koori Court</div>
              </div>
              <div className="border-2 border-black p-6 bg-white text-center">
                <Heart className="h-10 w-10 mx-auto mb-3 text-purple-600" />
                <div className="text-3xl font-bold mb-1">MST/FFT</div>
                <div className="text-sm text-gray-600">Evidence-based therapy trials in Victoria</div>
              </div>
              <div className="border-2 border-black p-6 bg-white text-center">
                <Users className="h-10 w-10 mx-auto mb-3 text-yellow-600" />
                <div className="text-3xl font-bold mb-1">$134M</div>
                <div className="text-sm text-gray-600">Queensland investment 2018-2023</div>
              </div>
              <div className="border-2 border-black p-6 bg-white text-center">
                <AlertCircle className="h-10 w-10 mx-auto mb-3 text-red-600" />
                <div className="text-3xl font-bold mb-1">71%</div>
                <div className="text-sm text-gray-600">WA detention are Aboriginal (6% population)</div>
              </div>
            </div>
          </div>
        </section>

        {/* Australian Models */}
        <section className="section-padding">
          <div className="container-justice">
            <div className="space-y-8">
              {AUSTRALIAN_MODELS.map((model) => (
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
                        <p className="text-lg text-gray-700 italic">"{model.tagline}"</p>
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
          </div>
        </section>

        {/* CTA */}
        <section className="section-padding bg-gradient-to-br from-green-400 to-blue-400 border-t-2 border-black">
          <div className="container-justice text-center">
            <h2 className="headline-truth mb-6 text-white">Contribute Australian Research</h2>
            <p className="text-xl text-white max-w-3xl mx-auto mb-8 leading-relaxed">
              Know of other Australian state or territory programs making a difference? Help build our comprehensive evidence base of what works across Australia.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="px-8 py-4 bg-white text-black font-bold hover:bg-gray-100 transition-all inline-flex items-center justify-center gap-2"
              >
                Submit Research
              </Link>
              <Link
                href="/centre-of-excellence/research"
                className="px-8 py-4 border-2 border-white text-white font-bold hover:bg-white hover:text-black transition-all inline-flex items-center justify-center gap-2"
              >
                Browse Full Library
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
