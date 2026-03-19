import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function DeveloperAPIPage() {
  const v2Url = process.env.EMPATHY_LEDGER_V2_URL;
  redirect(v2Url ? `${v2Url}/developer` : '/about');
}
