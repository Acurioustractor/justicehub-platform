import { ContainedEventDetail, EventData } from '@/components/contained/event-detail';
import { createServiceClient } from '@/lib/supabase/service';

export default async function VipDinnerPage() {
    const supabase = createServiceClient();
    const { data: event } = await supabase
        .from('events')
        .select('*')
        .eq('slug', 'mounty-yarns-vip-dinner')
        .single();

    return <ContainedEventDetail
        slug="mounty-yarns-vip-dinner"
        isVip={true}
        initialEvent={event as EventData}
    />;
}

export const metadata = {
    title: 'VIP Community Dinner - CONTAINED',
    description: 'Private gathering for Community Elders and Leaders.',
    robots: 'noindex, nofollow', // Ensure it's not indexed
};
