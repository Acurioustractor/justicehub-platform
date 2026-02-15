import Link from 'next/link';
import { Metadata } from 'next';
import { Navigation, Footer } from '@/components/ui/navigation';
import { 
  ArrowRight,
  Accessibility,
  Brain,
  AlertCircle,
  FileText,
  Phone,
  MapPin,
  Users,
  Heart,
  ChevronRight,
  ExternalLink,
  BookOpen,
  Stethoscope,
  Scale,
  Globe
} from 'lucide-react';

export const metadata = {
  title: 'Disability & Youth Justice | JusticeHub',
  description: '60-80% of young people in custody have disability. Understand the hidden epidemic, find services, and read lived experience stories.',
};

// Key statistics for the page
const keyStats = [
  { value: '60-80%', label: 'Of youth in custody have disability', source: 'AIHW Youth Justice 2023-24' },
  { value: '10-20%', label: 'May have FASD (only 2% diagnosed)', source: 'Young People in Custody Health Survey' },
  { value: '4-5x', label: 'More likely to have intellectual disability', source: 'NSW Law Reform Commission' },
  { value: '88%', label: 'Show mental health symptoms', source: 'Victorian Youth Parole Board' },
];

// Types of disability covered
const disabilityTypes = [
  {
    title: 'Intellectual Disability',
    description: 'Significant limitations in intellectual functioning and adaptive behaviour. 10-15% of youth in custody vs 2-3% general population.',
    challenges: ['Difficulty understanding court processes', 'Suggestibility in police interviews', 'Challenges with bail conditions'],
  },
  {
    title: 'FASD (Fetal Alcohol Spectrum Disorder)',
    description: 'Brain-based disability caused by prenatal alcohol exposure. Often misinterpreted as defiance or non-compliance.',
    challenges: ['Impulsivity and poor judgment', 'Difficulty learning from consequences', 'Memory and communication challenges'],
  },
  {
    title: 'Acquired Brain Injury',
    description: 'Brain damage from trauma, assault, accidents, or substance use. Common in populations with high violence exposure.',
    challenges: ['Behavioural regulation difficulties', 'Cognitive processing impairments', 'Emotional dysregulation'],
  },
  {
    title: 'Neurodevelopmental Differences',
    description: 'Autism, ADHD, and related conditions affecting how young people process information and interact.',
    challenges: ['Sensory overwhelm in justice settings', 'Literal interpretation of language', 'Social communication difficulties'],
  },
];

// The pathway from disability to justice
const pathwaySteps = [
  {
    stage: 'Early Life',
    issue: 'Missed or Late Diagnosis',
    description: 'Disabilities often not identified in childhood. Behaviours misinterpreted as "naughty" or "difficult".',
    stat: 'Many enter school without diagnosis',
  },
  {
    stage: 'School',
    issue: 'School Exclusion',
    description: 'Undiagnosed disabilities lead to suspension, expulsion, and disengagement from education.',
    stat: '50%+ in custody were suspended/expelled',
  },
  {
    stage: 'Police Contact',
    issue: 'Misinterpreted Behaviour',
    description: 'Disability-related behaviours seen as defiance, intoxication, or non-compliance.',
    stat: 'Cognitive impairment rarely recognised',
  },
  {
    stage: 'Court',
    issue: 'Proceedings Without Understanding',
    description: 'Young people agree to charges, conditions, and pleas they don\'t comprehend.',
    stat: '34% show intellectual deficits in court',
  },
  {
    stage: 'Detention',
    issue: 'Inappropriate Environment',
    description: 'Facilities not designed for neurodiversity. Behaviour managed punitively.',
    stat: 'Diagnosis often happens here—too late',
  },
];

