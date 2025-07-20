import { NextResponse } from 'next/server'

// Distance data for major Queensland towns to Cleveland Youth Detention Centre
const distances = {
  'mount-isa': 1800,
  'cairns': 1700,
  'townsville': 1350,
  'mackay': 970,
  'rockhampton': 640,
  'bundaberg': 380,
  'toowoomba': 130,
  'gold-coast': 100,
  'sunshine-coast': 100
}

export async function GET(
  request: Request,
  { params }: { params: { location: string } }
) {
  const location = params.location.toLowerCase()
  const distance = distances[location as keyof typeof distances]
  
  if (!distance) {
    return NextResponse.json(
      { error: 'Unknown location' },
      { status: 400 }
    )
  }
  
  // Calculate costs based on distance
  const travelCostPerKm = 0.25 // $0.25 per km
  const travelCostPerTrip = Math.round(distance * 2 * travelCostPerKm) // Round trip
  const visitsPerMonth = 2
  const monthlyTravelCost = travelCostPerTrip * visitsPerMonth
  
  // Phone costs
  const callsPerWeek = 3
  const callDurationMinutes = 15
  const costPerMinute = 0.89 // Prison phone rates
  const monthlyPhoneCost = Math.round(callsPerWeek * 4.33 * callDurationMinutes * costPerMinute)
  
  // Lost wages (based on distance - longer trips = more time off work)
  const daysOffPerVisit = distance > 1000 ? 2 : 1
  const averageDailyWage = 200
  const monthlyLostWages = daysOffPerVisit * visitsPerMonth * averageDailyWage
  
  // Total costs
  const totalMonthlyCost = monthlyTravelCost + monthlyPhoneCost + monthlyLostWages
  const totalAnnualCost = totalMonthlyCost * 12
  
  // Compare to official detention cost
  const officialDailyCost = 857
  const officialAnnualCost = officialDailyCost * 365
  const familyCostPercentage = (totalAnnualCost / officialAnnualCost) * 100
  
  return NextResponse.json({
    location: location.charAt(0).toUpperCase() + location.slice(1).replace('-', ' '),
    distance: `${distance.toLocaleString()}km`,
    monthly_cost: totalMonthlyCost,
    annual_cost: totalAnnualCost,
    percentage_of_official: familyCostPercentage.toFixed(1),
    breakdown: {
      travel: {
        cost_per_trip: travelCostPerTrip,
        trips_per_month: visitsPerMonth,
        monthly_cost: monthlyTravelCost
      },
      phone: {
        calls_per_week: callsPerWeek,
        minutes_per_call: callDurationMinutes,
        cost_per_minute: costPerMinute,
        monthly_cost: monthlyPhoneCost
      },
      lost_wages: {
        days_off_per_visit: daysOffPerVisit,
        visits_per_month: visitsPerMonth,
        daily_wage: averageDailyWage,
        monthly_cost: monthlyLostWages
      }
    }
  })
}