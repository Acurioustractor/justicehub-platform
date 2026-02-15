import { createServiceClient } from '@/lib/supabase/service';
import Link from 'next/link';
import Image from 'next/image';
import { Navigation, Footer } from '@/components/ui/navigation';
import { Users, Mail, ExternalLink, ArrowRight, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface CoEPerson {
  id: string;
  role: string;          // New standardized field
  role_title?: string;   // Legacy field (backward compatibility)
  expertise_area: string;
  display_order: number;
  profile: {
    id: string;
    slug: string;
    full_name: string;
    bio: string | null;
    tagline: string | null;
    photo_url: string | null;
    role_tags: string[] | null;
    email: string | null;
    website_url: string | null;
    social_links: Record<string, string> | null;
  };
}

async function getKeyPeople(): Promise<CoEPerson[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('coe_key_people')
    .select(`
      id,
      role,
      role_title,
      expertise_area,
      display_order,
      profile:public_profiles(
        id, slug, full_name, bio, tagline, photo_url, role_tags, email, website_url, social_links
      )
    `)
    .order('display_order');

  if (error || !data) {
    console.error('Error fetching CoE people:', error?.message);
    return [];
  }

  return data as unknown as CoEPerson[];
}

export default async function CoEPeoplePage() {
  const keyPeople = await getKeyPeople();

  // Split into leadership and team
  const leadership = keyPeople.slice(0, 6);
  const team = keyPeople.slice(6);

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="header-offset">
        {/* Hero */}
        <section className="section-padding bg-gradient-to-br from-eucalyptus-50 via-sand-50 to-ochre-50 border-b-2 border-black">
          <div className="container-justice">
            <Link
              href="/centre-of-excellence"
              className="inline-flex items-center gap-2 font-bold text-gray-700 hover:text-black mb-6 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Centre of Excellence
            </Link>

            <div className="inline-block px-4 py-2 bg-eucalyptus-100 border-2 border-black mb-6">
              <span className="font-bold">KEY PEOPLE</span>
            </div>

            <h1 className="headline-truth mb-6">
              Leadership & Experts
            </h1>

            <p className="text-xl text-gray-700 max-w-4xl leading-relaxed">
              Our Centre of Excellence brings together researchers, practitioners, advocates,
              and people with lived experience to build the evidence base for what works
              in youth justice.
            </p>
          </div>
        </section>

        {/* Leadership */}
        <section className="py-16 border-b-2 border-black">
          <div className="container-justice">
            <h2 className="text-3xl font-bold mb-2">Leadership Team</h2>
            <p className="text-earth-600 mb-8">
              The people guiding our research agenda and strategic direction
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {leadership.map((person) => (
                <PersonCard key={person.id} person={person} featured />
              ))}
            </div>
          </div>
        </section>

        {/* Extended Team */}
        {team.length > 0 && (
          <section className="py-16 border-b-2 border-black bg-sand-50">
            <div className="container-justice">
              <h2 className="text-3xl font-bold mb-2">Extended Team</h2>
              <p className="text-earth-600 mb-8">
                Advisors, coordinators, and partners who contribute to our work
              </p>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {team.map((person) => (
                  <PersonCard key={person.id} person={person} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Advisory Groups */}
        <section className="py-16 border-b-2 border-black">
          <div className="container-justice">
            <h2 className="text-3xl font-bold mb-8">Advisory Groups</h2>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="border-2 border-black p-6 bg-eucalyptus-50">
                <h3 className="text-xl font-bold mb-3">Indigenous Advisory Circle</h3>
                <p className="text-earth-700 mb-4">
                  Elders and community leaders ensuring cultural safety and Indigenous
                  self-determination in all our work.
                </p>
                <div className="text-sm text-earth-600">
                  Chaired by Patricia Ann Miller
                </div>
              </div>

              <div className="border-2 border-black p-6 bg-ochre-50">
                <h3 className="text-xl font-bold mb-3">Youth Advisory Panel</h3>
                <p className="text-earth-700 mb-4">
                  Young people with lived experience guiding our approach and
                  ensuring youth voices shape our research priorities.
                </p>
                <div className="text-sm text-earth-600">
                  Coordinated by Brodie Germaine
                </div>
              </div>

              <div className="border-2 border-black p-6 bg-sand-50">
                <h3 className="text-xl font-bold mb-3">Research Partners</h3>
                <p className="text-earth-700 mb-4">
                  Academic institutions and research organizations collaborating
                  on evidence synthesis and evaluation.
                </p>
                <div className="text-sm text-earth-600">
                  Led by Benjamin Knight
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Work With Us */}
        <section className="py-16 bg-black text-white">
          <div className="container-justice text-center">
            <h2 className="text-3xl font-bold mb-4">Work With Us</h2>
            <p className="text-gray-300 max-w-2xl mx-auto mb-8">
              We&apos;re always looking for passionate people to join our mission.
              Whether you&apos;re a researcher, practitioner, or someone with lived experience,
              there are ways to contribute.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/stewards"
                className="inline-block px-8 py-4 bg-white text-black font-bold hover:bg-gray-100 transition-colors"
              >
                Become a Steward
              </Link>
              <Link
                href="/contact"
                className="inline-block px-8 py-4 border-2 border-white text-white font-bold hover:bg-white hover:text-black transition-colors"
              >
                Get in Touch
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function PersonCard({ person, featured = false }: { person: CoEPerson; featured?: boolean }) {
  const profile = person.profile;

  return (
    <div
      className={`border-2 border-black bg-white ${
        featured ? 'p-6' : 'p-4'
      } hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow`}
    >
      {/* Photo */}
      <div className={`mb-4 ${featured ? 'h-48' : 'h-32'} relative bg-sand-100 border border-black overflow-hidden`}>
        {profile.photo_url ? (
          <Image
            src={profile.photo_url}
            alt={profile.full_name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-earth-400">
            <Users className={featured ? 'w-16 h-16' : 'w-12 h-12'} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="space-y-2">
        <h3 className={`font-bold ${featured ? 'text-xl' : 'text-lg'}`}>
          {profile.full_name}
        </h3>

        <div className="text-ochre-600 font-medium text-sm">
          {person.role || person.role_title}
        </div>

        <div className="text-xs font-bold uppercase tracking-wider px-2 py-1 bg-eucalyptus-100 text-eucalyptus-800 inline-block">
          {person.expertise_area}
        </div>

        {featured && profile.bio && (
          <p className="text-earth-700 text-sm line-clamp-3 mt-3">
            {profile.bio}
          </p>
        )}

        {/* Links */}
        <div className="flex items-center gap-3 pt-3">
          <Link
            href={`/people/${profile.slug}`}
            className="text-sm font-medium text-ochre-600 hover:text-ochre-800 flex items-center gap-1"
          >
            View Profile <ArrowRight className="w-3 h-3" />
          </Link>

          {profile.email && (
            <a
              href={`mailto:${profile.email}`}
              className="text-earth-400 hover:text-earth-600"
              title="Email"
            >
              <Mail className="w-4 h-4" />
            </a>
          )}

          {profile.website_url && (
            <a
              href={profile.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-earth-400 hover:text-earth-600"
              title="Website"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
