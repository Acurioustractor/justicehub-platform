// Comprehensive skills and interests taxonomy for JusticeHub matching system

export interface SkillCategory {
  id: string;
  name: string;
  description: string;
  skills: Skill[];
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  aliases?: string[]; // Alternative names for matching
}

export interface InterestCategory {
  id: string;
  name: string;
  description: string;
  interests: Interest[];
}

export interface Interest {
  id: string;
  name: string;
  description: string;
  aliases?: string[];
}

// Core Skills Taxonomy
export const SKILL_CATEGORIES: SkillCategory[] = [
  {
    id: 'technical',
    name: 'Technology & Digital',
    description: 'Computer skills, programming, digital literacy',
    skills: [
      { id: 'web-dev', name: 'Web Development', description: 'HTML, CSS, JavaScript, React' },
      { id: 'mobile-dev', name: 'Mobile Development', description: 'iOS, Android app development' },
      { id: 'data-analysis', name: 'Data Analysis', description: 'Excel, SQL, Python, data visualization' },
      { id: 'graphic-design', name: 'Graphic Design', description: 'Photoshop, Illustrator, visual design' },
      { id: 'video-editing', name: 'Video Editing', description: 'Video production and editing skills' },
      { id: 'social-media', name: 'Social Media Marketing', description: 'Digital marketing and content creation' },
      { id: 'cybersecurity', name: 'Cybersecurity', description: 'Information security and privacy' },
      { id: 'ai-ml', name: 'AI & Machine Learning', description: 'Artificial intelligence and data science' }
    ]
  },
  {
    id: 'communication',
    name: 'Communication & Language',
    description: 'Speaking, writing, presentation, and language skills',
    skills: [
      { id: 'public-speaking', name: 'Public Speaking', description: 'Presenting to groups and audiences' },
      { id: 'writing', name: 'Creative Writing', description: 'Storytelling, blogging, content creation' },
      { id: 'technical-writing', name: 'Technical Writing', description: 'Documentation and technical communication' },
      { id: 'translation', name: 'Translation & Interpretation', description: 'Multi-language communication' },
      { id: 'debate', name: 'Debate & Argumentation', description: 'Logical reasoning and persuasion' },
      { id: 'media-production', name: 'Media Production', description: 'Podcasting, broadcasting, journalism' }
    ]
  },
  {
    id: 'business',
    name: 'Business & Entrepreneurship',
    description: 'Business skills, leadership, and entrepreneurship',
    skills: [
      { id: 'leadership', name: 'Leadership', description: 'Team management and motivation' },
      { id: 'project-management', name: 'Project Management', description: 'Planning and executing projects' },
      { id: 'financial-literacy', name: 'Financial Literacy', description: 'Budgeting, investing, financial planning' },
      { id: 'marketing', name: 'Marketing & Sales', description: 'Customer acquisition and retention' },
      { id: 'entrepreneurship', name: 'Entrepreneurship', description: 'Starting and running businesses' },
      { id: 'networking', name: 'Professional Networking', description: 'Building professional relationships' },
      { id: 'negotiation', name: 'Negotiation', description: 'Conflict resolution and deal-making' }
    ]
  },
  {
    id: 'creative',
    name: 'Arts & Creative',
    description: 'Artistic and creative expression skills',
    skills: [
      { id: 'music-production', name: 'Music Production', description: 'Recording, mixing, and producing music' },
      { id: 'visual-arts', name: 'Visual Arts', description: 'Drawing, painting, sculpture' },
      { id: 'photography', name: 'Photography', description: 'Digital and film photography' },
      { id: 'fashion-design', name: 'Fashion Design', description: 'Clothing and accessory design' },
      { id: 'theater', name: 'Theater & Performance', description: 'Acting, directing, stage production' },
      { id: 'creative-writing', name: 'Creative Writing', description: 'Fiction, poetry, screenwriting' },
      { id: 'dance', name: 'Dance & Choreography', description: 'Movement and dance performance' }
    ]
  },
  {
    id: 'social',
    name: 'Social Impact & Advocacy',
    description: 'Community organizing, social justice, and advocacy',
    skills: [
      { id: 'community-organizing', name: 'Community Organizing', description: 'Mobilizing communities for change' },
      { id: 'policy-analysis', name: 'Policy Analysis', description: 'Understanding and influencing policy' },
      { id: 'grant-writing', name: 'Grant Writing', description: 'Securing funding for projects' },
      { id: 'volunteer-management', name: 'Volunteer Management', description: 'Coordinating volunteer efforts' },
      { id: 'advocacy', name: 'Advocacy & Activism', description: 'Promoting social causes' },
      { id: 'research', name: 'Research & Analysis', description: 'Data collection and analysis' },
      { id: 'fundraising', name: 'Fundraising', description: 'Raising money for causes' }
    ]
  },
  {
    id: 'health',
    name: 'Health & Wellness',
    description: 'Physical and mental health, wellness, and medical skills',
    skills: [
      { id: 'mental-health', name: 'Mental Health Advocacy', description: 'Supporting mental wellness' },
      { id: 'fitness-training', name: 'Fitness Training', description: 'Physical fitness and coaching' },
      { id: 'nutrition', name: 'Nutrition & Wellness', description: 'Healthy eating and lifestyle' },
      { id: 'peer-counseling', name: 'Peer Counseling', description: 'Supporting others through challenges' },
      { id: 'meditation', name: 'Meditation & Mindfulness', description: 'Stress management and mindfulness' },
      { id: 'first-aid', name: 'First Aid & CPR', description: 'Emergency medical response' }
    ]
  },
  {
    id: 'trades',
    name: 'Skilled Trades & Technical',
    description: 'Hands-on technical and trade skills',
    skills: [
      { id: 'automotive', name: 'Automotive Repair', description: 'Car maintenance and repair' },
      { id: 'construction', name: 'Construction & Building', description: 'Building and construction skills' },
      { id: 'electrical', name: 'Electrical Work', description: 'Electrical systems and wiring' },
      { id: 'plumbing', name: 'Plumbing', description: 'Water systems and pipe work' },
      { id: 'welding', name: 'Welding & Metalwork', description: 'Metal joining and fabrication' },
      { id: 'carpentry', name: 'Carpentry & Woodwork', description: 'Wood construction and furniture' }
    ]
  }
];

