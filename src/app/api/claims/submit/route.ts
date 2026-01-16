
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const body = await request.json();
        const { programId, role, roleDescription, proofUrl } = body;

        // 1. Check Auth
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Get User's Public Profile
        const { data: profile, error: profileError } = await supabase
            .from('public_profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({ error: 'Profile not found. Please create a profile first.' }, { status: 404 });
        }

        // 3. Insert Claim (registered_services_profiles)
        const { data, error } = await supabase
            .from('registered_services_profiles')
            .insert({
                program_id: programId,
                public_profile_id: profile.id,
                role: role || 'staff', // Default
                role_description: roleDescription,
                verification_status: 'pending',
                verification_notes: proofUrl ? `Proof: ${proofUrl}` : 'No proof provided'
            })
            .select()
            .single();

        if (error) {
            // Check for duplicate
            if (error.code === '23505') { // Unique violation
                return NextResponse.json({ error: 'You have already claimed this program.' }, { status: 409 });
            }
            throw error;
        }

        return NextResponse.json({
            success: true,
            message: 'Claim submitted successfully. Pending verification.',
            claim: data
        });

    } catch (error) {
        console.error('Error submitting claim:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
