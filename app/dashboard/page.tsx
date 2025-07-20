import UnifiedDashboard from '@/components/UnifiedDashboard'

export const metadata = {
  title: 'Queensland Youth Justice Dashboard - Real Government Data',
  description: 'Live dashboard showing Queensland youth justice failures using verified government statistics. Every number is sourced from official PDFs.',
}

export default function DashboardPage() {
  return <UnifiedDashboard />
}