'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ApprenticeshipList } from '@/components/apprenticeships/ApprenticeshipList';
import { useUserContext } from '@/contexts/UserContext';
import type { ApprenticeshipFilters } from '@/types/apprenticeship';
import { 
  Plus, 
  Briefcase, 
  GraduationCap,
  Building2,
  TrendingUp,
  Users
} from 'lucide-react';

export default function ApprenticeshipsPage() {
  const router = useRouter();
  const { user } = useUserContext();
  const [activeTab, setActiveTab] = useState('all');

  const canCreateApprenticeship = user?.role === 'org_admin' || user?.role === 'platform_admin';

  const getFilters = (): ApprenticeshipFilters => {
    const filters: ApprenticeshipFilters = {};
    
    if (activeTab !== 'all') {
      filters.status = [activeTab as any];
    }

    // Apply role-based filters
    if (user?.role === 'youth' && user.youthProfileId) {
      filters.youthProfileId = user.youthProfileId;
    } else if (user?.role === 'org_admin' && user.organizationId) {
      filters.organizationId = user.organizationId;
    }

    return filters;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Apprenticeships</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage and track apprenticeship programs
            </p>
          </div>
          
          {canCreateApprenticeship && (
            <Button onClick={() => router.push('/apprenticeships/new')}>
              <Plus className="mr-2 h-4 w-4" />
              New Apprenticeship
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Programs
                  </p>
                  <p className="text-2xl font-bold">12</p>
                </div>
                <Briefcase className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Active
                  </p>
                  <p className="text-2xl font-bold">8</p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Completed
                  </p>
                  <p className="text-2xl font-bold">3</p>
                </div>
                <GraduationCap className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Success Rate
                  </p>
                  <p className="text-2xl font-bold">85%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="on_hold">On Hold</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <ApprenticeshipList 
            filters={getFilters()} 
            showFilters={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}