// Interests Taxonomy
export const INTEREST_CATEGORIES: InterestCategory[] = [
  {
    id: 'education',
    name: 'Education & Learning',
    description: 'Academic pursuits and lifelong learning',
    interests: [
      { id: 'higher-education', name: 'College & University', description: 'Pursuing higher education' },
      { id: 'trade-school', name: 'Trade & Vocational School', description: 'Professional certification programs' },
      { id: 'online-learning', name: 'Online Learning', description: 'Digital education platforms' },
      { id: 'mentorship', name: 'Being Mentored', description: 'Learning from experienced professionals' },
      { id: 'skill-building', name: 'Skill Development', description: 'Continuous learning and growth' }
    ]
  },
  {
    id: 'career',
    name: 'Career & Professional',
    description: 'Career development and professional growth',
    interests: [
      { id: 'entrepreneurship', name: 'Starting a Business', description: 'Entrepreneurial ventures' },
      { id: 'corporate-career', name: 'Corporate Career', description: 'Working in established companies' },
      { id: 'nonprofit-work', name: 'Nonprofit Work', description: 'Social impact careers' },
      { id: 'freelancing', name: 'Freelancing', description: 'Independent contractor work' },
      { id: 'remote-work', name: 'Remote Work', description: 'Location-independent careers' },
      { id: 'international-work', name: 'International Work', description: 'Global career opportunities' }
    ]
  },
  {
    id: 'social-impact',
    name: 'Social Impact & Justice',
    description: 'Making positive change in communities',
    interests: [
      { id: 'criminal-justice', name: 'Criminal Justice Reform', description: 'Improving justice systems' },
      { id: 'education-equity', name: 'Education Equity', description: 'Equal access to quality education' },
      { id: 'environmental-justice', name: 'Environmental Justice', description: 'Environmental equity and sustainability' },
      { id: 'housing-justice', name: 'Housing Justice', description: 'Affordable housing and homelessness' },
      { id: 'racial-equity', name: 'Racial Equity', description: 'Addressing systemic racism' },
      { id: 'lgbtq-rights', name: 'LGBTQ+ Rights', description: 'Equality and inclusion for LGBTQ+ individuals' },
      { id: 'youth-advocacy', name: 'Youth Advocacy', description: 'Supporting young people\'s rights' }
    ]
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle & Personal',
    description: 'Personal interests and lifestyle preferences',
    interests: [
      { id: 'travel', name: 'Travel & Culture', description: 'Exploring different places and cultures' },
      { id: 'sports', name: 'Sports & Athletics', description: 'Physical fitness and competitive sports' },
      { id: 'arts-culture', name: 'Arts & Culture', description: 'Creative expression and cultural activities' },
      { id: 'technology', name: 'Technology Innovation', description: 'Emerging tech and digital trends' },
      { id: 'sustainability', name: 'Sustainability', description: 'Environmental consciousness and green living' },
      { id: 'spirituality', name: 'Spirituality & Faith', description: 'Personal growth and spiritual practices' }
    ]
  },
  {
    id: 'financial',
    name: 'Financial Goals',
    description: 'Financial independence and economic objectives',
    interests: [
      { id: 'financial-independence', name: 'Financial Independence', description: 'Building wealth and financial security' },
      { id: 'homeownership', name: 'Homeownership', description: 'Buying and owning property' },
      { id: 'debt-freedom', name: 'Debt Freedom', description: 'Eliminating financial debt' },
      { id: 'investing', name: 'Investing & Wealth Building', description: 'Growing money through investments' },
      { id: 'emergency-fund', name: 'Emergency Savings', description: 'Building financial safety nets' }
    ]
  }
];

