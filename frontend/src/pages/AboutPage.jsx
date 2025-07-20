import React from 'react'
import { Link } from 'react-router-dom'
import { 
  Search, 
  MapPin, 
  Database, 
  Users, 
  Heart, 
  Shield, 
  ExternalLink, 
  TrendingUp,
  DollarSign,
  Code,
  Globe,
  Lightbulb,
  AlertCircle,
  BookOpen,
  Zap,
  GitBranch,
  ArrowRight
} from 'lucide-react'

export default function AboutPage() {
  const platformFeatures = [
    {
      icon: Search,
      title: 'Service Discovery',
      description: 'Search 605+ youth services across Queensland with advanced filters, location-based search, and intelligent categorization.',
      tech: 'PostgreSQL + Elasticsearch + React'
    },
    {
      icon: MapPin,
      title: 'Interactive Service Map',
      description: 'Visualize services on an interactive map with distance calculations and location-based recommendations.',
      tech: 'Leaflet Maps + Geospatial queries'
    },
    {
      icon: TrendingUp,
      title: 'Budget Intelligence',
      description: 'Real-time tracking of Queensland\'s $2.256B youth justice budget using government contract disclosure data.',
      tech: 'Government APIs + Data visualization'
    },
    {
      icon: Database,
      title: 'Real-Time Data',
      description: 'Automated data ingestion from government sources, service directories, and partner organizations.',
      tech: 'Web scraping + API integration'
    }
  ]

  const dataCategories = [
    {
      icon: Users,
      title: 'Service Database',
      count: '605+',
      description: 'Youth-specific services including legal aid, mental health, housing, education, and crisis support',
      sources: ['Queensland Government directories', 'Legal Aid Queensland', 'headspace locations', 'Community organizations']
    },
    {
      icon: DollarSign,
      title: 'Budget Data',
      count: '$3.58B',
      description: 'Real Queensland government spending tracking with 45 major contracts and infrastructure projects',
      sources: ['Contract disclosure CSV files', 'Queensland Budget Papers 2024-25', 'Ministerial announcements', 'Infrastructure project data']
    },
    {
      icon: MapPin,
      title: 'Geographic Data',
      count: '8 States',
      description: 'Location data for services across all Australian states and territories with distance calculations',
      sources: ['Google Places API', 'OpenStreetMap', 'Government address data', 'Manual verification']
    },
    {
      icon: BookOpen,
      title: 'Legal Information',
      count: '150+',
      description: 'Legal aid organizations, court support services, and youth advocacy groups',
      sources: ['Legal Aid directories', 'Court websites', 'Aboriginal Legal Services', 'Community legal centres']
    }
  ]

  const budgetIntelligence = [
    {
      title: 'Contract Disclosure Integration',
      description: 'Automated processing of Queensland government contract CSV files from families.qld.gov.au',
      value: '34 real contracts',
      status: 'Live'
    },
    {
      title: 'Major Infrastructure Tracking',
      description: 'Woodford ($628M), Wacol ($250M), Cairns ($300M) detention centre construction projects',
      value: '$1.18B tracked',
      status: 'Live'
    },
    {
      title: 'Program Spending Analysis',
      description: 'Community Safety Plan ($1.28B), Early Intervention ($215M), Education ($288M)',
      value: '$1.78B programs',
      status: 'Live'
    },
    {
      title: 'Real Funding Opportunities',
      description: 'Current Queensland government grants with actual closing dates (GCBF, Youth Skills, etc.)',
      value: '4 opportunities',
      status: 'Updated'
    }
  ]

  const techStack = [
    {
      category: 'Backend',
      items: [
        'Node.js + Fastify API server',
        'PostgreSQL with JSONB support', 
        'Elasticsearch for advanced search',
        'OpenAPI 3.0 documentation',
        'Real-time CSV data processing',
        'Web scraping automation'
      ]
    },
    {
      category: 'Frontend', 
      items: [
        'React + Vite for fast UI',
        'Tailwind CSS responsive design',
        'Leaflet interactive maps',
        'Chart.js data visualization',
        'Progressive web app features',
        'Mobile-first accessibility'
      ]
    },
    {
      category: 'Data Pipeline',
      items: [
        'Automated CSV parsing',
        'Government API integration',
        'Real-time budget tracking',
        'Service directory scraping',
        'Data validation & cleaning',
        'Caching & performance optimization'
      ]
    },
    {
      category: 'Infrastructure',
      items: [
        'Railway cloud hosting',
        'Vercel frontend deployment',
        'PostgreSQL cloud database',
        'CI/CD with GitHub Actions',
        'API rate limiting & security',
        'Monitoring & error tracking'
      ]
    }
  ]

  const futureIdeas = [
    {
      icon: Zap,
      title: 'AI-Powered Service Matching',
      description: 'Machine learning to match young people with the most appropriate services based on their specific needs and circumstances.',
      priority: 'High',
      effort: 'Medium'
    },
    {
      icon: Users,
      title: 'Mobile App Development',
      description: 'Native iOS and Android apps with offline service data, GPS navigation, and push notifications for urgent services.',
      priority: 'High', 
      effort: 'High'
    },
    {
      icon: TrendingUp,
      title: 'Predictive Budget Analytics',
      description: 'Forecast spending patterns, identify funding gaps, and predict which areas need additional investment.',
      priority: 'Medium',
      effort: 'Medium'
    },
    {
      icon: Globe,
      title: 'Multi-Language Support',
      description: 'Translate the platform into languages spoken by Queensland youth including Arabic, Mandarin, Vietnamese, and Indigenous languages.',
      priority: 'High',
      effort: 'Medium'
    },
    {
      icon: Users,
      title: 'Community Feedback System',
      description: 'Allow young people to rate services, provide feedback, and share experiences to help others make informed choices.',
      priority: 'Medium',
      effort: 'Low'
    },
    {
      icon: AlertCircle,
      title: 'Crisis Detection & Alert System',
      description: 'Monitor for emerging issues and automatically alert relevant services about potential crises or service gaps.',
      priority: 'High',
      effort: 'High'
    },
    {
      icon: Database,
      title: 'National Expansion',
      description: 'Expand beyond Queensland to cover all Australian states with their respective youth justice data and services.',
      priority: 'Medium',
      effort: 'High'
    },
    {
      icon: Code,
      title: 'Open Source API Ecosystem',
      description: 'Create developer tools and APIs for other organizations to build youth-focused applications using our data.',
      priority: 'Low',
      effort: 'Medium'
    }
  ]

  const supportNeeded = [
    {
      icon: DollarSign,
      title: 'Funding Support',
      areas: [
        'Infrastructure hosting costs ($500/month)',
        'Development team expansion (2-3 developers)',
        'Data partnerships and API access',
        'Mobile app development ($50K-100K)',
        'AI/ML development capabilities'
      ]
    },
    {
      icon: Users,
      title: 'Community Partnerships',
      areas: [
        'Youth organizations for user testing',
        'Legal aid organizations for data validation',
        'Government departments for data access',
        'Community groups for service verification',
        'Indigenous organizations for cultural guidance'
      ]
    },
    {
      icon: Code,
      title: 'Technical Expertise',
      areas: [
        'React Native mobile developers',
        'Machine learning engineers',
        'Data scientists for analytics',
        'DevOps engineers for scaling',
        'UX/UI designers for accessibility'
      ]
    },
    {
      icon: Shield,
      title: 'Governance & Compliance',
      areas: [
        'Privacy and data protection guidance',
        'Youth safety and safeguarding protocols',
        'Government partnership facilitation',
        'Legal compliance for multi-state expansion',
        'Community advisory board establishment'
      ]
    }
  ]

  const stats = [
    { number: '605+', label: 'Services Available' },
    { number: '$3.58B', label: 'Budget Tracked' },
    { number: '45', label: 'Major Contracts' },
    { number: '8', label: 'States Covered' },
    { number: '24/7', label: 'Crisis Support' },
    { number: '100%', label: 'Open Source' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-700 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">
              Youth Justice Service Finder
            </h1>
            <p className="text-xl text-primary-100 leading-relaxed max-w-4xl mx-auto mb-8">
              Australia's most comprehensive platform for youth justice services, 
              combining real-time government budget intelligence with a searchable 
              database of 605+ support services across Queensland and beyond.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">
                    {stat.number}
                  </div>
                  <div className="text-sm text-primary-200">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A sophisticated platform that combines automated data collection, 
              real-time government budget tracking, and intelligent service discovery
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {platformFeatures.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="bg-gray-50 rounded-xl p-8 border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center mb-6">
                    <Icon className="w-8 h-8 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <Code className="w-3 h-3 mr-1" />
                    {feature.tech}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Data Categories Section */}
      <div className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Data</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive, real-time data from verified government and community sources
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {dataCategories.map((category, index) => {
              const Icon = category.icon
              return (
                <div key={index} className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mr-4">
                      <Icon className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{category.title}</h3>
                      <div className="text-2xl font-bold text-primary-600">{category.count}</div>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">{category.description}</p>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-gray-900 text-sm">Data Sources:</h4>
                    {category.sources.map((source, idx) => (
                      <div key={idx} className="text-sm text-gray-600">• {source}</div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Budget Intelligence Deep Dive */}
      <div className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Budget Intelligence System</h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto">
              Real-time tracking of Queensland's youth justice spending using automated 
              government data collection and contract disclosure analysis
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {budgetIntelligence.map((item, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    item.status === 'Live' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <p className="text-gray-600 mb-3">{item.description}</p>
                <div className="text-xl font-bold text-primary-600">{item.value}</div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link 
              to="/budget" 
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              <TrendingUp className="w-5 h-5 mr-2" />
              Explore Budget Intelligence
            </Link>
          </div>
        </div>
      </div>

      {/* Technology Stack */}
      <div className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Technology Stack</h2>
            <p className="text-xl text-gray-600">
              Built with modern, scalable technologies for reliability and performance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {techStack.map((category, index) => (
              <div key={index} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">{category.category}</h3>
                <ul className="space-y-2">
                  {category.items.map((item, idx) => (
                    <li key={idx} className="text-sm text-gray-600 flex items-start">
                      <span className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <a
              href="https://youth-justice-service-finder-production.up.railway.app/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              View API Documentation
              <ExternalLink className="w-4 h-4 ml-2" />
            </a>
          </div>
        </div>
      </div>

      {/* Future Ideas */}
      <div className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Future Vision</h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto">
              Ambitious ideas to expand the platform's impact and reach, 
              transforming how young people access support services across Australia
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {futureIdeas.map((idea, index) => {
              const Icon = idea.icon
              return (
                <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-start mb-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                      <Icon className="w-6 h-6 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{idea.title}</h3>
                      <div className="flex space-x-2 mb-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          idea.priority === 'High' ? 'bg-red-100 text-red-800' :
                          idea.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {idea.priority} Priority
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          idea.effort === 'High' ? 'bg-purple-100 text-purple-800' :
                          idea.effort === 'Medium' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {idea.effort} Effort
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600">{idea.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Support Needed */}
      <div className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Support Needed</h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto">
              Help us expand the platform's impact and reach more young people 
              across Australia who need essential support services
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {supportNeeded.map((support, index) => {
              const Icon = support.icon
              return (
                <div key={index} className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mr-4">
                      <Icon className="w-6 h-6 text-primary-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{support.title}</h3>
                  </div>
                  <ul className="space-y-3">
                    {support.areas.map((area, idx) => (
                      <li key={idx} className="text-gray-600 flex items-start">
                        <ArrowRight className="w-4 h-4 text-primary-600 mt-0.5 mr-3 flex-shrink-0" />
                        {area}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>

          <div className="mt-16 bg-primary-600 text-white rounded-xl p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Want to Contribute?</h3>
            <p className="text-primary-100 mb-6 max-w-3xl mx-auto">
              Whether you're a developer, researcher, youth worker, or just passionate about 
              improving outcomes for young people, there are many ways to get involved.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://github.com/Acurioustractor/Youth-Justice-Service-Finder"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-white text-primary-600 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                <GitBranch className="w-5 h-5 mr-2" />
                View on GitHub
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
              <Link 
                to="/search"
                className="inline-flex items-center px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-400 transition-colors"
              >
                <Search className="w-5 h-5 mr-2" />
                Start Using the Platform
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mission & Principles */}
      <div className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Mission & Principles</h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto">
              Guided by a commitment to dignity, accessibility, and evidence-based support 
              for young people in contact with the justice system
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Mission Statement</h3>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                To create Australia's most comprehensive, accessible platform that empowers 
                young people in the justice system to find and connect with appropriate 
                support services, while providing unprecedented transparency into government 
                spending and service delivery.
              </p>
              <p className="text-gray-600 leading-relaxed">
                We believe every young person deserves access to high-quality support services 
                delivered with dignity, respect, and cultural sensitivity, regardless of their 
                background or circumstances.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Core Principles</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Heart className="w-6 h-6 text-red-500 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Dignity & Respect</h4>
                    <p className="text-gray-600 text-sm">Every young person deserves support delivered with dignity and respect</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Shield className="w-6 h-6 text-blue-500 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Safety First</h4>
                    <p className="text-gray-600 text-sm">Clear pathways to emergency support and crisis intervention</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Users className="w-6 h-6 text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Universal Accessibility</h4>
                    <p className="text-gray-600 text-sm">Services easy to find and access regardless of background</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Database className="w-6 h-6 text-purple-500 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Data Transparency</h4>
                    <p className="text-gray-600 text-sm">Open, accurate information about services and government spending</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}