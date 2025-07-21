'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  BarChart3,
  PieChart,
  FileText,
  Search,
  Download,
  Calendar,
  MapPin,
  Users,
  Building2,
  Eye,
  ArrowRight,
  ExternalLink,
  Bell,
  Filter,
  Zap,
  Target,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';

interface BudgetItem {
  id: string;
  department: string;
  category: string;
  allocated: number;
  spent: number;
  percentage: number;
  lastUpdated: string;
  trend: 'up' | 'down' | 'stable';
}

interface Alert {
  id: string;
  type: 'budget_exceeded' | 'underspend' | 'new_allocation' | 'transparency_issue';
  title: string;
  description: string;
  amount?: number;
  date: string;
  severity: 'high' | 'medium' | 'low';
}

export default function MoneyTrailPage() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('2023-24');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Mock data - would come from your comprehensive scraping system
  const budgetData: BudgetItem[] = [
    {
      id: '1',
      department: 'Youth Justice',
      category: 'Detention Centers',
      allocated: 125000000,
      spent: 118500000,
      percentage: 94.8,
      lastUpdated: '2024-01-15',
      trend: 'up'
    },
    {
      id: '2',
      department: 'Youth Justice',
      category: 'Community Programs',
      allocated: 45000000,
      spent: 41200000,
      percentage: 91.5,
      lastUpdated: '2024-01-15',
      trend: 'stable'
    },
    {
      id: '3',
      department: 'Courts',
      category: 'Youth Court Operations',
      allocated: 28000000,
      spent: 26800000,
      percentage: 95.7,
      lastUpdated: '2024-01-12',
      trend: 'down'
    },
    {
      id: '4',
      department: 'Legal Aid',
      category: 'Youth Legal Representation',
      allocated: 15000000,
      spent: 12300000,
      percentage: 82.0,
      lastUpdated: '2024-01-10',
      trend: 'down'
    }
  ];

  const alerts: Alert[] = [
    {
      id: '1',
      type: 'budget_exceeded',
      title: 'Detention Center Overtime Costs',
      description: 'Staff overtime costs have exceeded budget by 12% this quarter',
      amount: 1500000,
      date: '2024-01-15',
      severity: 'high'
    },
    {
      id: '2',
      type: 'underspend',
      title: 'Community Programs Underspend',
      description: 'Community-based programs showing significant underspend',
      amount: 3800000,
      date: '2024-01-12',
      severity: 'medium'
    },
    {
      id: '3',
      type: 'transparency_issue',
      title: 'Missing Financial Reports',
      description: 'Q2 detention facility reports not yet published',
      date: '2024-01-10',
      severity: 'high'
    }
  ];

  const keyMetrics = [
    {
      label: 'Total Youth Justice Budget',
      value: '$213M',
      change: '+8.5%',
      positive: false,
      icon: <DollarSign className="h-6 w-6" />
    },
    {
      label: 'Cost Per Youth in Detention',
      value: '$847K',
      change: '+12.3%',
      positive: false,
      icon: <Users className="h-6 w-6" />
    },
    {
      label: 'Community Program Investment',
      value: '$45M',
      change: '-2.1%',
      positive: false,
      icon: <Building2 className="h-6 w-6" />
    },
    {
      label: 'Budget Transparency Score',
      value: '67%',
      change: '+5.2%',
      positive: true,
      icon: <Eye className="h-6 w-6" />
    }
  ];

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    return `$${(amount / 1000).toFixed(0)}K`;
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'budget_exceeded': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'underspend': return <TrendingUp className="h-5 w-5 text-blue-600" />;
      case 'new_allocation': return <DollarSign className="h-5 w-5 text-green-600" />;
      case 'transparency_issue': return <Eye className="h-5 w-5 text-orange-600" />;
      default: return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-l-red-600 bg-red-50';
      case 'medium': return 'border-l-yellow-600 bg-yellow-50';
      case 'low': return 'border-l-blue-600 bg-blue-50';
      default: return 'border-l-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="header-offset">
        {/* Hero Section */}
        <section className="pb-16 border-b-2 border-black bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
          <div className="container-justice">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-bold text-sm uppercase tracking-wider mb-6">
                <DollarSign className="h-4 w-4" />
                Following The Money
              </div>
              
              <h1 className="headline-truth mb-6">
                MONEY TRAIL
              </h1>
              
              <p className="text-xl max-w-4xl mx-auto mb-8 leading-relaxed text-gray-800">
                Real-time transparency into youth justice spending. Track every dollar, 
                question every allocation, and hold the system accountable for how taxpayer money 
                is used to support young people.
              </p>

              {/* Key Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                {keyMetrics.map((metric, index) => (
                  <div key={index} className="bg-white border-2 border-black p-6 hover:shadow-lg transition-all">
                    <div className="flex items-center justify-center mb-3 text-red-600">
                      {metric.icon}
                    </div>
                    <div className="text-2xl font-black mb-1">{metric.value}</div>
                    <div className="text-sm font-bold text-gray-700 mb-1">{metric.label}</div>
                    <div className={`text-xs font-bold ${metric.positive ? 'text-green-600' : 'text-red-600'}`}>
                      {metric.change} from last year
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Coming Soon Banner */}
        <section className="py-8 bg-orange-600 text-white border-b-2 border-black">
          <div className="container-justice">
            <div className="flex items-center justify-center gap-4 text-center">
              <Zap className="h-8 w-8" />
              <div>
                <h2 className="text-xl font-black mb-1">COMPREHENSIVE SYSTEM IN DEVELOPMENT</h2>
                <p className="text-orange-100">
                  Full automation, real-time scraping, and advanced analytics launching soon. 
                  Current preview shows the vision and sample data.
                </p>
              </div>
              <Zap className="h-8 w-8" />
            </div>
          </div>
        </section>

        {/* Active Alerts */}
        <section className="py-16 border-b-2 border-black">
          <div className="container-justice">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              TRANSPARENCY ALERTS
            </h2>
            
            <div className="space-y-4 mb-8">
              {alerts.map((alert) => (
                <div key={alert.id} className={`border-l-4 p-6 border-2 border-black ${getAlertColor(alert.severity)}`}>
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-lg mb-2">{alert.title}</h3>
                          <p className="text-gray-700 mb-2">{alert.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {mounted && <span>{new Date(alert.date).toLocaleDateString('en-AU')}</span>}
                            </span>
                            <span className={`px-2 py-1 text-xs font-bold uppercase ${
                              alert.severity === 'high' ? 'bg-red-100 text-red-800' :
                              alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {alert.severity} Priority
                            </span>
                          </div>
                        </div>
                        {alert.amount && (
                          <div className="text-right">
                            <div className="text-xl font-bold text-red-600">{formatCurrency(alert.amount)}</div>
                            <div className="text-sm text-gray-600">Impact</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <button className="bg-red-600 text-white px-8 py-3 font-bold hover:bg-red-700 transition-all">
                VIEW ALL ALERTS
              </button>
            </div>
          </div>
        </section>

        {/* Budget Breakdown */}
        <section className="py-16 border-b-2 border-black">
          <div className="container-justice">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                BUDGET BREAKDOWN
              </h2>
              
              <div className="flex items-center gap-4">
                <select 
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
                  className="px-4 py-2 border-2 border-black font-bold"
                >
                  <option value="2023-24">2023-24 Financial Year</option>
                  <option value="2022-23">2022-23 Financial Year</option>
                  <option value="2021-22">2021-22 Financial Year</option>
                </select>
                
                <button className="flex items-center gap-2 px-4 py-2 border-2 border-black hover:bg-black hover:text-white transition-all font-bold">
                  <Download className="h-4 w-4" />
                  Export Data
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Budget Table */}
              <div className="border-2 border-black overflow-hidden">
                <div className="bg-gray-50 border-b-2 border-black p-4">
                  <h3 className="font-bold text-lg">DEPARTMENTAL ALLOCATIONS</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 border-b border-black">
                      <tr>
                        <th className="px-4 py-3 text-left font-bold">Category</th>
                        <th className="px-4 py-3 text-right font-bold">Allocated</th>
                        <th className="px-4 py-3 text-right font-bold">Spent</th>
                        <th className="px-4 py-3 text-center font-bold">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {budgetData.map((item, index) => (
                        <tr key={item.id} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <td className="px-4 py-4">
                            <div>
                              <div className="font-bold">{item.category}</div>
                              <div className="text-sm text-gray-600">{item.department}</div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right font-mono">{formatCurrency(item.allocated)}</td>
                          <td className="px-4 py-4 text-right font-mono">{formatCurrency(item.spent)}</td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <span className={`font-bold ${
                                item.percentage > 95 ? 'text-red-600' :
                                item.percentage > 85 ? 'text-yellow-600' :
                                'text-green-600'
                              }`}>
                                {item.percentage}%
                              </span>
                              {item.trend === 'up' && <TrendingUp className="h-4 w-4 text-red-600" />}
                              {item.trend === 'down' && <TrendingUp className="h-4 w-4 text-green-600 rotate-180" />}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cost Comparison */}
              <div className="space-y-6">
                <div className="border-2 border-black p-6 bg-red-50">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Target className="h-6 w-6 text-red-600" />
                    COST PER YOUTH ANALYSIS
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-white border border-gray-200">
                      <div>
                        <div className="font-bold">Youth Detention</div>
                        <div className="text-sm text-gray-600">Annual cost per young person</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-red-600">$847K</div>
                        <div className="text-sm text-red-600">+12.3%</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-white border border-gray-200">
                      <div>
                        <div className="font-bold">Community Programs</div>
                        <div className="text-sm text-gray-600">Annual cost per young person</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">$23K</div>
                        <div className="text-sm text-green-600">-3.1%</div>
                      </div>
                    </div>
                    
                    <div className="bg-white border border-gray-200 p-4">
                      <div className="text-center">
                        <div className="text-3xl font-black text-orange-600 mb-1">37x</div>
                        <div className="text-sm font-bold">Detention costs 37 times more than community programs</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-2 border-black p-6 bg-blue-50">
                  <h3 className="font-bold text-lg mb-4">TRANSPARENCY METRICS</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Budget Documents Published</span>
                      <span className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-bold">78%</span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">FOI Requests Responded</span>
                      <span className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-bold">65%</span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Parliamentary Questions Answered</span>
                      <span className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="font-bold">42%</span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Data Timeliness</span>
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <span className="font-bold">3-6 months delay</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Data Sources & Methodology */}
        <section className="py-16 border-b-2 border-black bg-gray-50">
          <div className="container-justice">
            <h2 className="text-3xl font-bold mb-8 text-center">DATA SOURCES & AUTOMATION</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white border-2 border-black p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="h-6 w-6 text-blue-600" />
                  <h3 className="font-bold text-lg">Government Documents</h3>
                </div>
                <ul className="space-y-2 text-sm">
                  <li>• Budget papers and estimates</li>
                  <li>• Annual reports</li>
                  <li>• Parliamentary questions</li>
                  <li>• Freedom of Information releases</li>
                  <li>• Court statistics</li>
                </ul>
              </div>
              
              <div className="bg-white border-2 border-black p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Search className="h-6 w-6 text-green-600" />
                  <h3 className="font-bold text-lg">Automated Monitoring</h3>
                </div>
                <ul className="space-y-2 text-sm">
                  <li>• Daily website scraping</li>
                  <li>• Document change detection</li>
                  <li>• Parliamentary sitting alerts</li>
                  <li>• Budget update notifications</li>
                  <li>• Data verification checks</li>
                </ul>
              </div>
              
              <div className="bg-white border-2 border-black p-6">
                <div className="flex items-center gap-3 mb-4">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                  <h3 className="font-bold text-lg">Analysis Engine</h3>
                </div>
                <ul className="space-y-2 text-sm">
                  <li>• Trend analysis algorithms</li>
                  <li>• Cost comparison models</li>
                  <li>• Outcome effectiveness metrics</li>
                  <li>• Transparency scoring</li>
                  <li>• Predictive budget modeling</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Full Platform Coming Soon */}
        <section className="py-16 bg-black text-white">
          <div className="container-justice text-center">
            <h2 className="text-3xl font-bold mb-6">
              FULL MONEY TRAIL PLATFORM LAUNCHING SOON
            </h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto" style={{color: 'white'}}>
              We're building the most comprehensive youth justice financial transparency system in Australia. 
              Real-time tracking, automated alerts, and deep analysis of every dollar spent.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="text-center">
                <div className="text-4xl mb-2">🤖</div>
                <h3 className="font-bold mb-2" style={{color: 'white'}}>AI-Powered Analysis</h3>
                <p className="text-sm text-gray-300">Automated detection of spending patterns and anomalies</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">📊</div>
                <h3 className="font-bold mb-2" style={{color: 'white'}}>Interactive Dashboards</h3>
                <p className="text-sm text-gray-300">Drill down into any department, program, or expenditure</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">🔔</div>
                <h3 className="font-bold mb-2" style={{color: 'white'}}>Real-Time Alerts</h3>
                <p className="text-sm text-gray-300">Instant notifications for budget changes and transparency issues</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">📈</div>
                <h3 className="font-bold mb-2" style={{color: 'white'}}>Outcome Tracking</h3>
                <p className="text-sm text-gray-300">Connect spending to actual results for young people</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/stories" className="bg-white text-black px-8 py-4 font-bold uppercase tracking-wider hover:bg-gray-100 transition-all">
                READ RELATED STORIES
              </Link>
              <Link href="/community-programs" className="border-2 border-white text-white px-8 py-4 font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all">
                SEE PROGRAMS WE TRACK
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}