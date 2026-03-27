import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function DeveloperAPIPage() {
  const v2Url = (process.env.EMPATHY_LEDGER_V2_URL || 'https://www.empathyledger.com').trim();
  redirect(`${v2Url}/developer`);
}
