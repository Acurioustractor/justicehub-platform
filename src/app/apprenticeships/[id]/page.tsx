'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useApprenticeship, useUpdateApprenticeshipStatus } from '@/hooks/useApprenticeships';
import { useUser } from '@/contexts/UserContext';
import { 
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Building2,
  Mail,
  FileText,
  CheckCircle2,
  XCircle,
  PauseCircle,
  AlertCircle,
  Edit
} from 'lucide-react';

export default function ApprenticeshipDetailPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const router = useRouter();
  const { user } = useUser();
  const { data: apprenticeship, isLoading, error } = useApprenticeship(params.id);
  const updateStatus = useUpdateApprenticeshipStatus(params.id);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const canEdit = user?.role === 'org_admin' || user?.role === 'platform_admin';

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'active':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'terminated':
        return <XCircle className="h-4 w-4" />;
      case 'on_hold':
        return <PauseCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'terminated':
        return 'bg-red-100 text-red-800';
      case 'on_hold':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !apprenticeship) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load apprenticeship details. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/apprenticeships')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Apprenticeships
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {apprenticeship.contractDetails?.duration || 'Apprenticeship'} Program
            </h1>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(apprenticeship.status)}>
                <span className="flex items-center gap-1">
                  {getStatusIcon(apprenticeship.status)}
                  {apprenticeship.status}
                </span>
              </Badge>
            </div>
          </div>

          {canEdit && (
            <Button onClick={() => router.push(`/apprenticeships/${params.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contract Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Duration</p>
                  <p>{apprenticeship.contractDetails?.duration || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Hours per Week</p>
                  <p>{apprenticeship.contractDetails?.hoursPerWeek || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Start Date</p>
                  <p>{new Date(apprenticeship.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">End Date</p>
                  <p>
                    {apprenticeship.endDate 
                      ? new Date(apprenticeship.endDate).toLocaleDateString()
                      : 'Not specified'}
                  </p>
                </div>
              </div>

              {apprenticeship.contractDetails?.supervisorName && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Supervisor</p>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span>{apprenticeship.contractDetails.supervisorName}</span>
                    {apprenticeship.contractDetails.supervisorEmail && (
                      <>
                        <Mail className="h-4 w-4 text-gray-400 ml-2" />
                        <span>{apprenticeship.contractDetails.supervisorEmail}</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Learning Objectives</CardTitle>
            </CardHeader>
            <CardContent>
              {apprenticeship.contractDetails?.learningObjectives?.length ? (
                <ul className="list-disc list-inside space-y-2">
                  {apprenticeship.contractDetails.learningObjectives.map((objective, index) => (
                    <li key={index}>{objective}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No learning objectives specified</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Responsibilities</CardTitle>
            </CardHeader>
            <CardContent>
              {apprenticeship.contractDetails?.responsibilities?.length ? (
                <ul className="list-disc list-inside space-y-2">
                  {apprenticeship.contractDetails.responsibilities.map((responsibility, index) => (
                    <li key={index}>{responsibility}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No responsibilities specified</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {canEdit && apprenticeship.status === 'pending' && (
                <Button 
                  className="w-full" 
                  onClick={() => updateStatus.mutate({ status: 'active' })}
                >
                  Activate Apprenticeship
                </Button>
              )}
              {canEdit && apprenticeship.status === 'active' && (
                <>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => updateStatus.mutate({ status: 'on_hold' })}
                  >
                    Put On Hold
                  </Button>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => updateStatus.mutate({ status: 'completed' })}
                  >
                    Mark as Completed
                  </Button>
                </>
              )}
              <Button className="w-full" variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                View Contract
              </Button>
            </CardContent>
          </Card>

          {apprenticeship.progressNotes && (
            <Card>
              <CardHeader>
                <CardTitle>Progress Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{apprenticeship.progressNotes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}