import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // For testing purposes, use our mock opportunities that align with JusticeHub philosophy
    const mockOpportunities = [
      {
        id: 'opp_1',
        title: 'Peer Support Volunteer - Orange Sky',
        slug: 'peer-support-volunteer-orange-sky',
        shortDescription: 'Use your lived experience to support others experiencing homelessness through Orange Sky\'s community programs.',
        type: 'volunteer',
        organization: {
          id: 'org_orange_sky',
          name: 'Orange Sky Australia',
          logo: 'https://placehold.co/100x100/FF6B35/FFFFFF?text=OS'
        },
        location: {
          type: 'multiple',
          city: 'Multiple',
          state: 'Locations'
        },
        duration: {
          type: 'ongoing',
          length: 4,
          unit: 'hours per week'
        },
        compensation: {
          type: 'volunteer',
          amount: 0,
          currency: 'AUD'
        },
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        spots: 20,
        spotsAvailable: 15,
        tags: ['peer-support', 'lived-experience', 'community', 'orange-sky'],
        viewCount: 234,
        saved: false,
        applied: false,
        featured: true
      },
      {
        id: 'opp_2',
        title: 'Community Storytelling Workshop Facilitator',
        slug: 'storytelling-workshop-facilitator',
        shortDescription: 'Help young people discover their narrative power through facilitated storytelling workshops across Australia.',
        type: 'program',
        organization: {
          id: 'org_justicehub',
          name: 'JusticeHub Community',
          logo: 'https://placehold.co/100x100/4F46E5/FFFFFF?text=JH'
        },
        location: {
          type: 'multiple',
          city: 'Brisbane, Melbourne',
          state: 'Sydney'
        },
        duration: {
          type: 'contract',
          length: 3,
          unit: 'workshops per month'
        },
        compensation: {
          type: 'paid',
          amount: 150,
          currency: 'AUD'
        },
        applicationDeadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        spots: 10,
        spotsAvailable: 8,
        tags: ['storytelling', 'facilitation', 'youth-work', 'narrative-therapy'],
        viewCount: 89,
        saved: false,
        applied: false,
        featured: true
      },
      {
        id: 'opp_3',
        title: 'Indigenous Housing Project Coordinator',
        slug: 'indigenous-housing-coordinator',
        shortDescription: 'Lead community-controlled housing initiatives that respect cultural values and community self-determination.',
        type: 'job',
        organization: {
          id: 'org_first_nations',
          name: 'First Nations Community Development',
          logo: 'https://placehold.co/100x100/D2691E/FFFFFF?text=FN'
        },
        location: {
          type: 'onsite',
          city: 'Tenant Creek',
          state: 'NT'
        },
        duration: {
          type: 'permanent',
          length: null,
          unit: 'full-time'
        },
        compensation: {
          type: 'paid',
          amount: 75000,
          currency: 'AUD'
        },
        applicationDeadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        spots: 1,
        spotsAvailable: 1,
        tags: ['indigenous-led', 'housing', 'community-development', 'cultural-safety'],
        viewCount: 156,
        saved: false,
        applied: false,
        featured: true
      },
      {
        id: 'opp_4',
        title: 'Peer Mental Health Support Worker',
        slug: 'peer-mental-health-support',
        shortDescription: 'Provide peer support to young people experiencing mental health challenges using your lived experience.',
        type: 'job',
        organization: {
          id: 'org_beyond_blue',
          name: 'Beyond Blue',
          logo: 'https://placehold.co/100x100/0099CC/FFFFFF?text=BB'
        },
        location: {
          type: 'hybrid',
          city: 'Melbourne',
          state: 'Online'
        },
        duration: {
          type: 'part-time',
          length: 20,
          unit: 'hours per week'
        },
        compensation: {
          type: 'paid',
          amount: 32,
          currency: 'AUD'
        },
        applicationDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        spots: 5,
        spotsAvailable: 3,
        tags: ['mental-health', 'peer-support', 'recovery', 'youth-focused'],
        viewCount: 267,
        saved: false,
        applied: false,
        featured: false
      },
      {
        id: 'opp_5',
        title: 'Youth Justice Advocacy Intern',
        slug: 'youth-justice-advocacy-intern',
        shortDescription: 'Support research and advocacy for youth justice reform using your lived experience perspective.',
        type: 'internship',
        organization: {
          id: 'org_innovative_justice',
          name: 'Centre for Innovative Justice',
          logo: 'https://placehold.co/100x100/8B4513/FFFFFF?text=CJ'
        },
        location: {
          type: 'hybrid',
          city: 'Melbourne',
          state: 'VIC'
        },
        duration: {
          type: 'fixed',
          length: 6,
          unit: 'months'
        },
        compensation: {
          type: 'paid',
          amount: 25,
          currency: 'AUD'
        },
        applicationDeadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
        spots: 3,
        spotsAvailable: 2,
        tags: ['youth-justice', 'advocacy', 'policy', 'lived-experience'],
        viewCount: 134,
        saved: false,
        applied: false,
        featured: false
      },
      {
        id: 'opp_6',
        title: 'Social Enterprise Startup Incubator',
        slug: 'social-enterprise-incubator',
        shortDescription: 'Turn your lived experience into a sustainable social enterprise that creates positive community change.',
        type: 'program',
        organization: {
          id: 'org_good_shepherd',
          name: 'Good Shepherd Australia New Zealand',
          logo: 'https://placehold.co/100x100/228B22/FFFFFF?text=GS'
        },
        location: {
          type: 'multiple',
          city: 'Sydney, Melbourne',
          state: 'Brisbane'
        },
        duration: {
          type: 'program',
          length: 12,
          unit: 'weeks'
        },
        compensation: {
          type: 'stipend',
          amount: 2000,
          currency: 'AUD'
        },
        applicationDeadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
        spots: 15,
        spotsAvailable: 12,
        tags: ['social-enterprise', 'entrepreneurship', 'business-development', 'social-impact'],
        viewCount: 198,
        saved: false,
        applied: false,
        featured: true
      }
    ];

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const offset = (page - 1) * limit;
    
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type');
    const location = searchParams.get('location');
    const compensation = searchParams.get('compensation');
    const sortBy = searchParams.get('sortBy') || 'recent';

    // Filter opportunities based on search params
    let filteredOpportunities = mockOpportunities;

    if (search) {
      filteredOpportunities = filteredOpportunities.filter(opp =>
        opp.title.toLowerCase().includes(search.toLowerCase()) ||
        opp.shortDescription.toLowerCase().includes(search.toLowerCase()) ||
        opp.organization.name.toLowerCase().includes(search.toLowerCase()) ||
        opp.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
      );
    }

    if (type && type !== 'all') {
      filteredOpportunities = filteredOpportunities.filter(opp => opp.type === type);
    }

    if (location && location !== 'all') {
      filteredOpportunities = filteredOpportunities.filter(opp => 
        opp.location.type === location ||
        opp.location.city?.toLowerCase().includes(location.toLowerCase()) ||
        opp.location.state?.toLowerCase().includes(location.toLowerCase())
      );
    }

    if (compensation && compensation !== 'all') {
      filteredOpportunities = filteredOpportunities.filter(opp => {
        if (compensation === 'paid') return opp.compensation.type === 'paid';
        if (compensation === 'unpaid') return opp.compensation.type === 'volunteer';
        if (compensation === 'stipend') return opp.compensation.type === 'stipend';
        return true;
      });
    }

    // Sort opportunities
    if (sortBy === 'deadline') {
      filteredOpportunities.sort((a, b) => {
        if (!a.applicationDeadline) return 1;
        if (!b.applicationDeadline) return -1;
        return new Date(a.applicationDeadline).getTime() - new Date(b.applicationDeadline).getTime();
      });
    } else if (sortBy === 'featured') {
      filteredOpportunities.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return 0;
      });
    } else if (sortBy === 'popular') {
      filteredOpportunities.sort((a, b) => b.viewCount - a.viewCount);
    }

    // Paginate
    const totalCount = filteredOpportunities.length;
    const paginatedOpportunities = filteredOpportunities.slice(offset, offset + limit);

    return NextResponse.json({
      opportunities: paginatedOpportunities,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch opportunities' },
      { status: 500 }
    );
  }
}