// Services needed (to be populated from database)
const serviceCategories = [
  {
    title: 'Assessment & Diagnosis',
    icon: <Stethoscope className="w-6 h-6" />,
    description: 'Cognitive assessment, FASD diagnosis, psychological evaluation',
    examples: ['Youth Justice Psychology Services', 'FASD Hub Australia', 'Developmental assessment clinics'],
  },
  {
    title: 'Legal Support',
    icon: <Scale className="w-6 h-6" />,
    description: 'Disability-aware legal aid, communication support, diversion advocacy',
    examples: ['Intellectual Disability Rights Service', 'Disability advocacy in court', 'Communication partners'],
  },
  {
    title: 'NDIS Navigation',
    icon: <Users className="w-6 h-6" />,
    description: 'Support coordination, plan management, justice pathway access',
    examples: ['Specialist support coordination', 'Justice-specific NDIS planners', 'Plan review advocacy'],
  },
  {
    title: 'Therapeutic Support',
    icon: <Heart className="w-6 h-6" />,
    description: 'FASD-informed therapy, behaviour support, skills development',
    examples: ['Occupational therapy', 'Speech pathology', 'Positive behaviour support'],
  },
];

// Lived experience stories (from compendium)
const stories = [
  {
    title: 'The Hidden Epidemic',
    type: 'Research Synthesis',
    description: 'Comprehensive analysis of disability in Australian youth justice—statistics, Royal Commission progress, and personal stories.',
    link: '/stories',
  },
  {
    title: 'A: From Guarded to Self-Advocate',
    type: 'Lived Experience',
    description: 'Through sustained community support, a young person learned to articulate their own needs and advocate for themselves.',
    link: '/stories',
  },
  {
    title: 'Brodie Germaine\'s Journey',
    type: 'System Change',
    description: 'From housing commission kid to national advocate—transformation through connection and community support.',
    link: '/stories',
  },
];

// Royal Commission status
const royalCommissionStatus = [
  { state: 'South Australia', status: 'completed', detail: 'CAIDS-Q screening tool in use' },
  { state: 'Victoria', status: 'in_progress', detail: '14-day screening protocol established' },
  { state: 'Queensland', status: 'in_progress', detail: 'Neurodevelopmental Disability Framework' },
  { state: 'NSW', status: 'in_progress', detail: 'Acknowledges need for culturally validated tools' },
  { state: 'NT', status: 'in_progress', detail: 'Specialist Assessment Team in place' },
  { state: 'WA', status: 'in_progress', detail: 'Service model development commenced' },
  { state: 'ACT', status: 'in_progress', detail: 'TIRA tool for reasonable adjustments' },
  { state: 'Tasmania', status: 'in_progress', detail: 'Reviewing Youth Justice Admissions policy' },
];