// Helper functions for matching
export function getAllSkills(): Skill[] {
  return SKILL_CATEGORIES.flatMap(category => category.skills);
}

export function getAllInterests(): Interest[] {
  return INTEREST_CATEGORIES.flatMap(category => category.interests);
}

export function findSkillById(skillId: string): Skill | undefined {
  return getAllSkills().find(skill => skill.id === skillId);
}

export function findInterestById(interestId: string): Interest | undefined {
  return getAllInterests().find(interest => interest.id === interestId);
}

export function searchSkills(query: string): Skill[] {
  const lowercaseQuery = query.toLowerCase();
  return getAllSkills().filter(skill => 
    skill.name.toLowerCase().includes(lowercaseQuery) ||
    skill.description.toLowerCase().includes(lowercaseQuery) ||
    skill.aliases?.some(alias => alias.toLowerCase().includes(lowercaseQuery))
  );
}

export function searchInterests(query: string): Interest[] {
  const lowercaseQuery = query.toLowerCase();
  return getAllInterests().filter(interest => 
    interest.name.toLowerCase().includes(lowercaseQuery) ||
    interest.description.toLowerCase().includes(lowercaseQuery) ||
    interest.aliases?.some(alias => alias.toLowerCase().includes(lowercaseQuery))
  );
}

// Matching compatibility scoring
export function calculateSkillMatch(userSkills: string[], mentorSkills: string[]): number {
  if (userSkills.length === 0 || mentorSkills.length === 0) return 0;
  
  const matches = userSkills.filter(skill => mentorSkills.includes(skill));
  return matches.length / Math.max(userSkills.length, mentorSkills.length);
}

export function calculateInterestMatch(userInterests: string[], mentorInterests: string[]): number {
  if (userInterests.length === 0 || mentorInterests.length === 0) return 0;
  
  const matches = userInterests.filter(interest => mentorInterests.includes(interest));
  return matches.length / Math.max(userInterests.length, mentorInterests.length);
}