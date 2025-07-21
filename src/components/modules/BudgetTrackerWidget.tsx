'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Building, 
  AlertTriangle,
  Calendar,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BudgetData {
  totalBudget: number;
  spent: number;
  detained: {
    cost: number;
    count: number;
    dailyCost: number;
  };
  community: {
    cost: number;
    count: number;
    dailyCost: number;
  };
  indigenous: {
    populationPercent: number;
    detentionPercent: number;
    overrepresentation: number;
  };
  trends: {
    month: string;
    spending: number;
    detainedCount: number;
  }[];
  lastUpdated: string;
}

// Mock data - will be replaced with actual API calls
const mockBudgetData: BudgetData = {
  totalBudget: 450000000, // $450M
  spent: 280000000, // $280M
  detained: {
    cost: 850000, // $850k per year per youth
    count: 180,
    dailyCost: 2329, // $2,329 per day
  },
  community: {
    cost: 85000, // $85k per year per youth
    count: 420,
    dailyCost: 233, // $233 per day
  },
  indigenous: {
    populationPercent: 4.6,
    detentionPercent: 65.2,
    overrepresentation: 14.2,
  },
  trends: [
    { month: 'Jan', spending: 35000000, detainedCount: 175 },
    { month: 'Feb', spending: 38000000, detainedCount: 182 },
    { month: 'Mar', spending: 42000000, detainedCount: 190 },
    { month: 'Apr', spending: 39000000, detainedCount: 185 },
    { month: 'May', spending: 41000000, detainedCount: 180 },
    { month: 'Jun', spending: 45000000, detainedCount: 188 },
  ],
  lastUpdated: '2025-07-20T10:30:00Z',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-AU').format(num);
}

export function BudgetTrackerWidget() {
  const [data, setData] = useState<BudgetData>(mockBudgetData);
  const [isLoading, setIsLoading] = useState(false);

  const budgetUtilization = (data.spent / data.totalBudget) * 100;
  const costSavingPotential = (data.detained.count * (data.detained.cost - data.community.cost));

  return (
    <div className="w-full space-y-6">
      {/* Header with Last Updated */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">QLD Youth Justice Budget Tracker</h2>
          <p className="text-gray-600">
            Last updated: {new Date(data.lastUpdated).toLocaleDateString('en-AU', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Budget</p>
                <p className="text-2xl font-bold">{formatCurrency(data.totalBudget)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-4">
              <Progress value={budgetUtilization} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">
                {budgetUtilization.toFixed(1)}% utilized
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Youth Detained</p>
                <p className="text-2xl font-bold">{formatNumber(data.detained.count)}</p>
              </div>
              <Building className="h-8 w-8 text-orange-600" />
            </div>
            <div className="mt-2">
              <p className="text-xs text-gray-500">
                {formatCurrency(data.detained.dailyCost)} per day each
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Community Programs</p>
                <p className="text-2xl font-bold">{formatNumber(data.community.count)}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-2">
              <p className="text-xs text-gray-500">
                {formatCurrency(data.community.dailyCost)} per day each
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Potential Savings</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(costSavingPotential)}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-2">
              <p className="text-xs text-gray-500">
                If moved to community programs
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cost Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Comparison: Detention vs Community</CardTitle>
          <CardDescription>
            Annual cost per young person in different program types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div>
                <h4 className="font-semibold">Youth Detention</h4>
                <p className="text-sm text-gray-600">Secure facilities</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(data.detained.cost)}
                </p>
                <p className="text-sm text-gray-500">per year</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <h4 className="font-semibold">Community Programs</h4>
                <p className="text-sm text-gray-600">Supervised in community</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(data.community.cost)}
                </p>
                <p className="text-sm text-gray-500">per year</p>
              </div>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-lg">
                <span className="font-bold text-blue-600">
                  {((data.detained.cost / data.community.cost) - 1).toFixed(1)}x
                </span>
                {' '}more expensive to detain youth
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Indigenous Overrepresentation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Indigenous Youth Overrepresentation
          </CardTitle>
          <CardDescription>
            Comparing population percentage to detention rates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                {data.indigenous.populationPercent}%
              </p>
              <p className="text-sm text-gray-600">of QLD population</p>
            </div>
            
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">
                {data.indigenous.detentionPercent}%
              </p>
              <p className="text-sm text-gray-600">of youth in detention</p>
            </div>
            
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">
                {data.indigenous.overrepresentation}x
              </p>
              <p className="text-sm text-gray-600">overrepresented</p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Key Finding:</strong> Indigenous young people are {data.indigenous.overrepresentation}x 
              overrepresented in youth detention compared to their population percentage.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Budget documents updated</p>
                <p className="text-sm text-gray-600">Queensland Treasury released Q2 spending report</p>
              </div>
              <Badge variant="secondary">2 hours ago</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Parliament QON published</p>
                <p className="text-sm text-gray-600">New questions on notice about youth justice funding</p>
              </div>
              <Badge variant="secondary">1 day ago</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Court statistics released</p>
                <p className="text-sm text-gray-600">Monthly youth court appearance data</p>
              </div>
              <Badge variant="secondary">3 days ago</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}