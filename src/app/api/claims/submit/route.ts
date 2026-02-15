import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { sanitizeInput, sanitizeUrl } from '@/lib/security';

// Allowed roles for claims
const ALLOWED_ROLES = ['staff', 'volunteer', 'board', 'founder', 'advisor', 'alumni'];

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const body = await request.json();
        const { programId, role, roleDescription, proofUrl } = body;

        // Validate required fields
        if (!programId || typeof programId !== 'string') {
            return NextResponse.json({ error: 'Program ID is required' }, { status: 400 });
        }

        // Validate programId is a valid UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(programId)) {
            return NextResponse.json({ error: 'Invalid program ID format' }, { status: 400 });
        }

        // Validate and sanitize role
        const sanitizedRole = role ? String(role).toLowerCase() : 'staff';
        if (!ALLOWED_ROLES.includes(sanitizedRole)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        // Sanitize role description
        const sanitizedRoleDescription = roleDescription
            ? sanitizeInput(String(roleDescription), { maxLength: 500, allowNewlines: false })
            : null;

        // Validate and sanitize proof URL
        const sanitizedProofUrl = proofUrl ? sanitizeUrl(String(proofUrl)) : null;

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
                role: sanitizedRole,
                role_description: sanitizedRoleDescription,
                verification_status: 'pending',
                verification_notes: sanitizedProofUrl ? `Proof: ${sanitizedProofUrl}` : 'No proof provided'
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
