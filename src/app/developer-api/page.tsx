import { redirect } from 'next/navigation';

export default function DeveloperAPIPage() {
  const v2Url = process.env.EMPATHY_LEDGER_V2_URL || 'https://www.empathyledger.com';
  redirect(`${v2Url}/developer`);
}
