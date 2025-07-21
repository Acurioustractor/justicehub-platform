'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft,
  MapPin, 
  Users, 
  DollarSign,
  Target,
  Phone,
  Mail,
  Globe,
  Calendar,
  Award,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Download,
  Copy,
  Play,
  Camera,
  FileText,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  Zap,
  MessageCircle
} from 'lucide-react';
import { 
  ImpactDashboard, 
  SuccessRateDisplay, 
  QuickStats, 
  CostComparison,
  OutcomeTimeline,
  MetricData
} from '@/components/ui/data-visualization';
import { 
  ProjectTimelineDashboard,
  TimelineSummary,
  ProjectTimeline,
  TimelinePhase,
  Milestone
} from '@/components/ui/timeline-tracking';
import { 
  ContactCard,
  CollaborationRequestForm,
  ResourceShareCard,
  ContactInfo,
  ResourceShare
} from '@/components/ui/contact-collaboration';
import { Navigation, Footer, QuickNav } from '@/components/ui/navigation';

interface CaseStudy {
  id: string;
  name: string;
  organization: string;
  location: string;
  state: string;
  tagline: string;
  problem_statement: string;
  solution_overview: string;
  impact_metric: string;
  impact_value: number;
  participants: number;
  year_started: number;
  cost_per_participant: number;
  detention_cost_comparison: number;
  
  // Media specifications
  media: {
    hero_video?: {
      url: string;
      thumbnail: string;
      duration: string;
      description: string;
    };
    photos: Array<{
      id: string;
      url: string;
      caption: string;
      category: 'program' | 'participants' | 'community' | 'facilities' | 'outcomes';
    }>;
    videos: Array<{
      id: string;
      url: string;
      thumbnail: string;
      title: string;
      duration: string;
      type: 'testimonial' | 'program_demo' | 'community_impact' | 'training';
    }>;
  };
  
  // Impact data
  outcomes: {
    primary_metric: {
      value: number;
      label: string;
      comparison: string;
    };
    secondary_metrics: Array<{
      value: number | string;
      label: string;
      trend: 'up' | 'down' | 'stable';
    }>;
    long_term_impact: string[];
  };
  
  // Implementation details
  implementation: {
    timeline: Array<{
      phase: string;
      duration: string;
      activities: string[];
      milestones: string[];
    }>;
    key_elements: string[];
    challenges_overcome: string[];
    critical_success_factors: string[];
  };
  
  // Replication guide
  replication: {
    minimum_requirements: string[];
    startup_costs: {
      initial_investment: number;
      annual_operating: number;
      funding_sources: string[];
    };
    staff_requirements: Array<{
      role: string;
      fte: number;
      qualifications: string[];
    }>;
    training_needed: string[];
    community_partnerships: string[];
  };
  
  // Contact and collaboration
  contact: {
    program_director: {
      name: string;
      email: string;
      phone?: string;
    };
    organization_contact: {
      email: string;
      phone: string;
      website: string;
    };
    collaboration_opportunities: string[];
    visit_options: boolean;
    training_offered: boolean;
  };
  
  // Stories and testimonials
  stories: Array<{
    quote: string;
    author: string;
    role: string;
    impact: string;
  }>;

  // Timeline and milestones tracking
  implementation_timeline: ProjectTimeline;

  // Contact and collaboration
  team_contacts: ContactInfo[];
  shared_resources: ResourceShare[];
  collaboration_opportunities: string[];
}

