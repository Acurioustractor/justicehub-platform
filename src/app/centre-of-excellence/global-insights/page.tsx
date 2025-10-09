'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Globe,
  ArrowLeft,
  ExternalLink,
  Download,
  BookOpen,
  Award,
  TrendingDown,
  Users,
  Heart,
  Shield,
  Scale,
  MapPin,
  ChevronRight,
  FileText,
  Video
} from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';

// International model interface
interface InternationalModel {
  id: string;
  country: string;
  modelName: string;
  tagline: string;
  overview: string;
  keyPrinciples: string[];
  outcomes: {
    metric: string;
    value: string;
    context: string;
  }[];
  strengths: string[];
  challenges: string[];
  applicableToAustralia: string[];
  resources: {
    title: string;
    type: 'research' | 'video' | 'report' | 'policy';
    url: string;
    description: string;
  }[];
  featured?: boolean;
}

// Data for international models
const INTERNATIONAL_MODELS: InternationalModel[] = [
  {
    id: 'new-zealand-oranga-tamariki',
    country: 'New Zealand',
    modelName: 'Oranga Tamariki - Family Group Conferencing',
    tagline: 'Considered internationally as New Zealand\'s "gift to the world"',
    overview: 'New Zealand\'s youth justice system uses Family Group Conferences (FGC) as the cornerstone of its approach, bringing together young people, their whānau (family), victims, and support people to develop solutions that address both offending and underlying needs. The system prioritizes diversion, cultural connections, and family-led decision making.',
    keyPrinciples: [
      'Family-led decision making through FGC process',
      'Diversion from formal court processes wherever possible',
      'Cultural responsiveness, particularly for Māori youth',
      'Victim participation and restorative outcomes',
      'Addressing underlying causes, not just offending behavior',
      'Youth development and reintegration focus'
    ],
    outcomes: [
      {
        metric: 'Victim Satisfaction',
        value: '86%',
        context: 'of victims satisfied with restorative justice conference they attended'
      },
      {
        metric: 'Recommendation Rate',
        value: '84%',
        context: 'would recommend restorative justice to others in similar situation'
      },
      {
        metric: 'Diversion Success',
        value: 'Majority',
        context: 'of young offenders diverted from courts and custody successfully'
      }
    ],
    strengths: [
      'Strong evidence base with decades of evaluation',
      'Internationally recognized and adopted model',
      'High victim and participant satisfaction rates',
      'Cultural integration, particularly for Indigenous youth',
      'Family empowerment and ownership of solutions',
      'Successful diversion from formal justice system'
    ],
    challenges: [
      'Quality and implementation variability across regions',
      'Some practices show delays and communication issues',
      'Instances where young people felt disempowered',
      'Recent legislative changes introducing more punitive responses (2024)',
      'Not all wellbeing goals achieved consistently',
      'Resource intensive model requiring skilled facilitators'
    ],
    applicableToAustralia: [
      'FGC model highly compatible with Indigenous justice approaches',
      'Already partially adopted in some Australian jurisdictions',
      'Strong alignment with restorative justice principles',
      'Family engagement frameworks could be strengthened',
      'Victim participation mechanisms could be enhanced',
      'Cultural adaptation needed for Australian context'
    ],
    resources: [
      {
        title: 'Youth Justice in New Zealand: Restorative Justice in Practice (2006)',
        type: 'research',
        url: 'https://spssi.onlinelibrary.wiley.com/doi/abs/10.1111/j.1540-4560.2006.00449.x',
        description: 'Landmark study by Gabrielle Maxwell examining NZ\'s restorative justice through FGC'
      },
      {
        title: 'Revisiting New Zealand\'s "Gift to the World" (2025)',
        type: 'research',
        url: 'https://www.tandfonline.com/doi/full/10.1080/10282580.2025.2519736',
        description: 'Critical examination demythologizing youth justice FGC in Aotearoa'
      },
      {
        title: 'Oranga Tamariki - Youth Justice',
        type: 'policy',
        url: 'https://www.orangatamariki.govt.nz/youth-justice/',
        description: 'Official NZ Ministry information on youth justice system'
      },
      {
        title: 'Youth Justice Custody: Updated Trends and Outlook 2024',
        type: 'report',
        url: 'https://www.orangatamariki.govt.nz/about-us/research/our-research/youth-justice-custody-updated-trends-and-outlook-2024/',
        description: 'Latest data on custody trends and forecast to June 2025'
      }
    ],
    featured: true
  },
  {
    id: 'scotland-childrens-hearings',
    country: 'Scotland',
    modelName: 'Children\'s Hearings System',
    tagline: 'Welfare-based approach where children who offend are treated as children in need',
    overview: 'Scotland\'s Children\'s Hearings System, established following the Kilbrandon Report (1963), takes an integrated holistic approach where care and justice decisions prioritize the child\'s best interests. The system treats children who offend and those needing care and protection as equally deserving of support, operating on "maximum diversion–minimum intervention" principles.',
    keyPrinciples: [
      'Child\'s best interests as paramount consideration',
      'Welfare-based approach integrating care and justice',
      'Maximum diversion, minimum intervention philosophy',
      'Panel-based hearings (not courts) for under-16s',
      'Family and community involvement in decisions',
      'Rights-based practice at heart of service delivery',
      'Understanding needs drive deeds (offending linked to unmet needs)'
    ],
    keyPrinciples: [
      'Child\'s best interests as paramount consideration',
      'Welfare-based approach integrating care and justice',
      'Maximum diversion, minimum intervention philosophy',
      'Panel-based hearings (not courts) for under-16s',
      'Family and community involvement in decisions',
      'Rights-based practice at heart of service delivery'
    ],
    outcomes: [
      {
        metric: 'Age of Criminal Responsibility',
        value: '12 years',
        context: 'Raised from 8 to 12 years in 2019, among highest in Europe'
      },
      {
        metric: 'Restorative Justice Participation',
        value: '56%',
        context: 'of those contacted took part in restorative process (Glasgow evaluation)'
      },
      {
        metric: 'Satisfaction',
        value: 'High',
        context: 'levels among participants in restorative processes'
      }
    ],
    strengths: [
      'Over 50 years of operation and refinement',
      'Avoids criminalizing children through traditional courts',
      'Integrated approach addresses care and justice needs together',
      'Strong rights-based framework since 2024 reforms',
      'Evidence that diversion reduces stigmatization',
      'Dedicated Centre for Youth and Criminal Justice at University of Strathclyde'
    ],
    challenges: [
      'Variable quality in Family Group Conferencing practices',
      'Some delays and communication breakdowns reported',
      'Balancing welfare and accountability can be complex',
      'Resource constraints in some regions',
      'Limited research on long-term recidivism outcomes',
      'Need for continuous quality improvement'
    ],
    applicableToAustralia: [
      'Whole System Approach model highly transferable',
      'Panel-based alternative to youth courts worth exploring',
      'Integration of care and justice systems needed in Australia',
      'Rights-based standards could strengthen Australian practice',
      'Early intervention emphasis aligns with Australian priorities',
      'University research partnership model replicable'
    ],
    resources: [
      {
        title: 'Children\'s Hearings System Overview',
        type: 'policy',
        url: 'https://www.chscotland.gov.uk/what-we-do/the-children-s-hearings-system/',
        description: 'Official information on how the system works'
      },
      {
        title: 'A Guide to Youth Justice in Scotland: Policy, Practice and Legislation',
        type: 'report',
        url: 'https://www.cycj.org.uk/wp-content/uploads/2019/06/2019-Section-1.pdf',
        description: 'Comprehensive guide from Centre for Youth & Criminal Justice'
      },
      {
        title: 'Understanding the Implications of Children\'s Rights for Scottish Youth Justice',
        type: 'research',
        url: 'https://www.iriss.org.uk/resources/insights/understanding-implications-childrens-rights-scottish-youth-justice',
        description: 'Analysis of rights-based approach in practice'
      },
      {
        title: 'Justice for Children and Young People: Vision and Priorities 2024-26',
        type: 'policy',
        url: 'https://www.gov.scot/publications/justice-children-young-people-vision-priorities-2024-26/',
        description: 'Latest Scottish Government strategic priorities'
      }
    ],
    featured: true
  },
  {
    id: 'nordic-welfare-model',
    country: 'Nordic Countries',
    modelName: 'Nordic Welfare-Based Youth Justice Model',
    tagline: 'Minimal incarceration, maximum social support - only 4 youth in custody across all of Finland',
    overview: 'The Nordic countries (Norway, Sweden, Finland, Denmark) share a distinctive welfare-based approach to youth justice characterized by extremely low incarceration rates, high age of criminal responsibility (15), integration with robust social services, and emphasis on rehabilitation over punishment. The strength of Nordic welfare states provides universal education, healthcare, and economic security that prevents youth justice involvement.',
    keyPrinciples: [
      'Statutory presumption against confinement',
      'High age of criminal responsibility (15, except Denmark)',
      'Active collaboration between justice and child welfare systems',
      'No specialized juvenile courts - welfare-led responses',
      'Universal social programs prevent justice involvement',
      'Highly trained correctional staff (2 years training in Norway)',
      'Barnahus model for child victims/witnesses'
    ],
    outcomes: [
      {
        metric: 'Youth Incarceration (Finland)',
        value: 'Only 4 youth',
        context: 'in custody across entire country of 5.5 million people (ages 15-17)'
      },
      {
        metric: 'Staff Training (Norway)',
        value: '2 years',
        context: 'of specialized training before working in correctional facilities'
      },
      {
        metric: 'Recidivism Reduction',
        value: 'Significant',
        context: 'through Multisystemic Therapy (MST) programs in Norway'
      }
    ],
    strengths: [
      'Lowest youth incarceration rates globally',
      'Strong welfare state prevents justice system entry',
      'Highly professionalized and trained staff',
      'Evidence-based interventions like MST widely used',
      'Barnahus model provides child-friendly justice',
      'Focus on communication and conflict resolution over force',
      'Universal social programs address root causes'
    ],
    challenges: [
      'High cost model requiring substantial public investment',
      'Some use of pre-trial solitary confinement criticized',
      'Nordic exceptionalism narrative sometimes overstated',
      'Cultural and structural factors difficult to replicate',
      'Less applicable to diverse, large countries',
      'Requires strong welfare state infrastructure'
    ],
    applicableToAustralia: [
      'Welfare integration principles highly relevant',
      'MST programs already showing promise in Australia',
      'Barnahus model applicable for child protection cases',
      'Staff training standards could be significantly raised',
      'Investment in prevention through social programs needed',
      'Could pilot in states with stronger welfare systems first'
    ],
    resources: [
      {
        title: 'Nordic Youth Justice: Crime and Justice Vol 40',
        type: 'research',
        url: 'https://www.journals.uchicago.edu/doi/10.1086/661113',
        description: 'Comprehensive academic examination of Nordic youth justice models'
      },
      {
        title: 'Confinement and Restrictive Measures in Nordic Countries (2022)',
        type: 'research',
        url: 'https://www.tandfonline.com/doi/full/10.1080/2578983X.2022.2054536',
        description: 'Comparative analysis of Denmark, Finland, Norway, and Sweden'
      },
      {
        title: 'Building Justice through Humanity: How Scandinavia\'s Prisons Changed Me',
        type: 'report',
        url: 'https://impactjustice.org/building-justice-through-humanity-how-scandinavias-prisons-changed-me/',
        description: 'Reflective analysis of Nordic correctional approach'
      },
      {
        title: 'The Nordic Barnahus Model',
        type: 'policy',
        url: 'https://nordicwelfare.org/en/nyheter/the-nordic-barnahus-model-examined-in-new-book/',
        description: 'Child-friendly justice model for victims and witnesses'
      }
    ],
    featured: true
  },
  {
    id: 'canadian-ycja',
    country: 'Canada',
    modelName: 'Youth Criminal Justice Act (YCJA)',
    tagline: 'Two decades of evidence showing significant reductions in detention through diversion and community responses',
    overview: 'Canada\'s Youth Criminal Justice Act (YCJA), enacted in 2002, emphasizes rehabilitation, proportionality, and community-based responses. The Act requires consideration of all alternatives before custody, promotes extrajudicial measures (diversion), and has achieved significant reductions in youth detention while maintaining public safety. However, ongoing challenges persist with overrepresentation of Indigenous and Black youth.',
    keyPrinciples: [
      'Rehabilitation and reintegration as primary goals',
      'Proportionality - response matches seriousness of offence',
      'Enhanced procedural protections for youth',
      'Extrajudicial measures (diversion) as first response',
      'Community-based sanctions preferred over custody',
      'Separate youth justice system recognizing developmental differences',
      'Timely intervention and meaningful consequences'
    ],
    outcomes: [
      {
        metric: 'Youth Crime Rate',
        value: 'Significant decrease',
        context: 'in police-reported youth crime rate over two decades'
      },
      {
        metric: 'Diversion Use',
        value: 'Increased',
        context: 'substantial increase in use of diversion and community responses'
      },
      {
        metric: 'Custody Reduction',
        value: 'Reduced',
        context: 'significant reduction in use of detention and custody for youth'
      }
    ],
    strengths: [
      'Comprehensive legislative framework with clear principles',
      '20+ years of implementation and evaluation data',
      'Strong emphasis on rehabilitation over punishment',
      'Procedural protections ensure fair treatment',
      'Evidence of reduced custody and increased diversion',
      'Community-based alternatives well-developed',
      'Regular monitoring through performance indicators'
    ],
    challenges: [
      'Persistent overrepresentation of Indigenous youth',
      'Ongoing unfair treatment of Black youth in system',
      'Court processing times have increased (2017-2022)',
      'Regional variation in implementation quality',
      'Not all youth benefited equally from YCJA reforms',
      'Complexity of legislation creates implementation challenges'
    ],
    applicableToAustralia: [
      'Legislative framework model for national consistency',
      'Diversion mechanisms highly transferable',
      'Rehabilitation focus aligns with Australian priorities',
      'Performance indicator framework useful for monitoring',
      'Must address Indigenous overrepresentation more effectively',
      'Community-based alternatives proven effective'
    ],
    resources: [
      {
        title: 'State of the Criminal Justice System: A Focus on Youth (2024)',
        type: 'report',
        url: 'https://www.justice.gc.ca/eng/cj-jp/state-etat/2024rpt-rap2024/pdf/RSD2024_State_of_the_Criminal_Justice_System_Report_A_focus_on_youth_En.pdf',
        description: 'Latest comprehensive report on YCJA outcomes and performance'
      },
      {
        title: 'Youth Criminal Justice Act - Full Text',
        type: 'policy',
        url: 'https://laws-lois.justice.gc.ca/eng/acts/Y-1.5/',
        description: 'Complete legislation with all amendments'
      },
      {
        title: 'Supporting Positive Outcomes for Youth Involved with the Law',
        type: 'research',
        url: 'https://youthrex.com/report/supporting-positive-outcomes-for-youth-involved-with-the-law/',
        description: 'Youth Research and Evaluation eXchange analysis'
      },
      {
        title: 'Evolution of Canada\'s Youth Criminal Justice System',
        type: 'report',
        url: 'https://www.justice.gc.ca/socjs-esjp/en/Youth/ecyc',
        description: 'Interactive dashboard tracking system evolution'
      }
    ],
    featured: true
  },
  {
    id: 'spain-diagrama-foundation',
    country: 'Spain',
    modelName: 'Diagrama Foundation - Love & Boundaries Model',
    tagline: '13.6% recidivism vs 80-96% traditional - 40,000+ young lives transformed over 35 years',
    overview: 'Diagrama Foundation, established in Spain in 1991, pioneered the "Love & Boundaries" therapeutic model that combines unconditional care with clear, consistent boundaries. Operating 210+ centers across Spain serving 20,000+ people annually, Diagrama\'s 5-stage progressive intervention model emphasizes education (30+ hours weekly), qualified social educators as mentors, and culturally responsive programs. The model has achieved exceptional outcomes with 13.6% recidivism (vs 80-96% in traditional systems), 98% program completion, zero youth suicides, and 70%+ employment/education placement within 6 months.',
    keyPrinciples: [
      '"Love & Boundaries" - unconditional care with consistent structure',
      '5-stage progressive model: Reception → Stabilisation → Development → Autonomy → Integration',
      '30+ hours of formal education and vocational training weekly',
      'Qualified "social educators" serving as mentors, not guards',
      'Re-education centers, not prisons - normalized living environments',
      'Culturally responsive programs adaptable to local contexts',
      'Comprehensive psychosocial support and counselling',
      'Structured community reintegration support'
    ],
    outcomes: [
      {
        metric: 'Recidivism Rate',
        value: '13.6%',
        context: 'within 6 years, compared to 80-96% in traditional detention systems'
      },
      {
        metric: 'Program Completion',
        value: '98%',
        context: 'of youth successfully complete the full intervention program'
      },
      {
        metric: 'Youth Transformed',
        value: '40,000+',
        context: 'young lives positively impacted since 1991 (35 years of operation)'
      },
      {
        metric: 'Employment/Education Placement',
        value: '70%+',
        context: 'secure employment or continue education within 6 months of exit'
      },
      {
        metric: 'Youth Suicides',
        value: 'Zero',
        context: 'no reported youth suicides in Diagrama facilities in Spain'
      }
    ],
    strengths: [
      'Exceptional recidivism outcomes (13.6% vs 80-96% traditional)',
      '35 years of proven results with 40,000+ youth',
      '98% program completion rate demonstrates engagement',
      'Zero youth suicides shows safe, supportive environment',
      'Cost-effective: €70,000 annually per youth',
      'Internationally recognized - UN special consultative status',
      'Successfully replicated in UK, Australia, and other countries',
      'Strong educational focus (30+ hours weekly)',
      'Positive relationships emphasized over control',
      'No use of mechanical restraints or isolation'
    ],
    challenges: [
      'Requires significant cultural shift from punitive to therapeutic',
      'High staff training requirements (qualified social educators)',
      'Resource intensive model requiring sustained investment',
      'Quality dependent on fidelity to model principles',
      'Takes time to show results (multi-year intervention)',
      'Can be difficult to scale while maintaining quality',
      'Requires buy-in from entire justice system',
      'Adaptation to different cultural contexts requires care'
    ],
    applicableToAustralia: [
      'Model being piloted in Northern Territory (Blueprint for Change)',
      'Aligns with therapeutic approaches gaining traction in Australia',
      'Educational focus compatible with Australian priorities',
      'Cultural adaptability critical for Indigenous youth',
      '5-stage model provides clear implementation framework',
      'Proven cost-effectiveness attractive for resource-constrained systems',
      'Social educator model could professionalize Australian youth work',
      'International Juvenile Justice Observatory provides technical support'
    ],
    resources: [
      {
        title: 'Blueprint for Change: Diagrama Foundation Report (Northern Territory)',
        type: 'report',
        url: 'https://ddhs.org.au/sites/default/files/media-library/documents/Blueprint for Change - Diagrama Foundation Report FINAL.pdf',
        description: 'Comprehensive report on adapting Diagrama model to NT context following 2019 visit'
      },
      {
        title: 'From Punishment to Potential: Lessons from Spain\'s Innovative Youth Justice Model',
        type: 'research',
        url: 'https://www.justiceco-lab.com/article/from-punishment-to-potential-lessons-from-spains-innovative-youth-justice-model---day-1-with-diagrama',
        description: 'Analysis of Diagrama\'s transformative approach to youth justice'
      },
      {
        title: 'International Juvenile Justice Observatory (IJJO)',
        type: 'policy',
        url: 'https://www.oijj.org/en',
        description: 'Diagrama-founded observatory promoting juvenile justice system improvements globally'
      },
      {
        title: 'BBC Documentary: Diagrama\'s Youth Custodial Centres in Spain',
        type: 'video',
        url: 'https://www.diagramafoundation.org.uk/national-news/bbc-visits-diagramas-youth-custodial-centres-spain-learn-more-about-its-reeducational',
        description: 'Video documentary exploring Diagrama\'s re-educational model in practice'
      },
      {
        title: 'Diagrama Foundation UK - International Area',
        type: 'policy',
        url: 'https://diagramafoundation.org.uk/international-area',
        description: 'Information on Diagrama\'s international expansion and adaptation'
      },
      {
        title: 'Diagrama Australia - Model Overview',
        type: 'policy',
        url: 'https://www.diagramaaustralia.org/',
        description: 'Australian implementation and adaptation of Diagrama model'
      }
    ],
    featured: true
  },
  {
    id: 'usa-missouri-model',
    country: 'United States',
    modelName: 'The Missouri Model of Juvenile Rehabilitation',
    tagline: '24% recidivism vs 43-52% in other states - small therapeutic facilities instead of large prisons',
    overview: 'The Missouri Division of Youth Services (DYS) pioneered a revolutionary shift from large correctional facilities to small cottage-style residential programs emphasizing rehabilitation over punishment. Beginning in the 1980s and expanding over three decades, Missouri transformed its entire juvenile offender system with facilities housing no more than 50 youth (average 20), applying therapeutic group treatment processes, improved staff supervision, enhanced academic services, greater family involvement, and robust community transition support.',
    keyPrinciples: [
      'Small facilities closer to home (max 50 youth, average 20)',
      'Therapeutic group treatment processes throughout',
      'Closely supervised small groups with positive peer relationships',
      'Rigorous group treatment emphasizing behavior change',
      'Enhanced academic services and educational focus',
      'Greater involvement by family members in treatment',
      'Improved support for youth transitioning to community',
      'Rehabilitation over punishment philosophy'
    ],
    outcomes: [
      {
        metric: 'Recidivism Rate',
        value: '24%',
        context: 'reincarcerated within 3 years, vs 43% (Texas) and 52% (Arizona)'
      },
      {
        metric: 'Community Engagement',
        value: '85.3%',
        context: 'of youth actively and positively engaged in community after exit (2008)'
      },
      {
        metric: 'Safety Record',
        value: 'Zero suicides',
        context: 'no youth suicides since training schools were closed'
      },
      {
        metric: 'Restraint Use',
        value: 'Minimal',
        context: 'mechanical restraints and isolation rarely used'
      },
      {
        metric: 'Violence',
        value: 'Very few',
        context: 'assaults on youth or staff reported'
      }
    ],
    strengths: [
      'Dramatically lower recidivism than comparable states (24% vs 43-52%)',
      '85% of youth positively engaged in community post-exit',
      'Zero youth suicides demonstrates safe environment',
      'Small facilities (20-50 youth) enable relationships',
      'Minimal use of restraints and isolation',
      'Very low violence rates for youth and staff',
      'Strong family involvement in treatment process',
      'Being replicated in Washington DC, San Jose, New Mexico, Louisiana',
      'Only outside evaluation (Annie E. Casey Foundation) confirmed effectiveness',
      'Therapeutic treatment model proven to reduce recidivism'
    ],
    challenges: [
      'Only one independent outside assessment conducted',
      'Limited rigorous academic evaluation compared to other models',
      'Requires significant cultural shift from punitive approach',
      'Quality depends on maintaining small facility sizes',
      'Family involvement can be challenging for some youth',
      'Replication in other states shows mixed results',
      'Resource intensive model requiring sustained investment',
      'Takes time to show outcomes (multi-year intervention)'
    ],
    applicableToAustralia: [
      'Small facility model (20-50 youth) highly transferable',
      'Therapeutic group treatment aligns with Australian priorities',
      'Family involvement compatible with Australian values',
      'Academic services emphasis matches educational focus',
      'Community transition support needed in Australia',
      'Low recidivism outcomes demonstrate effectiveness',
      'Could be piloted in specific states/territories',
      'Minimal restraint approach suits Australian context'
    ],
    resources: [
      {
        title: 'The Missouri Model of Juvenile Rehabilitation',
        type: 'report',
        url: 'https://www.aecf.org/resources/the-missouri-model',
        description: 'Annie E. Casey Foundation comprehensive overview of the model'
      },
      {
        title: 'Missouri Model: Reinventing the Practice of Rehabilitating Youthful Offenders',
        type: 'research',
        url: 'https://www.ojp.gov/ncjrs/virtual-library/abstracts/missouri-model-reinventing-practice-rehabilitating-youthful',
        description: 'Office of Justice Programs summary report on model effectiveness'
      },
      {
        title: 'Appendix B: The Missouri Model - Critical State of Knowledge',
        type: 'research',
        url: 'https://nap.nationalacademies.org/read/14685/chapter/16',
        description: 'National Academies Press detailed analysis and evaluation'
      },
      {
        title: 'Strengthening the Missouri Model of Juvenile Justice',
        type: 'research',
        url: 'https://digitalcommons.lindenwood.edu/cgi/viewcontent.cgi?article=1002&context=mpj',
        description: 'Staff perspective on model implementation and improvements'
      },
      {
        title: 'Taking a Therapeutic Approach to Juvenile Offenders: The Missouri Model',
        type: 'case-study',
        url: 'https://case.hks.harvard.edu/taking-a-therapeutic-approach-to-juvenile-offenders-the-missouri-model/',
        description: 'Harvard Kennedy School case study on therapeutic approach'
      }
    ],
    featured: true
  }
];

