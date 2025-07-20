'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser } from '@/contexts/UserContext';
import { 
  Building2, 
  ChevronDown, 
  Check, 
  Plus, 
  Settings,
  Users,
  LogOut,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Organization {
  id: string;
  name: string;
  logo?: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  isPrimary: boolean;
}

interface OrganizationSwitcherProps {
  className?: string;
  showCreateOption?: boolean;
}

export function OrganizationSwitcher({ 
  className,
  showCreateOption = true 
}: OrganizationSwitcherProps) {
  const router = useRouter();
  const { user } = useUser();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);

  // Fetch user's organizations
  useEffect(() => {
    async function fetchOrganizations() {
      try {
        const response = await fetch('/api/organizations');
        if (response.ok) {
          const data = await response.json();
          setOrganizations(data.organizations);
          setCurrentOrgId(data.currentOrganizationId);
        }
      } catch (error) {
        console.error('Error fetching organizations:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      fetchOrganizations();
    }
  }, [user]);

  const currentOrg = organizations.find(org => org.id === currentOrgId);

  const handleSwitchOrganization = async (organizationId: string) => {
    if (organizationId === currentOrgId || isSwitching) return;

    setIsSwitching(true);
    try {
      const response = await fetch('/api/organizations/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId }),
      });

      if (response.ok) {
        setCurrentOrgId(organizationId);
        // Refresh the page to update context
        window.location.reload();
      } else {
        console.error('Failed to switch organization');
      }
    } catch (error) {
      console.error('Error switching organization:', error);
    } finally {
      setIsSwitching(false);
    }
  };

  const handleCreateOrganization = () => {
    router.push('/organizations/new');
  };

  const handleManageOrganization = () => {
    if (currentOrgId) {
      router.push(`/organizations/${currentOrgId}/settings`);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'admin':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (organizations.length === 0) {
    return showCreateOption ? (
      <Button
        variant="outline"
        onClick={handleCreateOrganization}
        className={className}
      >
        <Plus className="h-4 w-4 mr-2" />
        Create Organization
      </Button>
    ) : null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className={cn('w-[250px] justify-between', className)}
          disabled={isSwitching}
        >
          <div className="flex items-center gap-2 truncate">
            {currentOrg?.logo ? (
              <Avatar className="h-5 w-5">
                <AvatarImage src={currentOrg.logo} />
                <AvatarFallback>
                  <Building2 className="h-3 w-3" />
                </AvatarFallback>
              </Avatar>
            ) : (
              <Building2 className="h-4 w-4" />
            )}
            <span className="truncate">
              {currentOrg?.name || 'Select Organization'}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 ml-2 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[250px]" align="start">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Organization list */}
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => handleSwitchOrganization(org.id)}
            className="cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                {org.logo ? (
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={org.logo} />
                    <AvatarFallback>
                      <Building2 className="h-3 w-3" />
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <Building2 className="h-4 w-4" />
                )}
                <div className="flex flex-col">
                  <span className="text-sm">{org.name}</span>
                  <Badge 
                    variant={getRoleBadgeVariant(org.role)} 
                    className="text-xs h-4 px-1"
                  >
                    {org.role}
                  </Badge>
                </div>
              </div>
              {org.id === currentOrgId && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        {/* Actions */}
        {currentOrg && ['owner', 'admin'].includes(currentOrg.role) && (
          <DropdownMenuItem onClick={handleManageOrganization}>
            <Settings className="h-4 w-4 mr-2" />
            Manage Organization
          </DropdownMenuItem>
        )}

        {currentOrg && ['owner', 'admin'].includes(currentOrg.role) && (
          <DropdownMenuItem 
            onClick={() => router.push(`/organizations/${currentOrgId}/members`)}
          >
            <Users className="h-4 w-4 mr-2" />
            Manage Members
          </DropdownMenuItem>
        )}

        {showCreateOption && (
          <DropdownMenuItem onClick={handleCreateOrganization}>
            <Plus className="h-4 w-4 mr-2" />
            Create Organization
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => handleSwitchOrganization('')}
          className="text-gray-500"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Personal Account
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}