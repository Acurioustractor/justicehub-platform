import { Navigation } from '@/components/ui/navigation';
import { StorytellerTagger } from '@/components/admin/StorytellerTagger';

export const metadata = {
  title: 'Storyteller Tags | Admin',
};

export default function StorytellerTagsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <StorytellerTagger />
    </div>
  );
}
