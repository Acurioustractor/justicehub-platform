export const SKILL_CATEGORIES = [
  {
    id: 'technical',
    name: 'Technical Skills',
    description: 'Digital and technical skills',
    skills: [
      'Web Development',
      'Mobile Development',
      'Data Analysis',
      'Digital Marketing',
      'Graphic Design',
      'Video Editing'
    ]
  },
  {
    id: 'communication',
    name: 'Communication',
    description: 'Communication and presentation skills',
    skills: [
      'Public Speaking',
      'Writing',
      'Social Media',
      'Storytelling',
      'Presentation',
      'Content Creation'
    ]
  },
  {
    id: 'leadership',
    name: 'Leadership',
    description: 'Leadership and management skills',
    skills: [
      'Team Management',
      'Project Planning',
      'Mentoring',
      'Event Organization',
      'Community Building',
      'Advocacy'
    ]
  },
  {
    id: 'creative',
    name: 'Creative Arts',
    description: 'Creative and artistic skills',
    skills: [
      'Music',
      'Dance',
      'Theater',
      'Visual Arts',
      'Photography',
      'Creative Writing'
    ]
  }
];

export const INTEREST_CATEGORIES = [
  {
    id: 'social-justice',
    name: 'Social Justice',
    description: 'Social justice and advocacy interests',
    interests: [
      'Human Rights',
      'Environmental Justice',
      'Criminal Justice Reform',
      'Education Equity',
      'Economic Justice',
      'Healthcare Access'
    ]
  },
  {
    id: 'community',
    name: 'Community Development',
    description: 'Community building and development interests',
    interests: [
      'Youth Programs',
      'Community Organizing',
      'Local Government',
      'Nonprofit Work',
      'Volunteer Coordination',
      'Fundraising'
    ]
  },
  {
    id: 'technology',
    name: 'Technology & Innovation',
    description: 'Technology and innovation interests',
    interests: [
      'Digital Literacy',
      'Tech for Good',
      'AI Ethics',
      'Data Privacy',
      'Accessibility',
      'Open Source'
    ]
  }
];

export interface Skill {
  id: string;
  name: string;
  category: string;
  level?: string;
  verified?: boolean;
}

export interface Interest {
  id: string;
  name: string;
  category: string;
  level?: string;
}

export const searchSkills = (query: string): Skill[] => {
  const allSkills: Skill[] = [];
  SKILL_CATEGORIES.forEach(category => {
    category.skills.forEach((skill, index) => {
      allSkills.push({
        id: `${category.id}-${index}`,
        name: skill,
        category: category.name
      });
    });
  });
  
  return allSkills.filter(skill => 
    skill.name.toLowerCase().includes(query.toLowerCase())
  );
};

export const searchInterests = (query: string): Interest[] => {
  const allInterests: Interest[] = [];
  INTEREST_CATEGORIES.forEach(category => {
    category.interests.forEach((interest, index) => {
      allInterests.push({
        id: `${category.id}-${index}`,
        name: interest,
        category: category.name
      });
    });
  });
  
  return allInterests.filter(interest => 
    interest.name.toLowerCase().includes(query.toLowerCase())
  );
};