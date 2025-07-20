'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCreateOrganization } from '@/hooks/useOrganizations';
import { 
  ArrowLeft, 
  Building2, 
  Loader2,
  Globe,
  FileText,
  Sparkles
} from 'lucide-react';

export default function NewOrganizationPage() {
  const router = useRouter();
  const createOrganization = useCreateOrganization();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'nonprofit',
    website: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createOrganization.mutateAsync(formData);
    } catch (error) {
      console.error('Error creating organization:', error);
    }
  };

  const isValid = formData.name.trim().length >= 3;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <h1 className="text-3xl font-bold mb-2">Create Organization</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Set up a new organization to collaborate with your team
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Organization Details</CardTitle>
            <CardDescription>
              Provide basic information about your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="name">
                Organization Name <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter organization name"
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                This will be displayed across the platform
              </p>
            </div>

            <div>
              <Label htmlFor="type">Organization Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nonprofit">Non-Profit</SelectItem>
                  <SelectItem value="education">Educational Institution</SelectItem>
                  <SelectItem value="government">Government Agency</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                  <SelectItem value="community">Community Group</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tell us about your organization's mission and work"
                  className="pl-10 min-h-[100px]"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="website">Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.org"
                  className="pl-10"
                />
              </div>
            </div>

            {createOrganization.error && (
              <Alert variant="destructive">
                <AlertDescription>
                  {createOrganization.error.message}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-purple-500 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium mb-1">What happens next?</h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• You'll be the owner of this organization</li>
                  <li>• You can invite team members to collaborate</li>
                  <li>• All data will be scoped to your organization</li>
                  <li>• You can customize settings and permissions</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={createOrganization.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!isValid || createOrganization.isPending}
          >
            {createOrganization.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Building2 className="mr-2 h-4 w-4" />
                Create Organization
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}