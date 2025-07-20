'use client';

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { 
  Globe, 
  Building, 
  Users, 
  Eye,
  Lock,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

type PrivacyLevel = 'public' | 'organization' | 'mentors' | 'private' | 'anonymous';

interface PrivacySelectorProps {
  visibility: string;
  onChange: (value: string) => void;
}

interface PrivacyOption {
  value: PrivacyLevel;
  label: string;
  description: string;
  icon: any;
  iconColor: string;
}

const privacyOptions: PrivacyOption[] = [
  {
    value: 'public',
    label: 'Public',
    description: 'Anyone can view this story',
    icon: Globe,
    iconColor: 'text-green-600'
  },
  {
    value: 'organization',
    label: 'Organization Only',
    description: 'Only members of your organization can view',
    icon: Building,
    iconColor: 'text-blue-600'
  },
  {
    value: 'mentors',
    label: 'Mentors Only',
    description: 'Only your connected mentors can view',
    icon: Users,
    iconColor: 'text-purple-600'
  },
  {
    value: 'private',
    label: 'Private',
    description: 'Only you can view this story',
    icon: Lock,
    iconColor: 'text-gray-600'
  },
  {
    value: 'anonymous',
    label: 'Anonymous Public',
    description: 'Public but your identity is hidden',
    icon: Eye,
    iconColor: 'text-orange-600'
  }
];

export function PrivacySelector({ visibility, onChange }: PrivacySelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-medium">Privacy Settings</Label>
        <p className="text-sm text-gray-500 mt-1">
          Choose who can see your story
        </p>
      </div>

      <RadioGroup value={visibility} onValueChange={onChange}>
        <div className="space-y-3">
          {privacyOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = visibility === option.value;
            
            return (
              <Card
                key={option.value}
                className={cn(
                  "relative cursor-pointer transition-all",
                  isSelected 
                    ? "border-primary shadow-sm" 
                    : "hover:border-gray-400"
                )}
              >
                <label
                  htmlFor={option.value}
                  className="flex items-start p-4 cursor-pointer"
                >
                  <RadioGroupItem
                    value={option.value}
                    id={option.value}
                    className="mt-1"
                  />
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Icon className={cn("h-5 w-5", option.iconColor)} />
                        <span className="font-medium">{option.label}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {option.description}
                    </p>
                  </div>
                </label>
              </Card>
            );
          })}
        </div>
      </RadioGroup>

      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <div className="p-4 flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-900 dark:text-blue-100">
              Privacy Best Practices
            </p>
            <ul className="mt-2 space-y-1 text-blue-800 dark:text-blue-200">
              <li>• Consider sharing publicly to inspire others</li>
              <li>• Use organization-only for sensitive but collaborative content</li>
              <li>• Choose mentors-only for personal growth discussions</li>
              <li>• Keep drafts private until you're ready to share</li>
              <li>• Anonymous sharing lets you be open while protecting identity</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}