#!/usr/bin/env python3
"""
Simple script to view the Queensland Youth Justice Tracker data
"""

from src.database import get_db, Interview, FamilyCostCalculation, CoalitionMember, MediaCitation
from src.analysis.cost_analysis import CostAnalyzer
from tabulate import tabulate
import json

def main():
    print("\n" + "="*60)
    print("QUEENSLAND YOUTH JUSTICE TRACKER - DATA SUMMARY")
    print("="*60)
    
    # Initialize analyzer
    analyzer = CostAnalyzer()
    
    # 1. Cost Comparison
    print("\n1. DETENTION VS COMMUNITY COSTS")
    print("-" * 40)
    print(f"Detention: ${analyzer.detention_daily_cost}/day")
    print(f"Community: ${analyzer.community_daily_cost}/day")
    print(f"Cost Ratio: {analyzer.cost_ratio}:1")
    
    # 2. Budget Split
    split = analyzer.calculate_spending_split()
    print("\n2. CURRENT BUDGET ALLOCATION")
    print("-" * 40)
    if split['total_budget'] > 0:
        print(f"Total Budget: ${split['total_budget']:,.0f}")
        print(f"Detention: {split['detention_percentage']:.1f}% (${split.get('detention_amount', 0):,.0f})")
        print(f"Community: {split['community_percentage']:.1f}% (${split.get('community_amount', 0):,.0f})")
    else:
        print("No budget data available - using default 90.6% / 9.4% split")
    
    # 3. Indigenous Disparities
    disparities = analyzer.analyze_indigenous_disparities()
    print("\n3. INDIGENOUS YOUTH DISPARITIES")
    print("-" * 40)
    print(f"Population: {disparities['indigenous_percentage_population']}%")
    print(f"In Detention: {disparities['indigenous_percentage_detained']}%")
    print(f"Overrepresentation: {disparities['overrepresentation_factor']}x")
    
    # 4. Database Content
    db = next(get_db())
    
    # Interviews
    interviews = db.query(Interview).all()
    print(f"\n4. INTERVIEWS CONDUCTED: {len(interviews)}")
    print("-" * 40)
    if interviews:
        interview_data = []
        for i in interviews[:5]:  # Show first 5
            interview_data.append([
                i.participant_code,
                i.stakeholder_type,
                i.interview_date.strftime('%Y-%m-%d'),
                i.location or 'N/A'
            ])
        print(tabulate(interview_data, 
                      headers=['Participant', 'Type', 'Date', 'Location'],
                      tablefmt='grid'))
    
    # Hidden Costs
    family_costs = db.query(FamilyCostCalculation).all()
    print(f"\n5. HIDDEN COST CALCULATIONS: {len(family_costs)}")
    print("-" * 40)
    if family_costs:
        cost_data = []
        total_hidden = 0
        for fc in family_costs:
            cost_data.append([
                fc.family_location,
                fc.youth_location,
                f"${fc.total_monthly_cost:,.0f}",
                f"${fc.total_annual_cost:,.0f}",
                f"{fc.family_cost_percentage:.1f}%"
            ])
            total_hidden += fc.total_annual_cost
        print(tabulate(cost_data,
                      headers=['Family Location', 'Detention Center', 'Monthly', 'Annual', '% of Official'],
                      tablefmt='grid'))
        print(f"\nTotal Annual Hidden Costs (these {len(family_costs)} families): ${total_hidden:,.0f}")
    
    # Coalition Members
    members = db.query(CoalitionMember).filter_by(active=True).all()
    print(f"\n6. COALITION MEMBERS: {len(members)}")
    print("-" * 40)
    if members:
        for m in members:
            print(f"• {m.organization_name} ({m.organization_type})")
    
    # Media Citations
    citations = db.query(MediaCitation).all()
    print(f"\n7. MEDIA CITATIONS: {len(citations)}")
    print("-" * 40)
    if citations:
        total_reach = sum(c.reach_estimate or 0 for c in citations)
        print(f"Total Reach: {total_reach:,} people")
        for c in citations:
            print(f"• {c.publication}: \"{c.article_title}\"")
    
    # Cost per outcome comparison
    outcomes = analyzer.calculate_cost_per_outcome()
    print("\n8. COST PER SUCCESSFUL OUTCOME")
    print("-" * 40)
    outcome_data = []
    for program, data in outcomes.items():
        outcome_data.append([
            program.replace('_', ' ').title(),
            f"${data['daily_cost']}",
            f"{data['success_rate']*100:.0f}%",
            f"${data['cost_per_success']:,.0f}"
        ])
    print(tabulate(outcome_data,
                  headers=['Program', 'Daily Cost', 'Success Rate', 'Cost per Success'],
                  tablefmt='grid'))
    
    # Media files
    import os
    media_dir = 'data/media'
    if os.path.exists(media_dir):
        media_files = [f for f in os.listdir(media_dir) if f.endswith('.png')]
        print(f"\n9. MEDIA GRAPHICS GENERATED: {len(media_files)}")
        print("-" * 40)
        for f in media_files:
            print(f"• {f}")
    
    db.close()
    
    print("\n" + "="*60)
    print("DASHBOARD ACCESS")
    print("="*60)
    print("\nTo view the interactive dashboard, run:")
    print("  python3 run_dashboard.py")
    print("\nOr for the Flask real-time dashboard:")
    print("  python3 run_flask_dashboard.py")
    print("\n")

if __name__ == "__main__":
    main()