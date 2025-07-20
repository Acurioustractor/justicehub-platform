import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  Users, 
  Zap, 
  TrendingDown,
  TrendingUp,
  Building,
  Briefcase,
  Star,
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Target,
  Sparkles
} from "lucide-react";
import Link from "next/link";

export function DetentionDollarSection() {
  return (
    <section className="py-20 bg-white dark:bg-neutral-950 relative overflow-hidden border-t border-b border-neutral-200 dark:border-neutral-800">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(0,0,0,.05) 35px, rgba(0,0,0,.05) 70px)`
        }}></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Alert Header */}
        <div className="text-center mb-12">
          <div className="mb-4 text-sm uppercase tracking-wider text-accent-600 font-medium">
            <AlertCircle className="inline-block h-4 w-4 mr-2" />
            GAME-CHANGING OPPORTUNITY
          </div>
          
          <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-6">
            One Detention Bed = 
            <span className="text-accent-600">
              {" "}Entire Talent-Scout Nation
            </span>
          </h2>
        </div>

        {/* The Shocking Comparison */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Current Reality */}
          <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <CardHeader className="bg-neutral-900 text-white p-6">
              <div className="flex items-center justify-between mb-4">
                <TrendingDown className="h-8 w-8" />
                <Badge variant="outline" className="bg-white text-neutral-900 border-white">CURRENT REALITY</Badge>
              </div>
              <h3 className="text-2xl font-bold">One Youth in Detention</h3>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="text-center py-4">
                <p className="text-5xl font-light text-neutral-900 dark:text-neutral-100">A$988,000</p>
                <p className="text-lg text-neutral-600 dark:text-neutral-400 mt-2">per year / per child</p>
                <p className="text-3xl font-light text-neutral-700 dark:text-neutral-300 mt-4">A$2,700</p>
                <p className="text-neutral-600 dark:text-neutral-400">per day</p>
              </div>
              
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-neutral-100 dark:bg-neutral-800 rounded-sm">
                    <Building className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
                  </div>
                  <div>
                    <p className="font-semibold">A bed and uniform</p>
                    <p className="text-sm text-gray-600">Basic detention facility</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-neutral-100 dark:bg-neutral-800 rounded-sm">
                    <TrendingDown className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
                  </div>
                  <div>
                    <p className="font-medium">69% recidivism rate</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">They'll likely be back next year</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-neutral-100 dark:bg-neutral-800 rounded-sm">
                    <Users className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
                  </div>
                  <div>
                    <p className="font-medium">One young person</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Isolated from community</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* JusticeHub Alternative */}
          <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm relative">
            <div className="absolute -top-3 -right-3">
              <Badge className="bg-accent-600 text-white text-sm px-3 py-1">
                SAME BUDGET
              </Badge>
            </div>
            <CardHeader className="bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="h-8 w-8" />
                <Badge variant="outline" className="bg-white text-neutral-900 border-white dark:bg-neutral-900 dark:text-white dark:border-neutral-700">JUSTICEHUB ALTERNATIVE</Badge>
              </div>
              <h3 className="text-2xl font-bold">Nation-Wide Talent Engine</h3>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="text-center py-4">
                <p className="text-5xl font-light text-neutral-900 dark:text-neutral-100">A$988,000</p>
                <p className="text-lg text-neutral-600 dark:text-neutral-400 mt-2">transforms into...</p>
              </div>
              
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-neutral-100 dark:bg-neutral-800 rounded-sm">
                    <Sparkles className="h-5 w-5 text-accent-600" />
                  </div>
                  <div>
                    <p className="font-medium">Complete JusticeHub Platform</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Open-source, multi-tenant, any org can use</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-neutral-100 dark:bg-neutral-800 rounded-sm">
                    <Users className="h-5 w-5 text-accent-600" />
                  </div>
                  <div>
                    <p className="font-medium">200 Youth Portfolios</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">10 full Talent-Scout Packs across NT & QLD</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-neutral-100 dark:bg-neutral-800 rounded-sm">
                    <Briefcase className="h-5 w-5 text-accent-600" />
                  </div>
                  <div>
                    <p className="font-medium">30 Paid Apprenticeships</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Young storytellers earning real wages</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-neutral-100 dark:bg-neutral-800 rounded-sm">
                    <Target className="h-5 w-5 text-accent-600" />
                  </div>
                  <div>
                    <p className="font-medium">2,500 Skill-Tagged Stories</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">AI-matched to employment opportunities</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-neutral-100 dark:bg-neutral-800 rounded-sm">
                    <Star className="h-5 w-5 text-accent-600" />
                  </div>
                  <div>
                    <p className="font-medium">National Showcase + Evidence</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">10 documentaries + policy impact data</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Impact Breakdown */}
        <Card className="mb-12 border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <CardHeader className="bg-neutral-50 dark:bg-neutral-900 p-6">
            <h3 className="text-2xl font-light text-center text-neutral-900 dark:text-neutral-100">What A$988,000 Builds in 12 Months</h3>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-sm flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-10 w-10 text-accent-600" />
                </div>
                <h4 className="font-bold text-lg mb-2">Platform Development</h4>
                <p className="text-gray-600">Final 18-month roadmap to completion. Public, multi-tenant stack any grassroots group can fork.</p>
              </div>
              
              <div className="text-center">
                <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-sm flex items-center justify-center mx-auto mb-4">
                  <Users className="h-10 w-10 text-accent-600" />
                </div>
                <h4 className="font-bold text-lg mb-2">10 Talent-Scout Packs</h4>
                <p className="text-gray-600">Across NT & QLD, creating 200 youth portfolios and 30 paid apprenticeships.</p>
              </div>
              
              <div className="text-center">
                <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-sm flex items-center justify-center mx-auto mb-4">
                  <Star className="h-10 w-10 text-accent-600" />
                </div>
                <h4 className="font-bold text-lg mb-2">National Impact</h4>
                <p className="text-gray-600">Showcase event + evidence set proving reduced re-offending and increased employment.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* The Ask */}
        <Card className="bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border border-neutral-800 dark:border-neutral-200 shadow-sm">
          <CardContent className="p-12 text-center">
            <h3 className="text-3xl font-light mb-6">
              "One Detention Bed Buys the Whole Band"
            </h3>
            
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              JusticeHub turns youth stories into CVs, grassroots programs into talent pipelines, 
              and detention dollars into discovery dollars — starting now.
            </p>

            <div className="bg-white/20 backdrop-blur rounded-lg p-6 mb-8 max-w-2xl mx-auto">
              <p className="text-2xl font-bold mb-2">What exists today:</p>
              <ul className="text-left space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>Working MVP built on Airtable + React with two pilot studios live</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>AI-matching pipeline translating stories to 220+ transferable skills</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>First apprentices on payroll, already securing community grants</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-neutral-900 hover:bg-neutral-100 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800">
                <DollarSign className="mr-2 h-5 w-5" />
                Fund This Revolution
              </Button>
              <Link href="/talent-scout">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-neutral-900 dark:border-neutral-900 dark:text-neutral-900 dark:hover:bg-neutral-900 dark:hover:text-white">
                  Learn More
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}