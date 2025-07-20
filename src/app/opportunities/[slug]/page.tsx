'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUserContext } from '@/contexts/UserContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Users,
  DollarSign,
  Building,
  Briefcase,
  CheckCircle,
  XCircle,
  Bookmark,
  Share2,
  Eye,
  FileText,
  Mail,
  Globe,
  Phone,
  ExternalLink,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useQuery, useMutation } from '@tanstack/react-query';

export default function OpportunityPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUserContext();
  const slug = params.slug as string;
  
  const [showApplicationModal, setShowApplicationModal] = useState(false);

  // Fetch opportunity by slug
  const { data: opportunity, isLoading, error, refetch } = useQuery({
    queryKey: ['opportunity', slug],
    queryFn: async () => {
      // First, get the opportunity ID from slug
      const searchResponse = await fetch(`/api/opportunities?search=${slug}&limit=1`);
      if (!searchResponse.ok) throw new Error('Failed to search opportunity');
      const searchData = await searchResponse.json();
      
      if (!searchData.opportunities || searchData.opportunities.length === 0) {
        throw new Error('Opportunity not found');
      }
      
      const opportunityId = searchData.opportunities[0].id;
      
      // Then fetch full details
      const response = await fetch(`/api/opportunities/${opportunityId}`);
      if (!response.ok) throw new Error('Failed to fetch opportunity');
      return response.json();
    },
  });

  // Save/unsave mutation
  const saveMutation = useMutation({
    mutationFn: async (saved: boolean) => {
      if (!opportunity) return;
      
      const response = await fetch(`/api/opportunities/${opportunity.id}/save`, {
        method: saved ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      
      if (!response.ok) throw new Error('Failed to update saved status');
      return response.json();
    },
    onSuccess: () => {
      refetch();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading opportunity...</p>
        </div>
      </div>
    );
  }

  if (error || !opportunity) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Opportunity Not Found</CardTitle>
            <CardDescription>The opportunity you're looking for doesn't exist.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/opportunities')}>
              Browse Opportunities
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const daysUntilDeadline = opportunity.applicationDeadline
    ? Math.ceil((new Date(opportunity.applicationDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  
  const isExpired = daysUntilDeadline !== null && daysUntilDeadline < 0;
  const isFull = opportunity.spotsAvailable <= 0;
  const canApply = !isExpired && !isFull && !opportunity.application;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Opportunities
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <Card>
              <CardContent className="p-8">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge variant="secondary" className="text-sm">
                        {opportunity.type}
                      </Badge>
                      {opportunity.featured && (
                        <Badge variant="default">Featured</Badge>
                      )}
                      {opportunity.application && (
                        <Badge variant="success">
                          {opportunity.application.status}
                        </Badge>
                      )}
                    </div>
                    <h1 className="text-3xl font-bold mb-4">{opportunity.title}</h1>
                    <div className="flex items-center gap-4 text-gray-600">
                      <Link 
                        href={`/organizations/${opportunity.organization.id}`}
                        className="flex items-center gap-2 hover:text-primary"
                      >
                        <Building className="h-5 w-5" />
                        {opportunity.organization.name}
                      </Link>
                      <div className="flex items-center gap-2">
                        <Eye className="h-5 w-5" />
                        {opportunity.viewCount} views
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => saveMutation.mutate(opportunity.saved)}
                      disabled={!user}
                    >
                      <Bookmark 
                        className={`h-5 w-5 ${opportunity.saved ? 'fill-current' : ''}`} 
                      />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* Key Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="font-medium">
                        {opportunity.location.type === 'remote' 
                          ? 'Remote' 
                          : `${opportunity.location.city}, ${opportunity.location.state}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Compensation</p>
                      <p className="font-medium">
                        {opportunity.compensation.type === 'paid' && opportunity.compensation.amount
                          ? `$${opportunity.compensation.amount.toLocaleString()} ${opportunity.compensation.frequency}`
                          : opportunity.compensation.type}
                      </p>
                    </div>
                  </div>

                  {opportunity.duration && (
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Duration</p>
                        <p className="font-medium">
                          {opportunity.duration.length} {opportunity.duration.unit}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Availability</p>
                      <p className="font-medium">
                        {opportunity.spotsAvailable} of {opportunity.spots} spots
                      </p>
                    </div>
                  </div>

                  {opportunity.applicationDeadline && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Application Deadline</p>
                        <p className={`font-medium ${isExpired ? 'text-red-600' : daysUntilDeadline && daysUntilDeadline < 7 ? 'text-orange-600' : ''}`}>
                          {format(new Date(opportunity.applicationDeadline), 'MMMM d, yyyy')}
                          {daysUntilDeadline !== null && (
                            <span className="text-sm ml-1">
                              ({isExpired ? 'Expired' : `${daysUntilDeadline} days left`})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  {opportunity.startDate && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Start Date</p>
                        <p className="font-medium">
                          {format(new Date(opportunity.startDate), 'MMMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="requirements">Requirements</TabsTrigger>
                <TabsTrigger value="application">Application</TabsTrigger>
                <TabsTrigger value="organization">Organization</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <Card>
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                      {opportunity.description.split('\n').map((paragraph: string, idx: number) => (
                        <p key={idx}>{paragraph}</p>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {opportunity.responsibilities.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Responsibilities</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {opportunity.responsibilities.map((item: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {opportunity.benefits.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Benefits</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {opportunity.benefits.map((benefit: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="requirements">
                <Card>
                  <CardHeader>
                    <CardTitle>Requirements</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {opportunity.requirements.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">Required</h4>
                        <ul className="space-y-2">
                          {opportunity.requirements.map((req: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                              <span>{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {opportunity.qualifications.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">Preferred Qualifications</h4>
                        <ul className="space-y-2">
                          {opportunity.qualifications.map((qual: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                              <span>{qual}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {opportunity.skills.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">Required Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {opportunity.skills.map((skill: string, idx: number) => (
                            <Badge key={idx} variant="secondary">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {(opportunity.minAge || opportunity.maxAge) && (
                      <div>
                        <h4 className="font-medium mb-3">Age Requirements</h4>
                        <p>
                          {opportunity.minAge && `Minimum age: ${opportunity.minAge}`}
                          {opportunity.minAge && opportunity.maxAge && ' • '}
                          {opportunity.maxAge && `Maximum age: ${opportunity.maxAge}`}
                        </p>
                      </div>
                    )}

                    {opportunity.eligibilityCriteria.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">Eligibility Criteria</h4>
                        <ul className="space-y-2">
                          {opportunity.eligibilityCriteria.map((criteria: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                              <span>{criteria}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="application">
                <Card>
                  <CardHeader>
                    <CardTitle>How to Apply</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {opportunity.applicationInstructions && (
                      <div>
                        <h4 className="font-medium mb-2">Instructions</h4>
                        <p className="text-gray-700 dark:text-gray-300">
                          {opportunity.applicationInstructions}
                        </p>
                      </div>
                    )}

                    <div className="space-y-3">
                      {opportunity.applicationUrl && (
                        <div className="flex items-center gap-3">
                          <Globe className="h-5 w-5 text-gray-400" />
                          <a 
                            href={opportunity.applicationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            Apply on External Website
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      )}

                      {opportunity.applicationEmail && (
                        <div className="flex items-center gap-3">
                          <Mail className="h-5 w-5 text-gray-400" />
                          <a 
                            href={`mailto:${opportunity.applicationEmail}`}
                            className="text-primary hover:underline"
                          >
                            {opportunity.applicationEmail}
                          </a>
                        </div>
                      )}
                    </div>

                    {opportunity.contactName && (
                      <div className="pt-4 border-t">
                        <h4 className="font-medium mb-2">Contact Person</h4>
                        <p className="font-medium">{opportunity.contactName}</p>
                        {opportunity.contactEmail && (
                          <a 
                            href={`mailto:${opportunity.contactEmail}`}
                            className="text-sm text-primary hover:underline"
                          >
                            {opportunity.contactEmail}
                          </a>
                        )}
                        {opportunity.contactPhone && (
                          <p className="text-sm text-gray-600">{opportunity.contactPhone}</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="organization">
                <Card>
                  <CardHeader>
                    <CardTitle>About {opportunity.organization.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      {opportunity.organization.description || 'No description available.'}
                    </p>
                    <Link href={`/organizations/${opportunity.organization.id}`}>
                      <Button variant="outline">
                        View Organization Profile
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Apply Card */}
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Ready to Apply?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isExpired ? (
                  <div className="text-center py-4">
                    <XCircle className="h-12 w-12 mx-auto mb-2 text-red-500" />
                    <p className="text-red-600 font-medium">Application Deadline Passed</p>
                  </div>
                ) : isFull ? (
                  <div className="text-center py-4">
                    <XCircle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-600 font-medium">No Spots Available</p>
                  </div>
                ) : opportunity.application ? (
                  <div className="text-center py-4">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                    <p className="text-green-600 font-medium mb-2">Application Submitted</p>
                    <p className="text-sm text-gray-600">
                      Status: {opportunity.application.status}
                    </p>
                    {opportunity.application.submittedAt && (
                      <p className="text-xs text-gray-500">
                        Submitted {format(new Date(opportunity.application.submittedAt), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Spots Available</span>
                        <span className="font-medium">
                          {opportunity.spotsAvailable}/{opportunity.spots}
                        </span>
                      </div>
                      <Progress 
                        value={(opportunity.spots - opportunity.spotsAvailable) / opportunity.spots * 100} 
                      />
                    </div>

                    {opportunity.applicationDeadline && daysUntilDeadline !== null && (
                      <div className={`text-center py-2 px-3 rounded-lg ${
                        daysUntilDeadline < 3 ? 'bg-red-50 text-red-700' :
                        daysUntilDeadline < 7 ? 'bg-orange-50 text-orange-700' :
                        'bg-blue-50 text-blue-700'
                      }`}>
                        <p className="font-medium">{daysUntilDeadline} days left to apply</p>
                      </div>
                    )}

                    {user ? (
                      opportunity.applicationUrl ? (
                        <a 
                          href={opportunity.applicationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <Button className="w-full" size="lg">
                            Apply Now
                            <ExternalLink className="h-4 w-4 ml-2" />
                          </Button>
                        </a>
                      ) : (
                        <Button 
                          className="w-full" 
                          size="lg"
                          onClick={() => setShowApplicationModal(true)}
                        >
                          Apply Now
                        </Button>
                      )
                    ) : (
                      <Link href="/auth/signin">
                        <Button className="w-full" size="lg">
                          Sign In to Apply
                        </Button>
                      </Link>
                    )}
                  </>
                )}

                {/* Tags */}
                {opportunity.tags.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Tags</p>
                    <div className="flex flex-wrap gap-1">
                      {opportunity.tags.map((tag: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Similar Opportunities */}
            {opportunity.similarOpportunities?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Similar Opportunities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {opportunity.similarOpportunities.map((opp: any) => (
                    <Link 
                      key={opp.id} 
                      href={`/opportunities/${opp.id}`}
                      className="block hover:bg-gray-50 dark:hover:bg-gray-800 p-3 rounded-lg -m-3"
                    >
                      <h4 className="font-medium text-sm mb-1 line-clamp-1">
                        {opp.title}
                      </h4>
                      <p className="text-xs text-gray-600">
                        {opp.organization} • {opp.location.type === 'remote' ? 'Remote' : opp.location.city}
                      </p>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}