export default function CaseStudyPage() {
  const params = useParams();
  const [caseStudy, setCaseStudy] = useState<CaseStudy | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [selectedMediaCategory, setSelectedMediaCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - will be replaced with Supabase query
    const loadCaseStudy = async () => {
      const mockCaseStudy: CaseStudy = {
      id: params.id as string,
      name: 'BackTrack Youth Works',
      organization: 'BackTrack Ltd',
      location: 'Armidale',
      state: 'NSW',
      tagline: 'Dogs, welding, and second chances: The program turning "problem kids" into skilled workers',
      problem_statement: `In 2005, Armidale had one of the highest youth crime rates in regional NSW. Young people were cycling through the juvenile justice system with no viable alternatives. Traditional programs focused on what was wrong with these kids, not what was right with them.`,
      solution_overview: `BackTrack flipped the script. Instead of therapy sessions, they offered welding torches. Instead of risk assessments, they introduced rescue dogs. Instead of punishment, they provided purpose through hands-on projects that built real skills and genuine self-worth.`,
      impact_metric: 'Success Rate',
      impact_value: 87,
      participants: 150,
      year_started: 2006,
      cost_per_participant: 38667,
      detention_cost_comparison: 96,
      
      media: {
        hero_video: {
          url: '/videos/backtrack-hero.mp4',
          thumbnail: '/images/backtrack/hero-thumb.jpg',
          duration: '3:24',
          description: 'Meet the young people rebuilding their lives through BackTrack'
        },
        photos: [
          { id: '1', url: '/images/backtrack/welding-workshop.jpg', caption: 'Youth learning advanced welding techniques', category: 'program' },
          { id: '2', url: '/images/backtrack/dog-training.jpg', caption: 'Working with rescue dogs builds responsibility and empathy', category: 'program' },
          { id: '3', url: '/images/backtrack/community-project.jpg', caption: 'Building playground equipment for local schools', category: 'community' },
          { id: '4', url: '/images/backtrack/graduation.jpg', caption: 'Celebrating certification achievements', category: 'outcomes' },
          { id: '5', url: '/images/backtrack/mentoring.jpg', caption: 'One-on-one mentoring sessions', category: 'participants' },
          { id: '6', url: '/images/backtrack/facilities.jpg', caption: 'Purpose-built workshops and training areas', category: 'facilities' }
        ],
        videos: [
          { id: '1', url: '/videos/backtrack/jake-story.mp4', thumbnail: '/images/backtrack/jake-thumb.jpg', title: 'Jake: From street sleeping to skilled welder', duration: '4:12', type: 'testimonial' },
          { id: '2', url: '/videos/backtrack/program-demo.mp4', thumbnail: '/images/backtrack/demo-thumb.jpg', title: 'A day in the BackTrack program', duration: '6:45', type: 'program_demo' },
          { id: '3', url: '/videos/backtrack/community-impact.mp4', thumbnail: '/images/backtrack/community-thumb.jpg', title: 'How BackTrack transformed Armidale', duration: '5:33', type: 'community_impact' }
        ]
      },
      
      outcomes: {
        primary_metric: {
          value: 87,
          label: 'of participants never reoffend',
          comparison: 'vs 84.5% reoffending rate in detention'
        },
        secondary_metrics: [
          { value: 92, label: 'gain employment or return to education', trend: 'up' },
          { value: 78, label: 'maintain stable housing after 12 months', trend: 'up' },
          { value: '15%', label: 'go on to start their own businesses', trend: 'up' },
          { value: 100, label: 'report improved self-confidence', trend: 'stable' }
        ],
        long_term_impact: [
          'Created 45+ full-time jobs in the local economy',
          'Trained over 300 local employers in youth-friendly hiring practices',
          'Reduced local youth crime by 34% since program launch',
          'Generated $2.8M in community projects and infrastructure'
        ]
      },
      
      implementation: {
        timeline: [
          {
            phase: 'Foundation (Months 1-6)',
            duration: '6 months',
            activities: [
              'Secure initial funding and premises',
              'Recruit core staff team',
              'Build community partnerships',
              'Design curriculum and safety protocols'
            ],
            milestones: [
              'Workshop facilities operational',
              'First cohort of 8 participants enrolled',
              'Safety certifications obtained'
            ]
          },
          {
            phase: 'Pilot Program (Months 7-18)',
            duration: '12 months',
            activities: [
              'Deliver first full program cycles',
              'Refine curriculum based on participant feedback',
              'Build employer network',
              'Document outcomes and impacts'
            ],
            milestones: [
              '24 participants completed program',
              '18 gained employment or education placements',
              'First community project completed'
            ]
          },
          {
            phase: 'Scale and Refine (Years 2-5)',
            duration: '4 years',
            activities: [
              'Expand to 30+ participants annually',
              'Add specialized tracks (construction, automotive)',
              'Develop train-the-trainer programs',
              'Research and evaluation partnerships'
            ],
            milestones: [
              '87% success rate consistently achieved',
              'Program model documented for replication',
              'National recognition and awards received'
            ]
          }
        ],
        key_elements: [
          'Hands-on vocational training in real-world skills',
          'Animal-assisted therapy through rescue dog program',
          'Intensive one-on-one mentoring relationships',
          'Community-based projects that build pride and purpose',
          'Employer engagement and job placement support',
          'Trauma-informed practice throughout all activities'
        ],
        challenges_overcome: [
          'Initial community skepticism about "rewarding" young offenders',
          'Insurance and liability concerns for hands-on training',
          'Recruiting staff who could connect with at-risk youth',
          'Balancing accountability with compassion in program rules'
        ],
        critical_success_factors: [
          'Charismatic leadership with lived experience',
          'Strong relationships with local police and courts',
          'Employer champions willing to give youth a chance',
          'Flexible program design that adapts to individual needs',
          'Consistent funding that allows long-term planning'
        ]
      },
      
      replication: {
        minimum_requirements: [
          'Workshop space (minimum 500m²) with industrial power',
          'Vehicle maintenance bay and tools',
          'Office space for counseling and administration',
          'Insurance and safety certifications',
          'Community support and local employer engagement'
        ],
        startup_costs: {
          initial_investment: 485000,
          annual_operating: 580000,
          funding_sources: [
            'Government youth justice grants',
            'Corporate foundation partnerships',
            'Local business sponsorships',
            'Fee-for-service community projects',
            'Social impact investment'
          ]
        },
        staff_requirements: [
          { role: 'Program Director', fte: 1.0, qualifications: ['Youth work experience', 'Leadership skills', 'Community connections'] },
          { role: 'Vocational Trainers', fte: 2.5, qualifications: ['Trade qualifications', 'Training certificate IV', 'Youth engagement skills'] },
          { role: 'Youth Workers/Mentors', fte: 3.0, qualifications: ['Youth work qualification', 'Trauma-informed practice', 'Case management experience'] },
          { role: 'Administration', fte: 1.0, qualifications: ['Project management', 'Data collection', 'Community liaison'] }
        ],
        training_needed: [
          'BackTrack methodology workshop (5 days)',
          'Trauma-informed youth work certification',
          'Animal-assisted therapy training',
          'Community engagement and employer relations',
          'Program evaluation and data collection'
        ],
        community_partnerships: [
          'Local police and juvenile justice agencies',
          'Schools and education departments',
          'Employers across construction, automotive, and trades',
          'Mental health and social services',
          'Local government and community organizations'
        ]
      },
      
      contact: {
        program_director: {
          name: 'Bernie Shakeshaft',
          email: 'bernie@backtrack.org.au',
          phone: '02 6772 8349'
        },
        organization_contact: {
          email: 'info@backtrack.org.au',
          phone: '02 6772 8349',
          website: 'https://backtrack.org.au'
        },
        collaboration_opportunities: [
          'Site visits and program observations',
          'Staff training and mentoring',
          'Joint funding applications',
          'Research and evaluation partnerships',
          'Policy advocacy and reform'
        ],
        visit_options: true,
        training_offered: true
      },
      
      stories: [
        {
          quote: "I was sleeping rough, stealing cars, heading nowhere fast. BackTrack didn't just teach me to weld - they taught me I was worth something. Now I run my own workshop and employ three other kids who were just like me.",
          author: "Jake",
          role: "Program graduate, now business owner",
          impact: "Transformed from repeat offender to successful entrepreneur"
        },
        {
          quote: "My son was written off by everyone - schools, police, even family. BackTrack saw something in him we'd forgotten was there. He's been crime-free for four years and just bought his first house.",
          author: "Maria",
          role: "Parent",
          impact: "Family healing and long-term stability achieved"
        },
        {
          quote: "We used to arrest the same kids over and over. Now we refer them to BackTrack. Crime in our area has dropped 34% since the program started. It's the best crime prevention we've ever seen.",
          author: "Senior Constable Davis",
          role: "Local Police",
          impact: "Community-wide crime reduction and police-youth relations improved"
        }
      ],

      // Implementation timeline with detailed tracking
      implementation_timeline: {
        id: 'backtrack-timeline',
        project_name: 'BackTrack Youth Works Implementation',
        project_type: 'Vocational Training Program',
        start_date: '2006-01-15',
        target_completion: '2024-12-31',
        overall_status: 'active',
        overall_progress: 85,
        program_manager: 'Bernie Shakeshaft',
        stakeholders: ['NSW Police', 'Local Employers', 'Armidale Council', 'Youth Justice NSW'],
        total_budget: 2500000,
        spent_budget: 2100000,
        phases: [
          {
            id: 'foundation',
            title: 'Foundation & Planning',
            description: 'Establish community partnerships and initial program design',
            start_date: '2006-01-15',
            end_date: '2006-06-30',
            status: 'completed',
            total_budget: 150000,
            spent_budget: 145000,
            success_criteria: [
              'Community stakeholder committee established',
              'Initial funding secured',
              'Program model designed and approved',
              'Facility location identified'
            ],
            key_risks: [
              'Community resistance to youth program',
              'Difficulty securing insurance',
              'Lack of initial funding'
            ],
            milestones: [
              {
                id: 'stakeholder-committee',
                title: 'Stakeholder Committee Formation',
                description: 'Establish committee with police, community leaders, and youth services',
                target_date: '2006-02-28',
                completion_date: '2006-02-15',
                status: 'completed',
                priority: 'high',
                deliverables: ['Committee charter', 'Meeting schedule', 'Terms of reference'],
                progress_percentage: 100,
                category: 'planning',
                budget_allocated: 5000,
                budget_spent: 4200
              },
              {
                id: 'initial-funding',
                title: 'Secure Initial Funding',
                description: 'Obtain startup funding from government and foundation sources',
                target_date: '2006-04-30',
                completion_date: '2006-04-15',
                status: 'completed',
                priority: 'critical',
                deliverables: ['Funding agreements', 'Budget allocation', 'Financial controls'],
                progress_percentage: 100,
                category: 'planning',
                budget_allocated: 0,
                budget_spent: 0
              },
              {
                id: 'program-design',
                title: 'Program Model Design',
                description: 'Develop curriculum and operational model',
                target_date: '2006-05-31',
                completion_date: '2006-05-20',
                status: 'completed',
                priority: 'high',
                deliverables: ['Program manual', 'Safety protocols', 'Assessment frameworks'],
                progress_percentage: 100,
                category: 'planning',
                budget_allocated: 25000,
                budget_spent: 23000
              }
            ]
          },
          {
            id: 'pilot-phase',
            title: 'Pilot Implementation',
            description: 'Launch pilot program with first cohort of participants',
            start_date: '2006-07-01',
            end_date: '2007-06-30',
            status: 'completed',
            total_budget: 400000,
            spent_budget: 385000,
            success_criteria: [
              '8-12 participants enrolled',
              '70% completion rate achieved',
              'Basic workshop facilities operational',
              'Core staff team hired and trained'
            ],
            key_risks: [
              'Low participant engagement',
              'Staff inexperience',
              'Equipment and safety issues'
            ],
            milestones: [
              {
                id: 'facility-setup',
                title: 'Workshop Facility Setup',
                description: 'Establish welding workshop and dog program facilities',
                target_date: '2006-08-31',
                completion_date: '2006-08-20',
                status: 'completed',
                priority: 'critical',
                deliverables: ['Workshop equipment', 'Safety systems', 'Dog facilities'],
                progress_percentage: 100,
                category: 'setup',
                budget_allocated: 150000,
                budget_spent: 145000
              },
              {
                id: 'first-cohort',
                title: 'First Cohort Recruitment',
                description: 'Recruit and enroll first group of 8 participants',
                target_date: '2006-09-30',
                completion_date: '2006-09-15',
                status: 'completed',
                priority: 'high',
                deliverables: ['Participant assessments', 'Individual plans', 'Parent agreements'],
                progress_percentage: 100,
                category: 'implementation',
                budget_allocated: 15000,
                budget_spent: 12000
              }
            ]
          },
          {
            id: 'scale-phase',
            title: 'Scale & Refinement',
            description: 'Expand program capacity and refine delivery methods',
            start_date: '2007-07-01',
            end_date: '2020-12-31',
            status: 'completed',
            total_budget: 1500000,
            spent_budget: 1480000,
            success_criteria: [
              'Serve 30+ participants annually',
              'Achieve 80%+ success rate',
              'Secure sustainable funding',
              'Build employer network'
            ],
            key_risks: [
              'Funding sustainability',
              'Maintaining quality during growth',
              'Staff retention and development'
            ],
            milestones: [
              {
                id: 'employer-network',
                title: 'Employer Partnership Network',
                description: 'Build network of 20+ employers for job placements',
                target_date: '2008-12-31',
                completion_date: '2008-10-15',
                status: 'completed',
                priority: 'high',
                deliverables: ['Employer agreements', 'Placement protocols', 'Support systems'],
                progress_percentage: 100,
                category: 'implementation',
                budget_allocated: 50000,
                budget_spent: 45000
              },
              {
                id: 'national-recognition',
                title: 'National Recognition & Awards',
                description: 'Achieve national recognition for program innovation',
                target_date: '2015-12-31',
                completion_date: '2014-11-30',
                status: 'completed',
                priority: 'medium',
                deliverables: ['Awards documentation', 'Media coverage', 'Best practice guides'],
                progress_percentage: 100,
                category: 'evaluation',
                budget_allocated: 10000,
                budget_spent: 8000
              }
            ]
          },
          {
            id: 'sustainability',
            title: 'Long-term Sustainability',
            description: 'Establish sustainable operations and replication support',
            start_date: '2021-01-01',
            end_date: '2024-12-31',
            status: 'active',
            total_budget: 450000,
            spent_budget: 90000,
            success_criteria: [
              'Diversified funding portfolio',
              'Staff development program established',
              'Replication toolkit developed',
              'Alumni network active'
            ],
            key_risks: [
              'Ongoing funding challenges',
              'Changing government priorities',
              'Staff burnout and turnover'
            ],
            milestones: [
              {
                id: 'funding-diversification',
                title: 'Diversified Funding Portfolio',
                description: 'Secure funding from multiple sources to reduce dependency',
                target_date: '2022-06-30',
                completion_date: '2022-05-15',
                status: 'completed',
                priority: 'critical',
                deliverables: ['Funding agreements', 'Revenue projections', 'Sustainability plan'],
                progress_percentage: 100,
                category: 'sustainability',
                budget_allocated: 20000,
                budget_spent: 18000
              },
              {
                id: 'replication-toolkit',
                title: 'Program Replication Toolkit',
                description: 'Develop comprehensive toolkit for other communities',
                target_date: '2024-03-31',
                completion_date: '2024-02-28',
                status: 'completed',
                priority: 'high',
                deliverables: ['Implementation guide', 'Training materials', 'Policy templates'],
                progress_percentage: 100,
                category: 'sustainability',
                budget_allocated: 75000,
                budget_spent: 72000
              },
              {
                id: 'alumni-network',
                title: 'Alumni Network Development',
                description: 'Establish ongoing support network for program graduates',
                target_date: '2024-08-31',
                status: 'in_progress',
                priority: 'medium',
                deliverables: ['Alumni database', 'Support programs', 'Mentoring system'],
                progress_percentage: 75,
                category: 'sustainability',
                budget_allocated: 35000,
                budget_spent: 25000,
                notes: 'Strong engagement from graduates, developing online platform for ongoing connection'
              },
              {
                id: 'impact-evaluation',
                title: 'Comprehensive Impact Evaluation',
                description: 'Conduct long-term evaluation of program outcomes',
                target_date: '2024-12-31',
                status: 'in_progress',
                priority: 'high',
                deliverables: ['Evaluation report', 'Outcome analysis', 'Recommendations'],
                progress_percentage: 60,
                category: 'evaluation',
                budget_allocated: 45000,
                budget_spent: 12000,
                notes: 'Data collection underway, partnering with university research team'
              }
            ]
          }
        ]
      },

      // Contact and collaboration information
      team_contacts: [
        {
          id: 'bernie-shakeshaft',
          name: 'Bernie Shakeshaft',
          role: 'Founder & Program Director',
          organization: 'BackTrack Youth Works',
          location: 'Armidale, NSW',
          email: 'bernie@backtrack.org.au',
          phone: '02 6772 8349',
          website: 'https://backtrack.org.au',
          expertise: ['Youth Mentoring', 'Vocational Training', 'Program Design', 'Dog Training', 'Community Engagement'],
          availability: 'limited',
          response_time: '2-3 days',
          languages: ['English'],
          time_zone: 'AEST',
          preferred_contact: 'email'
        },
        {
          id: 'sarah-davis',
          name: 'Sarah Davis',
          role: 'Operations Manager',
          organization: 'BackTrack Youth Works',
          location: 'Armidale, NSW',
          email: 'sarah@backtrack.org.au',
          phone: '02 6772 8350',
          expertise: ['Program Operations', 'Staff Training', 'Safety Management', 'Curriculum Development'],
          availability: 'available',
          response_time: '1-2 days',
          languages: ['English'],
          time_zone: 'AEST',
          preferred_contact: 'email'
        },
        {
          id: 'mike-thompson',
          name: 'Mike Thompson',
          role: 'Welding Instructor & Mentor',
          organization: 'BackTrack Youth Works',
          location: 'Armidale, NSW',
          email: 'mike@backtrack.org.au',
          expertise: ['Welding Training', 'Trade Skills', 'Youth Mentoring', 'Workshop Safety'],
          availability: 'available',
          response_time: '1 day',
          languages: ['English'],
          time_zone: 'AEST',
          preferred_contact: 'phone'
        }
      ],
      
      shared_resources: [
        {
          id: 'program-manual',
          title: 'BackTrack Program Implementation Manual',
          type: 'document',
          description: 'Comprehensive 150-page manual covering program setup, curriculum, safety protocols, and operational procedures',
          shared_by: {
            id: 'bernie-shakeshaft',
            name: 'Bernie Shakeshaft',
            role: 'Founder & Program Director',
            organization: 'BackTrack Youth Works',
            location: 'Armidale, NSW',
            email: 'bernie@backtrack.org.au',
            expertise: [],
            availability: 'limited',
            response_time: '2-3 days',
            languages: ['English'],
            time_zone: 'AEST',
            preferred_contact: 'email'
          },
          availability: 'cost',
          location: 'Digital download',
          contact_method: 'direct',
          tags: ['implementation', 'manual', 'vocational training', 'dog program'],
          created_date: '2023-06-15',
          usage_count: 47,
          rating: 4.8
        },
        {
          id: 'training-curriculum',
          title: 'Mentor Training Curriculum',
          type: 'training',
          description: '40-hour training program for staff and volunteers working with at-risk youth',
          shared_by: {
            id: 'sarah-davis',
            name: 'Sarah Davis',
            role: 'Operations Manager',
            organization: 'BackTrack Youth Works',
            location: 'Armidale, NSW',
            email: 'sarah@backtrack.org.au',
            expertise: [],
            availability: 'available',
            response_time: '1-2 days',
            languages: ['English'],
            time_zone: 'AEST',
            preferred_contact: 'email'
          },
          availability: 'collaboration',
          location: 'Armidale, NSW (in-person) or remote',
          contact_method: 'direct',
          tags: ['training', 'mentoring', 'staff development'],
          created_date: '2023-08-20',
          usage_count: 23,
          rating: 4.9
        },
        {
          id: 'safety-protocols',
          title: 'Workshop Safety Protocols & Checklists',
          type: 'template',
          description: 'Complete safety management system for vocational workshops including risk assessments and emergency procedures',
          shared_by: {
            id: 'mike-thompson',
            name: 'Mike Thompson',
            role: 'Welding Instructor & Mentor',
            organization: 'BackTrack Youth Works',
            location: 'Armidale, NSW',
            email: 'mike@backtrack.org.au',
            expertise: [],
            availability: 'available',
            response_time: '1 day',
            languages: ['English'],
            time_zone: 'AEST',
            preferred_contact: 'phone'
          },
          availability: 'free',
          location: 'Digital download',
          contact_method: 'direct',
          tags: ['safety', 'workshop', 'protocols', 'risk management'],
          created_date: '2023-09-10',
          usage_count: 89,
          rating: 4.7
        },
        {
          id: 'dog-program-setup',
          title: 'Dog Program Setup & Training Guide',
          type: 'document',
          description: 'Step-by-step guide for establishing animal-assisted therapy programs including facility requirements and training protocols',
          shared_by: {
            id: 'bernie-shakeshaft',
            name: 'Bernie Shakeshaft',
            role: 'Founder & Program Director',
            organization: 'BackTrack Youth Works',
            location: 'Armidale, NSW',
            email: 'bernie@backtrack.org.au',
            expertise: [],
            availability: 'limited',
            response_time: '2-3 days',
            languages: ['English'],
            time_zone: 'AEST',
            preferred_contact: 'email'
          },
          availability: 'cost',
          location: 'Digital + consultation available',
          contact_method: 'direct',
          tags: ['dog training', 'animal therapy', 'setup guide'],
          created_date: '2023-07-05',
          usage_count: 34,
          rating: 4.8
        }
      ],

      collaboration_opportunities: [
        'Site visits and program observations (by appointment)',
        'Staff training and mentoring for new programs',
        'Joint funding applications and grant writing support',
        'Research and evaluation partnerships with universities',
        'Policy advocacy and reform initiatives',
        'Peer learning networks and best practice sharing',
        'Equipment and resource sharing with regional programs',
        'Employer network expansion and job placement coordination'
      ]
    };
    
    setCaseStudy(mockCaseStudy);
    setLoading(false);
    };

    loadCaseStudy();
  }, [params.id]);

  const filteredMedia = selectedMediaCategory === 'all' 
    ? caseStudy?.media.photos || []
    : caseStudy?.media.photos.filter(photo => photo.category === selectedMediaCategory) || [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="font-mono">Loading case study...</div>
      </div>
    );
  }

  if (!caseStudy) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Case study not found</h2>
          <Link href="/grassroots" className="cta-secondary">
            BACK TO GRASSROOTS
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      
      {/* Unified Navigation */}
      <Navigation />

      {/* Back Navigation with accessibility improvements */}
      <QuickNav 
        backLink="/grassroots" 
        backLabel="Back to Grassroots"
        title={caseStudy.name}
        actions={[
          { label: "Download Blueprint", href: "#implementation", variant: "secondary" },
          { label: "Contact Program", href: "#contact", variant: "primary" }
        ]}
      />

      <main id="main-content">
        {/* Hero Section */}
        <section className="section-padding border-b-2 border-black bg-black text-white">
          <div className="container-justice">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="mb-4">
                <span className="bg-white text-black px-3 py-1 font-bold text-sm">
                  {caseStudy.state} • Since {caseStudy.year_started}
                </span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                {caseStudy.impact_value}%
              </h1>
              <h2 className="text-2xl md:text-3xl font-bold mb-6">
                {caseStudy.name}
              </h2>
              <p className="text-xl mb-6 leading-relaxed">
                {caseStudy.tagline}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="cta-primary bg-white text-black hover:bg-gray-100">
                  <Play className="mr-2 h-5 w-5" />
                  WATCH STORY
                </button>
                <Link href="#implementation" className="border-2 border-white px-8 py-4 font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all text-center">
                  GET BLUEPRINT
                </Link>
              </div>
            </div>

            <div className="relative">
              {/* Video placeholder */}
              <div className="aspect-video bg-gray-800 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Play className="h-16 w-16 mb-4 opacity-60" />
                    <p className="text-lg">Featured Video</p>
                    <p className="text-sm opacity-75">{caseStudy.media.hero_video?.description}</p>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-center text-sm opacity-75">
                Duration: {caseStudy.media.hero_video?.duration}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="section-padding border-b-2 border-black">
        <div className="container-justice">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold mb-6">THE PROBLEM THEY FACED</h2>
              <p className="text-xl leading-relaxed mb-6">
                {caseStudy.problem_statement}
              </p>
              
              <div className="data-card bg-red-50 border-red-600">
                <h3 className="font-bold mb-4">BEFORE BACKTRACK</h3>
                <ul className="space-y-2">
                  <li>• Youth cycling through juvenile justice system</li>
                  <li>• High recidivism rates with no alternatives</li>
                  <li>• Community losing hope in young people</li>
                  <li>• Focus on deficits, not strengths</li>
                </ul>
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold mb-6">THEIR SOLUTION</h2>
              <p className="text-xl leading-relaxed mb-6">
                {caseStudy.solution_overview}
              </p>
              
              <div className="data-card bg-green-50 border-green-600">
                <h3 className="font-bold mb-4">KEY INNOVATIONS</h3>
                <ul className="space-y-2">
                  {caseStudy.implementation.key_elements.slice(0, 4).map((element, index) => (
                    <li key={index}>• {element}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Metrics */}
      <section className="section-padding bg-black text-white border-b-2 border-black">
        <div className="container-justice">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
            {/* Primary Success Rate Visualization */}
            <div className="flex justify-center">
              <SuccessRateDisplay
                rate={caseStudy.outcomes.primary_metric.value}
                label={caseStudy.outcomes.primary_metric.label}
                comparison={caseStudy.outcomes.primary_metric.comparison}
                animated={true}
              />
            </div>
            
            {/* Secondary Metrics */}
            <div>
              <h3 className="text-2xl font-bold mb-6">KEY OUTCOMES</h3>
              <QuickStats
                metrics={caseStudy.outcomes.secondary_metrics.map((metric, index) => ({
                  label: metric.label,
                  value: metric.value,
                  format: typeof metric.value === 'string' ? 'text' : 'percentage',
                  trend: metric.trend,
                  icon: index === 0 ? <Users className="h-6 w-6" /> : 
                        index === 1 ? <Target className="h-6 w-6" /> :
                        index === 2 ? <DollarSign className="h-6 w-6" /> :
                        <Award className="h-6 w-6" />
                }))}
              />
            </div>
          </div>

          {/* Cost Comparison */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-6 text-center">COST EFFECTIVENESS</h3>
            <CostComparison
              data={[
                {
                  label: "Annual Cost Per Participant",
                  current: caseStudy.cost_per_participant,
                  comparison: 1100000,
                  format: 'currency',
                  comparisonLabel: "DETENTION"
                }
              ]}
            />
          </div>

          {/* Long-term Impact Timeline */}
          <div>
            <h3 className="text-2xl font-bold mb-6">SUSTAINED IMPACT OVER TIME</h3>
            <OutcomeTimeline
              data={[
                { date: '2019', value: 75 },
                { date: '2020', value: 82 },
                { date: '2021', value: 85 },
                { date: '2022', value: 87 },
                { date: '2023', value: 87 },
                { date: '2024', value: 89 }
              ]}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              {caseStudy.outcomes.long_term_impact.map((impact, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-400 mt-1 flex-shrink-0" />
                  <p className="text-lg">{impact}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Media Gallery */}
      <section className="section-padding border-b-2 border-black">
        <div className="container-justice">
          <h2 className="text-3xl font-bold mb-8">PROGRAM IN ACTION</h2>
          
          {/* Media Category Filter */}
          <div className="flex flex-wrap gap-4 mb-8">
            {['all', 'program', 'participants', 'community', 'outcomes', 'facilities'].map((category) => (
              <button
                key={category}
                onClick={() => setSelectedMediaCategory(category)}
                className={`px-4 py-2 font-bold uppercase tracking-wider transition-all ${
                  selectedMediaCategory === category
                    ? 'bg-black text-white'
                    : 'border-2 border-black hover:bg-black hover:text-white'
                }`}
              >
                {category.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Photo Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {filteredMedia.map((photo) => (
              <div key={photo.id} className="group cursor-pointer">
                <div className="aspect-[4/3] bg-gray-200 relative overflow-hidden border-2 border-black">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Camera className="h-12 w-12 text-gray-500" />
                  </div>
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-80 transition-all duration-200 flex items-end p-4 opacity-0 group-hover:opacity-100">
                    <p className="text-white font-medium">{photo.caption}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Video Section */}
          <div>
            <h3 className="text-2xl font-bold mb-6">VIDEO STORIES</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {caseStudy.media.videos.map((video) => (
                <div key={video.id} className="group cursor-pointer">
                  <div className="aspect-video bg-gray-200 relative overflow-hidden border-2 border-black">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play className="h-12 w-12 text-gray-600" />
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black text-white px-2 py-1 text-xs">
                      {video.duration}
                    </div>
                  </div>
                  <h4 className="font-bold mt-2">{video.title}</h4>
                  <p className="text-sm text-gray-600 capitalize">{video.type.replace('_', ' ')}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Implementation Timeline */}
      <section id="implementation" className="section-padding bg-gray-50 border-b-2 border-black">
        <div className="container-justice">
          <h2 className="text-3xl font-bold mb-12">IMPLEMENTATION BLUEPRINT</h2>
          
          <div className="space-y-8">
            {caseStudy.implementation.timeline.map((phase, index) => (
              <div key={index} className="data-card">
                <div className="flex items-start gap-4">
                  <div className="bg-black text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{phase.phase}</h3>
                    <p className="text-sm text-gray-600 mb-4">{phase.duration}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-bold mb-2">KEY ACTIVITIES</h4>
                        <ul className="space-y-1 text-sm">
                          {phase.activities.map((activity, i) => (
                            <li key={i}>• {activity}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-bold mb-2">MILESTONES</h4>
                        <ul className="space-y-1 text-sm">
                          {phase.milestones.map((milestone, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              {milestone}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline & Milestones Tracking */}
      <section className="section-padding bg-gray-50 border-b-2 border-black">
        <div className="container-justice">
          <h2 className="text-3xl font-bold mb-8">IMPLEMENTATION TIMELINE & PROGRESS</h2>
          <p className="text-xl mb-12 max-w-4xl">
            Track the journey from initial planning to sustainable operations. This detailed timeline 
            shows actual progress, milestones achieved, and current status of ongoing initiatives.
          </p>
          
          <ProjectTimelineDashboard
            timeline={caseStudy.implementation_timeline}
            onUpdate={(updatedTimeline) => {
              // Handle timeline updates
              console.log('Timeline updated:', updatedTimeline);
            }}
          />
        </div>
      </section>

      {/* Replication Guide */}
      <section className="section-padding border-b-2 border-black">
        <div className="container-justice">
          <h2 className="text-3xl font-bold mb-12">REPLICATION GUIDE</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold mb-6">WHAT YOU NEED</h3>
              
              <div className="space-y-6">
                <div className="data-card">
                  <h4 className="font-bold mb-3">MINIMUM REQUIREMENTS</h4>
                  <ul className="space-y-2 text-sm">
                    {caseStudy.replication.minimum_requirements.map((req, index) => (
                      <li key={index}>• {req}</li>
                    ))}
                  </ul>
                </div>

                <div className="data-card">
                  <h4 className="font-bold mb-3">STARTUP COSTS</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="font-bold">Initial Investment</p>
                      <p className="font-mono text-2xl">${caseStudy.replication.startup_costs.initial_investment.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="font-bold">Annual Operating</p>
                      <p className="font-mono text-2xl">${caseStudy.replication.startup_costs.annual_operating.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold mb-6">STAFF & TRAINING</h3>
              
              <div className="space-y-6">
                <div className="data-card">
                  <h4 className="font-bold mb-3">STAFFING NEEDS</h4>
                  <div className="space-y-3">
                    {caseStudy.replication.staff_requirements.map((staff, index) => (
                      <div key={index} className="border-l-2 border-black pl-3">
                        <p className="font-bold">{staff.role} ({staff.fte} FTE)</p>
                        <ul className="text-sm text-gray-600">
                          {staff.qualifications.map((qual, i) => (
                            <li key={i}>• {qual}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="data-card">
                  <h4 className="font-bold mb-3">TRAINING PROVIDED</h4>
                  <ul className="space-y-2 text-sm">
                    {caseStudy.replication.training_needed.map((training, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Award className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        {training}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link href="#contact" className="cta-primary">
              <Download className="mr-2 h-5 w-5" />
              DOWNLOAD FULL BLUEPRINT
            </Link>
          </div>
        </div>
      </section>

      {/* Stories */}
      <section className="section-padding bg-black text-white border-b-2 border-black">
        <div className="container-justice">
          <h2 className="text-3xl font-bold mb-12 text-center">VOICES OF CHANGE</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {caseStudy.stories.map((story, index) => (
              <div key={index} className="border-2 border-white p-6">
                <blockquote className="text-lg mb-4 leading-relaxed">
                  "{story.quote}"
                </blockquote>
                <div className="border-t border-white pt-4">
                  <p className="font-bold">{story.author}</p>
                  <p className="text-sm opacity-75">{story.role}</p>
                  <p className="text-sm mt-2 text-green-400">{story.impact}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact & Collaboration */}
      <section id="contact" className="section-padding">
        <div className="container-justice">
          <h2 className="text-3xl font-bold mb-12 text-center">READY TO REPLICATE?</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold mb-6">GET CONNECTED</h3>
              
              <div className="data-card mb-6">
                <h4 className="font-bold mb-3">PROGRAM DIRECTOR</h4>
                <p className="font-bold">{caseStudy.contact.program_director.name}</p>
                <div className="space-y-2 mt-3">
                  <a href={`mailto:${caseStudy.contact.program_director.email}`} className="flex items-center gap-2 hover:underline">
                    <Mail className="h-4 w-4" />
                    {caseStudy.contact.program_director.email}
                  </a>
                  {caseStudy.contact.program_director.phone && (
                    <a href={`tel:${caseStudy.contact.program_director.phone}`} className="flex items-center gap-2 hover:underline">
                      <Phone className="h-4 w-4" />
                      {caseStudy.contact.program_director.phone}
                    </a>
                  )}
                </div>
              </div>

              <div className="data-card">
                <h4 className="font-bold mb-3">COLLABORATION OPTIONS</h4>
                <ul className="space-y-2">
                  {caseStudy.contact.collaboration_opportunities.map((opportunity, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Zap className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      {opportunity}
                    </li>
                  ))}
                </ul>
                
                <div className="mt-4 pt-4 border-t border-gray-300">
                  <div className="flex gap-4">
                    {caseStudy.contact.visit_options && (
                      <span className="text-sm bg-green-100 text-green-800 px-2 py-1 font-medium">
                        Site visits available
                      </span>
                    )}
                    {caseStudy.contact.training_offered && (
                      <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 font-medium">
                        Training provided
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold mb-6">TAKE ACTION</h3>
              
              <div className="space-y-4">
                <a 
                  href={`mailto:${caseStudy.contact.program_director.email}?subject=Replicating BackTrack in [Your Location]`}
                  className="cta-primary w-full text-center block"
                >
                  <Mail className="mr-2 h-5 w-5" />
                  START CONVERSATION
                </a>
                
                <button className="cta-secondary w-full">
                  <Calendar className="mr-2 h-5 w-5" />
                  SCHEDULE SITE VISIT
                </button>
                
                <button className="cta-secondary w-full">
                  <Download className="mr-2 h-5 w-5" />
                  DOWNLOAD TOOLKIT
                </button>
                
                <a 
                  href={caseStudy.contact.organization_contact.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cta-secondary w-full text-center block"
                >
                  <Globe className="mr-2 h-5 w-5" />
                  VISIT WEBSITE
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </div>

              <div className="mt-8 p-6 bg-black text-white">
                <h4 className="font-bold mb-3">IMPACT POTENTIAL</h4>
                <p className="mb-4">
                  If your community implemented this program:
                </p>
                <ul className="space-y-2 text-sm">
                  <li>• Save ${((1100000 - caseStudy.cost_per_participant) * 10).toLocaleString()} annually (10 participants)</li>
                  <li>• Reduce reoffending by up to 70%</li>
                  <li>• Create 5-10 local employment pathways</li>
                  <li>• Build community pride and hope</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact & Collaboration Hub */}
      <section className="section-padding border-b-2 border-black">
        <div className="container-justice">
          <h2 className="text-3xl font-bold mb-8 text-center">CONNECT & COLLABORATE</h2>
          <p className="text-xl text-center mb-12 max-w-4xl mx-auto">
            Ready to implement a similar program? Need support or want to share resources? 
            Connect directly with the BackTrack team and access proven tools and training.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
            {/* Team Contacts */}
            <div>
              <h3 className="text-2xl font-bold mb-6">MEET THE TEAM</h3>
              <div className="space-y-6">
                {caseStudy.team_contacts.map((contact) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    onContact={(contact, method) => {
                      window.open(`mailto:${contact.email}?subject=Inquiry about BackTrack Program`);
                    }}
                    onCollaborate={(contact) => {
                      console.log('Starting collaboration with:', contact.name);
                    }}
                    showDetails={true}
                  />
                ))}
              </div>
            </div>

            {/* Shared Resources */}
            <div>
              <h3 className="text-2xl font-bold mb-6">AVAILABLE RESOURCES</h3>
              <div className="space-y-6">
                {caseStudy.shared_resources.map((resource) => (
                  <ResourceShareCard
                    key={resource.id}
                    resource={resource}
                    onContact={(resource) => {
                      window.open(`mailto:${resource.shared_by.email}?subject=Request for: ${resource.title}`);
                    }}
                    onShare={(resource) => {
                      console.log('Sharing resource:', resource.title);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Collaboration Opportunities */}
          <div className="data-card">
            <h3 className="text-2xl font-bold mb-6">COLLABORATION OPPORTUNITIES</h3>
            <p className="text-lg mb-6">
              BackTrack actively collaborates with communities, organizations, and practitioners 
              to scale effective youth justice solutions. Here's how we can work together:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {caseStudy.collaboration_opportunities.map((opportunity, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 rounded">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>{opportunity}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-300">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => window.open(`mailto:bernie@backtrack.org.au?subject=Collaboration Inquiry - ${caseStudy.name}`)}
                  className="cta-primary"
                >
                  <Mail className="mr-2 h-5 w-5" />
                  REQUEST COLLABORATION
                </button>
                <button 
                  onClick={() => window.open(`tel:0267728349`)}
                  className="cta-secondary"
                >
                  <Phone className="mr-2 h-5 w-5" />
                  SCHEDULE CALL
                </button>
                <Link href="/grassroots/toolkit" className="cta-secondary">
                  <Download className="mr-2 h-5 w-5" />
                  GET IMPLEMENTATION TOOLKIT
                </Link>
              </div>
            </div>
          </div>

          {/* Community Network */}
          <div className="mt-12 text-center">
            <h3 className="text-2xl font-bold mb-4">JOIN THE COMMUNITY NETWORK</h3>
            <p className="text-lg mb-6 max-w-3xl mx-auto">
              Connect with 150+ practitioners across Australia implementing similar programs. 
              Share challenges, celebrate successes, and learn from each other's experiences.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="data-card text-center">
                <Users className="h-8 w-8 mx-auto mb-4" />
                <h4 className="font-bold mb-2">Peer Learning Groups</h4>
                <p className="text-sm mb-4">Monthly online meetups for program managers and practitioners</p>
                <button className="cta-secondary w-full text-sm">JOIN GROUP</button>
              </div>
              
              <div className="data-card text-center">
                <MessageCircle className="h-8 w-8 mx-auto mb-4" />
                <h4 className="font-bold mb-2">Community Forum</h4>
                <p className="text-sm mb-4">24/7 support network for questions, advice, and resource sharing</p>
                <button className="cta-secondary w-full text-sm">ACCESS FORUM</button>
              </div>
              
              <div className="data-card text-center">
                <Calendar className="h-8 w-8 mx-auto mb-4" />
                <h4 className="font-bold mb-2">Training Events</h4>
                <p className="text-sm mb-4">Workshops, webinars, and site visits throughout the year</p>
                <button className="cta-secondary w-full text-sm">VIEW EVENTS</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section-padding bg-black text-white">
        <div className="container-justice text-center">
          <h2 className="headline-truth mb-8">
            This works.<br />
            Your community deserves it.<br />
            Let's make it happen.
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href={`mailto:${caseStudy.contact.program_director.email}?subject=Implementing ${caseStudy.name} model`}
              className="inline-block bg-white text-black px-8 py-4 font-bold uppercase tracking-wider hover:bg-gray-100"
            >
              START YOUR PROGRAM
            </a>
            <Link href="/grassroots" className="inline-block border-2 border-white px-8 py-4 font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all">
              EXPLORE MORE SOLUTIONS
            </Link>
          </div>
        </div>
      </section>
      </main>

      {/* Unified Footer */}
      <Footer />
    </div>
  );
}