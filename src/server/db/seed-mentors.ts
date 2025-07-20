// Sample script to seed mentor data
// This is a template that can be run when database is set up

export const sampleMentors = [
  {
    name: 'Sarah Chen',
    email: 'sarah.chen@example.com',
    title: 'Senior Software Engineer',
    bio: 'Passionate about helping youth break into tech. 10+ years experience in web development and mentoring.',
    longBio: `I'm a senior software engineer with over 10 years of experience in web development and a deep passion for mentoring the next generation of tech talent. My journey in tech began as a self-taught programmer, and I understand the challenges that come with breaking into this field.

Throughout my career, I've worked at several startups and established tech companies, gaining expertise in full-stack development, system design, and technical leadership. I've mentored over 50 individuals, helping them land their first tech jobs, advance their careers, and build confidence in their abilities.

I believe in a personalized approach to mentoring, focusing on practical skills, real-world projects, and building a strong foundation in both technical and soft skills. Whether you're just starting out or looking to level up your career, I'm here to guide you on your journey.`,
    expertise: ['Web Development', 'Career Planning', 'Technical Interviews', 'System Design'],
    skills: ['JavaScript', 'React', 'Python', 'Node.js', 'AWS', 'Leadership', 'Communication'],
    focusAreas: ['Technology', 'Career Development', 'Leadership'],
    experience: '10+ years',
    education: [
      {
        degree: 'MS Computer Science',
        school: 'Stanford University',
        year: '2014'
      },
      {
        degree: 'BS Computer Engineering',
        school: 'UC Berkeley',
        year: '2012'
      }
    ],
    certifications: ['AWS Solutions Architect', 'Google Cloud Professional', 'Certified Scrum Master'],
    availability: {
      hours: 5,
      timezone: 'PST',
      preferredTimes: ['Evenings', 'Weekends'],
      schedule: {
        monday: ['6:00 PM - 8:00 PM'],
        tuesday: ['6:00 PM - 8:00 PM'],
        wednesday: [],
        thursday: ['6:00 PM - 8:00 PM'],
        friday: [],
        saturday: ['10:00 AM - 12:00 PM', '2:00 PM - 4:00 PM'],
        sunday: ['2:00 PM - 4:00 PM']
      }
    },
    maxMentees: 5,
    languages: ['English', 'Mandarin'],
    mentorshipStyle: 'Supportive and goal-oriented with focus on practical, hands-on learning',
    responseTime: 'Within 24 hours',
    acceptanceRate: 85,
    socialLinks: {
      linkedin: 'https://linkedin.com/in/sarahchen',
      twitter: 'https://twitter.com/sarahchen',
      website: 'https://sarahchen.dev'
    }
  },
  {
    name: 'Marcus Johnson',
    email: 'marcus.johnson@example.com',
    title: 'Entrepreneur & Business Coach',
    bio: 'Founded 3 successful startups. Now dedicated to helping young entrepreneurs find their path.',
    longBio: `As a serial entrepreneur with three successful exits under my belt, I've learned that success in business is as much about mindset and perseverance as it is about strategy and execution. My journey began in my garage with nothing but an idea and determination, and I've built companies from the ground up in e-commerce, SaaS, and social impact sectors.

Now, I'm passionate about giving back and helping young entrepreneurs navigate the challenging but rewarding path of building their own businesses. I provide practical guidance on everything from ideation and validation to fundraising and scaling.

My mentoring style is direct and action-oriented. I believe in learning by doing, and I'll push you to take calculated risks and learn from both successes and failures. If you're ready to turn your ideas into reality and build something meaningful, let's work together.`,
    expertise: ['Entrepreneurship', 'Business Strategy', 'Personal Branding', 'Fundraising'],
    skills: ['Business Planning', 'Marketing', 'Public Speaking', 'Networking', 'Sales', 'Leadership'],
    focusAreas: ['Business', 'Leadership', 'Innovation'],
    experience: '15+ years',
    education: [
      {
        degree: 'MBA',
        school: 'Harvard Business School',
        year: '2010'
      },
      {
        degree: 'BA Economics',
        school: 'Yale University',
        year: '2008'
      }
    ],
    certifications: ['Certified Business Coach', 'Lean Startup Facilitator'],
    availability: {
      hours: 8,
      timezone: 'EST',
      preferredTimes: ['Mornings', 'Afternoons'],
      schedule: {
        monday: ['9:00 AM - 11:00 AM', '2:00 PM - 4:00 PM'],
        tuesday: ['9:00 AM - 11:00 AM'],
        wednesday: ['2:00 PM - 4:00 PM'],
        thursday: ['9:00 AM - 11:00 AM', '2:00 PM - 4:00 PM'],
        friday: ['9:00 AM - 11:00 AM'],
        saturday: [],
        sunday: []
      }
    },
    maxMentees: 8,
    languages: ['English', 'Spanish'],
    mentorshipStyle: 'Direct, action-oriented coaching with focus on practical results',
    responseTime: 'Within 48 hours',
    acceptanceRate: 75,
    socialLinks: {
      linkedin: 'https://linkedin.com/in/marcusjohnson',
      twitter: 'https://twitter.com/marcusj'
    }
  },
  {
    name: 'Dr. Amara Okafor',
    email: 'amara.okafor@example.com',
    title: 'Clinical Psychologist',
    bio: 'Specializing in youth mental health and personal development. Here to support your journey.',
    longBio: `With over 8 years of experience as a clinical psychologist specializing in adolescent and young adult mental health, I'm passionate about helping youth navigate the challenges of growing up in today's complex world. My approach combines evidence-based therapeutic techniques with culturally responsive care.

I've worked in various settings including schools, community centers, and private practice, helping young people overcome anxiety, depression, trauma, and identity challenges. I believe that mental health is the foundation for success in all areas of life, and I'm committed to breaking down stigma and making support accessible.

In our mentoring relationship, I provide a safe, non-judgmental space for you to explore your thoughts, feelings, and goals. Whether you're dealing with specific mental health challenges or simply want to develop better self-awareness and coping strategies, I'm here to support your growth and well-being.`,
    expertise: ['Mental Health', 'Personal Development', 'Goal Setting', 'Stress Management'],
    skills: ['Counseling', 'Active Listening', 'Conflict Resolution', 'Mindfulness', 'CBT', 'Trauma-Informed Care'],
    focusAreas: ['Mental Health', 'Personal Growth', 'Wellness'],
    experience: '8+ years',
    education: [
      {
        degree: 'PhD Clinical Psychology',
        school: 'Columbia University',
        year: '2016'
      },
      {
        degree: 'MA Psychology',
        school: 'Columbia University',
        year: '2013'
      },
      {
        degree: 'BA Psychology',
        school: 'Spelman College',
        year: '2011'
      }
    ],
    certifications: ['Licensed Clinical Psychologist', 'Trauma-Focused CBT', 'Mindfulness-Based Stress Reduction'],
    availability: {
      hours: 6,
      timezone: 'CST',
      preferredTimes: ['Flexible'],
      schedule: {
        monday: ['3:00 PM - 5:00 PM'],
        tuesday: ['3:00 PM - 5:00 PM'],
        wednesday: ['3:00 PM - 5:00 PM'],
        thursday: [],
        friday: ['3:00 PM - 5:00 PM'],
        saturday: ['10:00 AM - 12:00 PM'],
        sunday: []
      }
    },
    maxMentees: 6,
    languages: ['English', 'French'],
    mentorshipStyle: 'Empathetic, supportive approach focused on holistic well-being and personal growth',
    responseTime: 'Within 24 hours',
    acceptanceRate: 90,
    socialLinks: {
      linkedin: 'https://linkedin.com/in/dramaraokafor'
    }
  }
];

console.log('Sample mentor data ready for seeding when database is configured.');
console.log(`Total mentors: ${sampleMentors.length}`);