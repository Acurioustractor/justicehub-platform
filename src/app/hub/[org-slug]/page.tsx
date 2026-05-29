import { redirect } from 'next/navigation';

export default async function OrgHubPage({ params }: { params: { 'org-slug': string } }) {
  redirect(`/hub/${params['org-slug']}/practice`);
}