export default function DisabilityThemePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <main id="main-content" className="header-offset">
      {/* Hero */}
      <section className="bg-gradient-to-br from-ochre-600 via-ochre-500 to-earth-700 text-white py-20 border-b-2 border-black">
        <div className="container-justice max-w-5xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-white/20 backdrop-blur rounded-lg">
              <Accessibility className="w-8 h-8" />
            </div>
            <span className="text-sm font-bold uppercase tracking-wider text-white/80">
              Thematic Focus
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-black mb-6">
            Disability & Justice
          </h1>

          <p className="text-xl text-white/90 max-w-3xl mb-8">
            The vast majority of children in detention live with disability—cognitive impairment, 
            intellectual disability, FASD, or mental health conditions. Most arrive undiagnosed. 
            Few receive appropriate support.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              href="#services"
              className="inline-flex items-center gap-2 bg-white text-ochre-700 font-bold px-6 py-3 hover:bg-ochre-50 transition-colors"
            >
              Find Services
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="#stories"
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur text-white font-bold px-6 py-3 hover:bg-white/30 transition-colors"
            >
              Read Stories
            </Link>
          </div>
        </div>
      </section>

      {/* Key Statistics */}
      <section className="py-12 border-b-2 border-black">
        <div className="container-justice max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {keyStats.map((stat, i) => (
              <div key={i} className="border-2 border-black p-6 text-center bg-white">
                <div className="text-4xl md:text-5xl font-black text-ochre-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-earth-800 mb-1">
                  {stat.label}
                </div>
                <div className="text-xs text-earth-500">
                  {stat.source}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Problem Statement */}
      <section className="py-16 bg-sand-50 border-b-2 border-black">
        <div className="container-justice max-w-5xl">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="md:col-span-2">
              <h2 className="text-3xl font-bold mb-6">
                This Is Not About Bad Choices
              </h2>
              
              <div className="prose prose-lg text-earth-700">
                <p className="text-xl leading-relaxed mb-6">
                  Research consistently shows that between <strong>60-80% of young people in custody</strong> have 
                  cognitive impairments, intellectual disability, Fetal Alcohol Spectrum Disorder (FASD), 
                  acquired brain injury, or severe mental health conditions.
                </p>
                
                <p className="mb-6">
                  Many have multiple, overlapping disabilities. Most enter the system undiagnosed, 
                  navigate courts without understanding proceedings, and serve time in facilities 
                  ill-equipped to meet their needs.
                </p>

                <p className="mb-6">
                  This is not a story of bad kids making bad choices. It is a story of <strong>system failure</strong>—where 
                  schools, child protection, and health services miss early signs; where police encounter 
                  behaviour they interpret as defiance rather than disability; where courts proceed without 
                  ensuring comprehension; and where detention becomes the default response to unmet support needs.
                </p>
              </div>

              <div className="mt-8 p-6 bg-ochre-100 border-l-4 border-ochre-600">
                <p className="text-ochre-900 font-medium italic">
                  "The young people at the centre of this story have names, families, and potential. 
                  What they need is recognition, support, and pathways away from the justice system—not deeper entrenchment within it."
                </p>
              </div>
            </div>

            <div className="bg-white border-2 border-black p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-ochre-600" />
                Quick Facts
              </h3>
              <ul className="space-y-4 text-sm">
                <li className="flex gap-3">
                  <span className="text-ochre-600 font-bold">→</span>
                  <span>Indigenous young people are <strong>4-5x more likely</strong> to have intellectual disability in custody</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-ochre-600 font-bold">→</span>
                  <span><strong>Only 2%</strong> of young people with FASD in detention have formal diagnosis</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-ochre-600 font-bold">→</span>
                  <span>Behaviour is often misinterpreted as defiant, manipulative, or drug-affected</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-ochre-600 font-bold">→</span>
                  <span>Standard court processes are often incomprehensible to those with cognitive impairment</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Disability Types */}
      <section className="py-16 border-b-2 border-black">
        <div className="container-justice max-w-5xl">
          <h2 className="text-3xl font-bold mb-4">Types of Disability in Youth Justice</h2>
          <p className="text-earth-600 mb-12 max-w-2xl">
            Understanding the specific disabilities young people experience helps explain 
            how they end up in the justice system and what support they need.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {disabilityTypes.map((type, i) => (
              <div key={i} className="border-2 border-black p-6 hover:bg-earth-50 transition-colors">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-ochre-100 border border-black">
                    <Brain className="w-6 h-6 text-ochre-700" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{type.title}</h3>
                    <p className="text-sm text-earth-600 mt-1">{type.description}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-earth-200">
                  <div className="text-xs uppercase tracking-wider text-earth-500 mb-2">
                    Justice System Challenges
                  </div>
                  <ul className="space-y-1 text-sm">
                    {type.challenges.map((challenge, j) => (
                      <li key={j} className="flex items-start gap-2">
                        <span className="text-ochre-600">•</span>
                        {challenge}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Pathway */}
      <section className="py-16 bg-earth-900 text-white border-b-2 border-black">
        <div className="container-justice max-w-5xl">
          <h2 className="text-3xl font-bold mb-4">How Disability Becomes "Criminal Behaviour"</h2>
          <p className="text-white/70 mb-12 max-w-2xl">
            The pathway from unrecognised disability to justice involvement is predictable—and preventable.
          </p>

          <div className="space-y-0">
            {pathwaySteps.map((step, i) => (
              <div key={i} className="relative">
                {/* Connector line */}
                {i < pathwaySteps.length - 1 && (
                  <div className="absolute left-6 top-16 w-0.5 h-12 bg-white/20" />
                )}
                
                <div className="flex gap-6 pb-8">
                  {/* Step number */}
                  <div className="flex-shrink-0 w-12 h-12 bg-ochre-600 rounded-full flex items-center justify-center font-bold">
                    {i + 1}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 bg-white/5 border border-white/10 rounded-lg p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
                      <h3 className="text-xl font-bold">{step.stage}</h3>
                      <span className="text-ochre-400 text-sm font-medium">{step.issue}</span>
                    </div>
                    <p className="text-white/70 mb-3">{step.description}</p>
                    <div className="inline-block bg-ochre-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      {step.stat}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 border-b-2 border-black">
        <div className="container-justice max-w-5xl">
          <h2 className="text-3xl font-bold mb-4">Services for Young People with Disability</h2>
          <p className="text-earth-600 mb-12 max-w-2xl">
            Finding appropriate support at the intersection of disability and justice can be challenging. 
            Here are the types of services that can help.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {serviceCategories.map((category, i) => (
              <div key={i} className="border-2 border-black p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-ochre-100 border border-black">
                    {category.icon}
                  </div>
                  <h3 className="text-xl font-bold">{category.title}</h3>
                </div>
                <p className="text-earth-600 mb-4">{category.description}</p>
                <div className="text-sm">
                  <span className="text-earth-500 uppercase tracking-wider text-xs">Examples:</span>
                  <ul className="mt-2 space-y-1">
                    {category.examples.map((example, j) => (
                      <li key={j} className="text-earth-700">• {example}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Service Finder CTA */}
          <div className="bg-ochre-50 border-2 border-ochre-200 p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Find Disability-Aware Services Near You</h3>
            <p className="text-earth-600 mb-6 max-w-2xl mx-auto">
              Search our directory for services that understand the intersection of disability and justice—
              including FASD-informed providers, NDIS navigation support, and disability advocacy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/services"
                className="inline-flex items-center justify-center gap-2 bg-ochre-600 text-white font-bold px-6 py-3 hover:bg-ochre-700 transition-colors"
              >
                <MapPin className="w-5 h-5" />
                Find Services
              </Link>
              <Link
                href="/community-programs"
                className="inline-flex items-center justify-center gap-2 border-2 border-ochre-600 text-ochre-700 font-bold px-6 py-3 hover:bg-ochre-100 transition-colors"
              >
                Browse Programs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stories Section */}
      <section id="stories" className="py-16 bg-sand-50 border-b-2 border-black">
        <div className="container-justice max-w-5xl">
          <h2 className="text-3xl font-bold mb-4">Stories from the Intersection</h2>
          <p className="text-earth-600 mb-12 max-w-2xl">
            Real stories of young people with disability navigating the justice system—and what 
            could have been different with early support.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {stories.map((story, i) => (
              <div key={i} className="bg-white border-2 border-black p-6 flex flex-col">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-ochre-600 mb-3">
                  <BookOpen className="w-4 h-4" />
                  {story.type}
                </div>
                <h3 className="text-xl font-bold mb-3">{story.title}</h3>
                <p className="text-earth-600 text-sm flex-1">{story.description}</p>
                <Link
                  href={story.link}
                  className="inline-flex items-center gap-2 mt-4 text-ochre-600 font-bold text-sm hover:text-ochre-800"
                >
                  Read Story
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>

          {/* Research Link */}
          <div className="bg-white border-2 border-black p-8">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">The Hidden Epidemic: Full Research</h3>
                <p className="text-earth-600 text-sm">
                  Comprehensive research synthesis including statistics, Disability Royal Commission progress, 
                  personal stories, and service mapping.
                </p>
              </div>
              <Link
                href="/stories"
                className="inline-flex items-center gap-2 bg-black text-white font-bold px-6 py-3 hover:bg-ochre-600 transition-colors whitespace-nowrap"
              >
                <FileText className="w-5 h-5" />
                Read Research
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Royal Commission Progress */}
      <section className="py-16 border-b-2 border-black">
        <div className="container-justice max-w-5xl">
          <h2 className="text-3xl font-bold mb-4">Disability Royal Commission Progress</h2>
          <p className="text-earth-600 mb-8 max-w-2xl">
            Recommendation 8.4 calls for timely screening and assessment for cognitive disability. 
            Here's where each jurisdiction stands (as of 2025).
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {royalCommissionStatus.map((item, i) => (
              <div 
                key={i} 
                className={`border-2 p-4 ${
                  item.status === 'completed' 
                    ? 'border-eucalyptus-500 bg-eucalyptus-50' 
                    : 'border-ochre-300 bg-ochre-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${
                    item.status === 'completed' ? 'bg-eucalyptus-500' : 'bg-ochre-500'
                  }`} />
                  <span className="font-bold text-sm">{item.state}</span>
                </div>
                <p className="text-xs text-earth-600">{item.detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 p-6 bg-earth-100 border-l-4 border-earth-600">
            <p className="text-earth-800 text-sm">
              <strong>Critical Barrier:</strong> No nationally suitable, culturally appropriate disability 
              screening tool exists that can be administered by community-based frontline staff. 
              This particularly affects Indigenous young people, who are significantly over-represented 
              at every point where disability and justice intersect.
            </p>
          </div>
        </div>
      </section>

      {/* What Young People Need */}
      <section className="py-16 bg-eucalyptus-50 border-b-2 border-black">
        <div className="container-justice max-w-5xl">
          <h2 className="text-3xl font-bold mb-8">What Young People with Disability Need</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white border-2 border-black p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-eucalyptus-600">1.</span>
                Early Identification
              </h3>
              <ul className="space-y-2 text-earth-700">
                <li>• Universal screening at first point of contact</li>
                <li>• Culturally validated tools for Indigenous young people</li>
                <li>• Assessment by qualified professionals</li>
                <li>• Information sharing between health, education, and justice</li>
              </ul>
            </div>

            <div className="bg-white border-2 border-black p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-eucalyptus-600">2.</span>
                Diversion with Support
              </h3>
              <ul className="space-y-2 text-earth-700">
                <li>• Specialist courts (cognitive impairment, mental health)</li>
                <li>• Intensive case management with disability expertise</li>
                <li>• Supported accommodation as alternative to remand</li>
                <li>• Culturally safe programs for Indigenous young people</li>
              </ul>
            </div>

            <div className="bg-white border-2 border-black p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-eucalyptus-600">3.</span>
                Therapeutic Approaches
              </h3>
              <ul className="space-y-2 text-earth-700">
                <li>• Sensory-friendly environments</li>
                <li>• Communication support (visual aids, plain language)</li>
                <li>• Trauma-informed care</li>
                <li>• Continuity of NDIS and disability services</li>
              </ul>
            </div>

            <div className="bg-white border-2 border-black p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-eucalyptus-600">4.</span>
                Transition Support
              </h3>
              <ul className="space-y-2 text-earth-700">
                <li>• Disability-aware throughcare from custody to community</li>
                <li>• Stable housing with support</li>
                <li>• Education and employment pathways</li>
                <li>• Long-term NDIS coordination</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Research & Resources */}
      <section className="py-16 border-b-2 border-black bg-sand-50">
        <div className="container-justice max-w-5xl">
          <h2 className="text-3xl font-bold mb-4">Research & Resources</h2>
          <p className="text-earth-600 mb-12 max-w-2xl">
            Evidence-based research, government inquiries, and international best practices 
            on disability in youth justice.
          </p>

          {/* Australian Research */}
          <div className="mb-12">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-ochre-600" />
              Key Australian Research
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <a 
                href="https://pmc.ncbi.nlm.nih.gov/articles/PMC7916306/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white border-2 border-black p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
              >
                <div className="text-xs uppercase tracking-wider text-ochre-600 mb-2">2021 • BMC Public Health</div>
                <h4 className="font-bold mb-2">Navigating Complexity to Support Justice-Involved Youth with FASD</h4>
                <p className="text-sm text-earth-600 mb-4">Workforce development research on FASD-informed practices in youth justice.</p>
                <span className="text-xs font-bold text-ochre-600 inline-flex items-center gap-1">
                  Read Research <ExternalLink className="w-3 h-3" />
                </span>
              </a>

              <Link 
                href="/youth-justice-report/inquiries"
                className="bg-white border-2 border-black p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
              >
                <div className="text-xs uppercase tracking-wider text-ochre-600 mb-2">Historical Inquiries</div>
                <h4 className="font-bold mb-2">Royal Commission into NT Youth Detention</h4>
                <p className="text-sm text-earth-600 mb-4">227 recommendations on systemic failures affecting children with disability.</p>
                <span className="text-xs font-bold text-ochre-600 inline-flex items-center gap-1">
                  View Inquiries →
                </span>
              </Link>

              <Link 
                href="/centre-of-excellence/research"
                className="bg-white border-2 border-black p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
              >
                <div className="text-xs uppercase tracking-wider text-eucalyptus-600 mb-2">Research Library</div>
                <h4 className="font-bold mb-2">Youth Justice Research Database</h4>
                <p className="text-sm text-earth-600 mb-4">27+ peer-reviewed studies including disability and neurodevelopmental research.</p>
                <span className="text-xs font-bold text-eucalyptus-600 inline-flex items-center gap-1">
                  Browse Library →
                </span>
              </Link>

              <a 
                href="https://disability.royalcommission.gov.au/publications/final-report-volume-8-criminal-justice-and-people-disability"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white border-2 border-black p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
              >
                <div className="text-xs uppercase tracking-wider text-ochre-600 mb-2">2023 • Disability Royal Commission</div>
                <h4 className="font-bold mb-2">Volume 8: Criminal Justice and People with Disability</h4>
                <p className="text-sm text-earth-600 mb-4">24 recommendations addressing maltreatment in criminal justice systems.</p>
                <span className="text-xs font-bold text-ochre-600 inline-flex items-center gap-1">
                  Read Report <ExternalLink className="w-3 h-3" />
                </span>
              </a>
            </div>
          </div>

          {/* International Best Practice */}
          <div className="mb-12">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Globe className="w-5 h-5 text-eucalyptus-600" />
              International Best Practice
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <Link 
                href="/youth-justice-report/international"
                className="bg-white border-2 border-black p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
              >
                <div className="text-2xl mb-2">🇨🇦</div>
                <h4 className="font-bold mb-2">Canada: YCJA Model</h4>
                <p className="text-sm text-earth-600 mb-4">Diversion and rehabilitation focus with 40% reduction in custody since 2003.</p>
                <span className="text-xs font-bold text-eucalyptus-600">Learn More →</span>
              </Link>

              <Link 
                href="/youth-justice-report/international"
                className="bg-white border-2 border-black p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
              >
                <div className="text-2xl mb-2">🇳🇿</div>
                <h4 className="font-bold mb-2">New Zealand: Family Conferencing</h4>
                <p className="text-sm text-earth-600 mb-4">80% of cases resolved without court. Culturally grounded approach.</p>
                <span className="text-xs font-bold text-eucalyptus-600">Learn More →</span>
              </Link>

              <Link 
                href="/youth-justice-report/international"
                className="bg-white border-2 border-black p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
              >
                <div className="text-2xl mb-2">🏴󠁧󠁢󠁳󠁣󠁴󠁿</div>
                <h4 className="font-bold mb-2">Scotland: Children's Hearings</h4>
                <p className="text-sm text-earth-600 mb-4">Lay panels keep most children under 16 out of courts entirely.</p>
                <span className="text-xs font-bold text-eucalyptus-600">Learn More →</span>
              </Link>
            </div>
          </div>

          {/* Key Organizations */}
          <div>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-ochre-600" />
              Key Organizations
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <a 
                href="https://www.idrs.org.au"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white border-2 border-black p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
              >
                <h4 className="font-bold mb-2">Intellectual Disability Rights Service (IDRS)</h4>
                <p className="text-sm text-earth-600 mb-4">Free legal service for people with intellectual disability in NSW. Justice Advocacy Service provides court and police support.</p>
                <span className="text-xs font-bold text-ochre-600 inline-flex items-center gap-1">
                  Visit Website <ExternalLink className="w-3 h-3" />
                </span>
              </a>

              <a 
                href="https://www.fasdhub.org.au"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white border-2 border-black p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
              >
                <h4 className="font-bold mb-2">FASD Hub Australia</h4>
                <p className="text-sm text-earth-600 mb-4">National FASD information, resources, and referral pathways for diagnosis and support.</p>
                <span className="text-xs font-bold text-ochre-600 inline-flex items-center gap-1">
                  Visit Website <ExternalLink className="w-3 h-3" />
                </span>
              </a>

              <a 
                href="https://www.nofasd.org.au"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white border-2 border-black p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
              >
                <h4 className="font-bold mb-2">NOFASD Australia</h4>
                <p className="text-sm text-earth-600 mb-4">National peak body for FASD. Training, resources, and advocacy for FASD-aware justice responses.</p>
                <span className="text-xs font-bold text-ochre-600 inline-flex items-center gap-1">
                  Visit Website <ExternalLink className="w-3 h-3" />
                </span>
              </a>

              <a 
                href="https://www.valid.org.au"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white border-2 border-black p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
              >
                <h4 className="font-bold mb-2">VALID (Victorian Advocacy League)</h4>
                <p className="text-sm text-earth-600 mb-4">Advocacy and resources for people with intellectual disability, including justice advocacy.</p>
                <span className="text-xs font-bold text-ochre-600 inline-flex items-center gap-1">
                  Visit Website <ExternalLink className="w-3 h-3" />
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Related Themes */}
      <section className="py-16 border-b-2 border-black">
        <div className="container-justice max-w-5xl">
          <h2 className="text-2xl font-bold mb-8">Related Thematic Areas</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Link href="/themes" className="group border-2 border-black p-6 hover:bg-earth-50 transition-colors">
              <Heart className="w-8 h-8 text-eucalyptus-600 mb-4" />
              <h3 className="text-xl font-bold mb-2 group-hover:text-eucalyptus-600">Health & Wellbeing</h3>
              <p className="text-sm text-earth-600">Mental health, substance use, and trauma intersect with disability and justice.</p>
            </Link>

            <Link href="/themes" className="group border-2 border-black p-6 hover:bg-earth-50 transition-colors">
              <Users className="w-8 h-8 text-ochre-600 mb-4" />
              <h3 className="text-xl font-bold mb-2 group-hover:text-ochre-600">Marginalised Groups</h3>
              <p className="text-sm text-earth-600">Indigenous youth with disability face compounded systemic barriers.</p>
            </Link>

            <Link href="/themes" className="group border-2 border-black p-6 hover:bg-earth-50 transition-colors bg-ochre-50">
              <span className="text-ochre-600 font-bold mb-4 block">View All →</span>
              <h3 className="text-xl font-bold mb-2">All Themes</h3>
              <p className="text-sm text-earth-600">Explore housing, education, culture, and more.</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-black text-white">
        <div className="container-justice max-w-5xl text-center">
          <h2 className="text-3xl font-bold mb-4">
            Recognition Is The First Step
          </h2>
          <p className="text-white/70 mb-8 max-w-2xl mx-auto">
            Australia cannot claim to have a just youth justice system while the majority 
            of children in detention have unmet disability support needs. Recognition—early, 
            accurate, culturally safe—is the foundation of appropriate response.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/services"
              className="inline-flex items-center justify-center gap-2 bg-white text-black font-bold px-6 py-3 hover:bg-ochre-100 transition-colors"
            >
              <Phone className="w-5 h-5" />
              Find Help Now
            </Link>
            <Link
              href="/stories"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white font-bold px-6 py-3 hover:bg-white/10 transition-colors"
            >
              <FileText className="w-5 h-5" />
              Read Full Research
            </Link>
          </div>
        </div>
      </section>
      </main>
      <Footer />
    </div>
  );
}
