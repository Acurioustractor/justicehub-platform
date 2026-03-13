import { redirect } from 'next/navigation';

export default async function HubPage({ params }: { params: { 'org-slug': string } }) {
  redirect(`/hub/${params['org-slug']}/dashboard`);
}
