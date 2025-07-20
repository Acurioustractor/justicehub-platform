'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare,
  User,
  Clock,
  Target,
  Heart,
  CheckCircle,
  Loader2
} from 'lucide-react';

interface ConnectionRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: ConnectionRequest) => Promise<void>;
  mentor: {
    id: string;
    name: string;
    role: string;
    organization: string;
    avatar?: string;
    sharedSkills?: string[];
    sharedInterests?: string[];
  };
}

export interface ConnectionRequest {
  mentorId: string;
  message: string;
  meetingPreference: 'virtual' | 'in-person' | 'both';
  goalType: 'skill-development' | 'career-guidance' | 'personal-growth' | 'project-collaboration';
  timeCommitment: 'low' | 'medium' | 'high';
  urgency: 'low' | 'medium' | 'high';
}

export function ConnectionRequestModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  mentor 
}: ConnectionRequestModalProps) {
  const [request, setRequest] = useState<ConnectionRequest>({
    mentorId: mentor.id,
    message: '',
    meetingPreference: 'both',
    goalType: 'skill-development',
    timeCommitment: 'medium',
    urgency: 'medium'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!request.message.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(request);
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setRequest({
          mentorId: mentor.id,
          message: '',
          meetingPreference: 'both',
          goalType: 'skill-development',
          timeCommitment: 'medium',
          urgency: 'medium'
        });
      }, 2000);
    } catch (error) {
      console.error('Error submitting connection request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="h-16 w-16 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Request Sent!</h3>
            <p className="text-gray-600 text-center">
              Your connection request has been sent to {mentor.name}. 
              You'll be notified when they respond.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5" />
            Request Connection
          </DialogTitle>
          <DialogDescription>
            Send a personalized message to connect with {mentor.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Mentor Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  {mentor.avatar ? (
                    <img 
                      src={mentor.avatar} 
                      alt={mentor.name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-6 w-6 text-gray-500" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{mentor.name}</h4>
                  <p className="text-sm text-gray-600">{mentor.role}</p>
                  <p className="text-sm text-gray-500">{mentor.organization}</p>
                  
                  {(mentor.sharedSkills?.length || mentor.sharedInterests?.length) && (
                    <div className="mt-2 space-y-1">
                      {mentor.sharedSkills && mentor.sharedSkills.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Shared skills:</span>
                          <div className="flex gap-1">
                            {mentor.sharedSkills.slice(0, 2).map((skill, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {mentor.sharedInterests && mentor.sharedInterests.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Shared interests:</span>
                          <div className="flex gap-1">
                            {mentor.sharedInterests.slice(0, 2).map((interest, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {interest}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Personal Message *</Label>
            <Textarea
              id="message"
              placeholder="Introduce yourself and explain why you'd like to connect with this mentor..."
              value={request.message}
              onChange={(e) => setRequest(prev => ({ ...prev, message: e.target.value }))}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">
              Tip: Mention specific skills or goals you'd like help with, and why you think this mentor would be a good fit.
            </p>
          </div>

          {/* Connection Preferences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Primary Goal
              </Label>
              <Select
                value={request.goalType}
                onValueChange={(value: any) => setRequest(prev => ({ ...prev, goalType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="skill-development">Skill Development</SelectItem>
                  <SelectItem value="career-guidance">Career Guidance</SelectItem>
                  <SelectItem value="personal-growth">Personal Growth</SelectItem>
                  <SelectItem value="project-collaboration">Project Collaboration</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Meeting Preference
              </Label>
              <Select
                value={request.meetingPreference}
                onValueChange={(value: any) => setRequest(prev => ({ ...prev, meetingPreference: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="virtual">Virtual meetings</SelectItem>
                  <SelectItem value="in-person">In-person meetings</SelectItem>
                  <SelectItem value="both">Both virtual and in-person</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Time Commitment
              </Label>
              <Select
                value={request.timeCommitment}
                onValueChange={(value: any) => setRequest(prev => ({ ...prev, timeCommitment: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low (1-2 hours/month)</SelectItem>
                  <SelectItem value="medium">Medium (3-4 hours/month)</SelectItem>
                  <SelectItem value="high">High (5+ hours/month)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Urgency
              </Label>
              <Select
                value={request.urgency}
                onValueChange={(value: any) => setRequest(prev => ({ ...prev, urgency: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Whenever convenient</SelectItem>
                  <SelectItem value="medium">Medium - Within a few weeks</SelectItem>
                  <SelectItem value="high">High - As soon as possible</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tips */}
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                Tips for a successful connection:
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Be specific about what you hope to learn or achieve</li>
                <li>• Mention why you chose this particular mentor</li>
                <li>• Be respectful of their time and expertise</li>
                <li>• Show enthusiasm and commitment to the mentoring relationship</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!request.message.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Request
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}