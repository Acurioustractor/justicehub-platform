'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useApprenticeships } from '@/hooks/useApprenticeships';
import type { ApprenticeshipFilters, Apprenticeship } from '@/types/apprenticeship';
import { 
  Calendar, 
  Building2, 
  User, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  PauseCircle,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

interface ApprenticeshipListProps {
  filters?: ApprenticeshipFilters;
  showFilters?: boolean;
  onSelectApprenticeship?: (apprenticeship: any) => void;
}

export function ApprenticeshipList({ 
  filters: initialFilters = {}, 
  showFilters = true,
  onSelectApprenticeship 
}: ApprenticeshipListProps) {
  const [filters, setFilters] = useState<ApprenticeshipFilters>(initialFilters);
  const { data: apprenticeships, isLoading, error } = useApprenticeships(filters);

  const getStatusIcon = (status: Apprenticeship['status']) => {
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
    }
  };

  const getStatusColor = (status: Apprenticeship['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'terminated':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'on_hold':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load apprenticeships. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (!apprenticeships || apprenticeships.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">No apprenticeships found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {showFilters && (
        <div className="flex gap-4">
          <Select
            value={filters.status?.[0] || 'all'}
            onValueChange={(value) => {
              setFilters({
                ...filters,
                status: value === 'all' ? undefined : [value as Apprenticeship['status']],
              });
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-4">
        {apprenticeships.map((apprenticeship) => (
          <Card key={apprenticeship.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getStatusColor(apprenticeship.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(apprenticeship.status)}
                        {apprenticeship.status}
                      </span>
                    </Badge>
                    {apprenticeship.opportunity && (
                      <span className="text-sm text-gray-500">
                        from {apprenticeship.opportunity.title}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-semibold mb-2">
                    {apprenticeship.contractDetails?.duration || 'Apprenticeship'} Program
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {apprenticeship.youth && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <User className="h-4 w-4" />
                        <span>
                          {apprenticeship.youth.firstName} {apprenticeship.youth.lastName}
                        </span>
                      </div>
                    )}

                    {apprenticeship.organization && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Building2 className="h-4 w-4" />
                        <span>{apprenticeship.organization.name}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {formatDate(apprenticeship.startDate)}
                        {apprenticeship.endDate && ` - ${formatDate(apprenticeship.endDate)}`}
                      </span>
                    </div>
                  </div>

                  {apprenticeship.contractDetails?.supervisorName && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      Supervisor: {apprenticeship.contractDetails.supervisorName}
                    </p>
                  )}
                </div>

                <div className="ml-4">
                  {onSelectApprenticeship ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectApprenticeship(apprenticeship)}
                    >
                      View Details
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Link href={`/apprenticeships/${apprenticeship.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}