export default function GlobalInsightsPage() {
  const [expandedModel, setExpandedModel] = useState<string | null>(null);

  const toggleModel = (modelId: string) => {
    setExpandedModel(expandedModel === modelId ? null : modelId);
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'research': return <BookOpen className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'report': return <FileText className="h-4 w-4" />;
      case 'policy': return <Scale className="h-4 w-4" />;
      default: return <ExternalLink className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="header-offset">
        {/* Header */}
        <section className="section-padding bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 border-b-2 border-black">
          <div className="container-justice">
            <Link
              href="/centre-of-excellence"
              className="inline-flex items-center gap-2 font-bold text-gray-700 hover:text-black mb-6 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Centre of Excellence
            </Link>

            <div className="inline-block px-4 py-2 bg-purple-100 border-2 border-black mb-6">
              <span className="font-bold">GLOBAL INSIGHTS</span>
            </div>

            <h1 className="headline-truth mb-6">
              International Best Practice Models
            </h1>

            <p className="text-xl text-gray-700 max-w-4xl mb-6 leading-relaxed">
              Learning from the world's most effective youth justice systems. These jurisdictions demonstrate proven approaches to reducing incarceration, improving outcomes, and treating young people with dignity and respect.
            </p>

            {/* Map Link */}
            <div className="mb-8">
              <Link
                href="/centre-of-excellence/map"
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-bold hover:bg-purple-700 transition-all"
              >
                <MapPin className="h-5 w-5" />
                View International Models on Global Map
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="border-2 border-black p-6 bg-white text-center">
                <TrendingDown className="h-10 w-10 mx-auto mb-3 text-green-600" />
                <div className="text-3xl font-bold mb-1">13.6%</div>
                <div className="text-sm text-gray-600">Diagrama Spain recidivism vs 80-96% traditional</div>
              </div>
              <div className="border-2 border-black p-6 bg-white text-center">
                <Heart className="h-10 w-10 mx-auto mb-3 text-red-600" />
                <div className="text-3xl font-bold mb-1">86%</div>
                <div className="text-sm text-gray-600">Victim satisfaction in NZ restorative justice</div>
              </div>
              <div className="border-2 border-black p-6 bg-white text-center">
                <Users className="h-10 w-10 mx-auto mb-3 text-blue-600" />
                <div className="text-3xl font-bold mb-1">Only 4</div>
                <div className="text-sm text-gray-600">Youth in custody across all of Finland</div>
              </div>
              <div className="border-2 border-black p-6 bg-white text-center">
                <Shield className="h-10 w-10 mx-auto mb-3 text-purple-600" />
                <div className="text-3xl font-bold mb-1">Age 12</div>
                <div className="text-sm text-gray-600">Scotland's criminal responsibility age (raised from 8)</div>
              </div>
              <div className="border-2 border-black p-6 bg-white text-center">
                <Award className="h-10 w-10 mx-auto mb-3 text-yellow-600" />
                <div className="text-3xl font-bold mb-1">24%</div>
                <div className="text-sm text-gray-600">Missouri Model recidivism vs 43-52% other states</div>
              </div>
            </div>
          </div>
        </section>

        {/* International Models */}
        <section className="section-padding">
          <div className="container-justice">
            <div className="space-y-8">
              {INTERNATIONAL_MODELS.map((model) => (
                <div
                  key={model.id}
                  className="border-2 border-black bg-white hover:shadow-brutal transition-all"
                >
                  {/* Model Header */}
                  <div className="p-6 border-b-2 border-black bg-gray-50">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <MapPin className="h-6 w-6" />
                          <span className="text-sm font-bold text-gray-600 uppercase tracking-wider">
                            {model.country}
                          </span>
                          {model.featured && (
                            <span className="px-3 py-1 bg-yellow-400 text-xs font-bold">FEATURED</span>
                          )}
                        </div>
                        <h2 className="text-3xl font-bold mb-2">{model.modelName}</h2>
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

                  {/* Outcomes Summary */}
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
                      {/* Key Principles */}
                      <div className="p-6 bg-white border-b-2 border-black">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                          <Scale className="h-6 w-6" />
                          Key Principles
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {model.keyPrinciples.map((principle, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <ChevronRight className="h-5 w-5 flex-shrink-0 mt-0.5 text-blue-600" />
                              <span className="text-gray-700">{principle}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Strengths & Challenges */}
                      <div className="p-6 bg-white border-b-2 border-black">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* Strengths */}
                          <div>
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-700">
                              <Award className="h-6 w-6" />
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

                          {/* Challenges */}
                          <div>
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-orange-700">
                              <Shield className="h-6 w-6" />
                              Challenges & Limitations
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

                      {/* Applicable to Australia */}
                      <div className="p-6 bg-yellow-50 border-b-2 border-black">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                          <MapPin className="h-6 w-6" />
                          Applicable to Australia
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {model.applicableToAustralia.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <Heart className="h-5 w-5 flex-shrink-0 mt-0.5 text-red-600" />
                              <span className="text-gray-700">{item}</span>
                            </div>
                          ))}
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
                                  {getResourceIcon(resource.type)}
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

        {/* Add Your Research CTA */}
        <section className="section-padding bg-gradient-to-br from-blue-400 to-purple-400 border-t-2 border-black">
          <div className="container-justice text-center">
            <Globe className="h-16 w-16 mx-auto mb-6 text-white" />
            <h2 className="headline-truth mb-6 text-white">Know of International Best Practice?</h2>
            <p className="text-xl text-white max-w-3xl mx-auto mb-8 leading-relaxed">
              Have you seen effective youth justice models in other countries? Help us build Australia's most comprehensive international evidence base by sharing research, reports, or your observations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="px-8 py-4 bg-white text-black font-bold hover:bg-gray-100 transition-all inline-flex items-center justify-center gap-2"
              >
                <FileText className="h-5 w-5" />
                Submit International Research
              </Link>
              <Link
                href="/centre-of-excellence/research"
                className="px-8 py-4 border-2 border-white text-white font-bold hover:bg-white hover:text-black transition-all inline-flex items-center justify-center gap-2"
              >
                <BookOpen className="h-5 w-5" />
                Browse Research Library
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
