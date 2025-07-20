#!/usr/bin/env python3
"""
Demo script to populate interview and hidden cost data.
"""

from datetime import datetime
from src.interviews import InterviewManager
from src.analysis import HiddenCostsCalculator
from src.database import init_db
from loguru import logger

def main():
    """Populate demo interview and cost data."""
    logger.info("Initializing database...")
    init_db()
    
    # Initialize managers
    interview_mgr = InterviewManager()
    hidden_calc = HiddenCostsCalculator()
    
    # Create interview templates
    logger.info("Creating interview templates...")
    for stakeholder_type in ['youth', 'family', 'worker', 'provider']:
        interview_mgr.create_template_in_db(stakeholder_type)
    
    # Demo interview responses
    logger.info("Creating demo interviews...")
    
    # Family interview 1 - Remote Indigenous family
    family1_responses = {
        'f1': '850',  # Distance in km
        'f2': '450',  # Visit cost
        'f3': '4',    # Days missed
        'f4': '800',  # Lost income
        'f5': '200',  # Phone costs
        'f6': '5000', # Legal costs
        'f7': 'We had to sell our car to pay for the lawyer. My other kids miss school when I visit.',
        'f8': 'The younger ones are acting out. They miss their brother and I\'m not home as much.',
        'f9': 'A youth worker in our community could have helped before it got this bad.',
        'f10': 'Put the money into local programs. Kids need mentors and activities, not prison.'
    }
    
    interview_mgr.conduct_interview(
        stakeholder_type='family',
        participant_code='FAM001',
        responses=family1_responses,
        interviewer='Demo System',
        location='Phone Interview - Aurukun'
    )
    
    # Family interview 2 - Urban family
    family2_responses = {
        'f1': '120',  # Distance in km
        'f2': '150',  # Visit cost
        'f3': '2',    # Days missed
        'f4': '400',  # Lost income
        'f5': '120',  # Phone costs
        'f6': '0',    # Legal costs (Legal Aid)
        'f7': 'The phone system is so expensive. $5 just to connect, then 50 cents a minute.',
        'f8': 'His sister is depressed. She blames herself for not stopping him.',
        'f9': 'After school programs. Somewhere safe for kids to go.',
        'f10': 'Community programs that actually understand our kids and culture.'
    }
    
    interview_mgr.conduct_interview(
        stakeholder_type='family',
        participant_code='FAM002',
        responses=family2_responses,
        interviewer='Demo System',
        location='Brisbane Office'
    )
    
    # Youth interview
    youth_responses = {
        'y1': 'It was scary. No one explained what was happening.',
        'y2': 'Once a month if we\'re lucky. It\'s too far and costs too much.',
        'y3': 'Mum said it\'s like $500 each time with petrol and missing work.',
        'y4': '50 cents a minute plus connection fee',
        'y5': 'Someone to talk to who actually cared. Sports programs. Anything but this.',
        'y6': 'No. They said there\'s no funding for cultural programs.',
        'y7': 'Mum cries on the phone. My little brother thinks I abandoned him.',
        'y8': 'No. We just sit around most days. There\'s nothing to prepare us.'
    }
    
    interview_mgr.conduct_interview(
        stakeholder_type='youth',
        participant_code='YTH001',
        responses=youth_responses,
        interviewer='Demo System',
        location='Cleveland Youth Detention Centre'
    )
    
    # Worker interview
    worker_responses = {
        'w1': 'Poverty, family breakdown, no community supports, and systemic racism.',
        'w2': '75',  # Percentage Indigenous
        'w3': 'Mentoring programs with Indigenous elders. But they\'re barely funded.',
        'w4': 'Travel costs for remote families are crushing. Some spend their rent money to visit.',
        'w5': 'Fund 24/7 youth centers in communities. Early intervention. Cultural programs.',
        'w6': 'Trauma counseling. Family support workers. Transitional housing.',
        'w7': 'We could run 20 kids through intensive community support for the cost of one in here.',
        'w8': 'Raise the age. Fund communities, not cages. Listen to Indigenous leaders.'
    }
    
    interview_mgr.conduct_interview(
        stakeholder_type='worker',
        participant_code='WRK001',
        responses=worker_responses,
        interviewer='Demo System',
        location='Anonymous'
    )
    
    # Service provider interview
    provider_responses = {
        'p1': 'Intensive family support, mentoring, cultural connection, education support.',
        'p2': '250000',  # Annual budget
        'p3': 'We work with 50 youth per year for what it costs to detain one.',
        'p4': '85',  # Success rate
        'p5': '500000',  # Additional funding needed
        'p6': 'No prevention services in remote communities. Kids fall through cracks.',
        'p7': '50',  # Youth served with detention cost
        'p8': 'Wraparound family support starting at age 8. Cultural mentoring.'
    }
    
    interview_mgr.conduct_interview(
        stakeholder_type='provider',
        participant_code='PRV001',
        responses=provider_responses,
        interviewer='Demo System',
        location='Community Organization - Cairns'
    )
    
    logger.info("Demo interviews created successfully!")
    
    # Calculate and save some hidden cost examples
    logger.info("Calculating hidden costs for various scenarios...")
    
    # Remote Indigenous community to Cleveland
    calc1 = hidden_calc.calculate_total_family_burden(
        family_location='Aurukun',
        detention_center='Cleveland Youth Detention Centre',
        visits_per_month=1,  # Can only afford once
        calls_per_week=2,
        work_days_missed=3,
        private_lawyer=True
    )
    hidden_calc.save_calculation(calc1)
    
    # Palm Island to Cleveland
    calc2 = hidden_calc.calculate_total_family_burden(
        family_location='Palm Island',
        detention_center='Cleveland Youth Detention Centre',
        visits_per_month=2,
        calls_per_week=3,
        work_days_missed=4,
        private_lawyer=False
    )
    hidden_calc.save_calculation(calc2)
    
    # Brisbane to Wacol
    calc3 = hidden_calc.calculate_total_family_burden(
        family_location='Brisbane',
        detention_center='West Moreton Youth Detention Centre',
        visits_per_month=4,
        calls_per_week=5,
        work_days_missed=2,
        private_lawyer=False
    )
    hidden_calc.save_calculation(calc3)
    
    # Display summary
    print("\nDemo Data Created:")
    print("==================")
    print("✓ 5 interviews conducted")
    print("✓ 3 hidden cost calculations saved")
    print("\nKey Findings from Demo Data:")
    print(f"- Remote family (Aurukun): ${calc1['total_monthly_cost']:,.0f}/month ({calc1['family_cost_percentage']:.0f}% of official cost)")
    print(f"- Palm Island family: ${calc2['total_monthly_cost']:,.0f}/month ({calc2['family_cost_percentage']:.0f}% of official cost)")
    print(f"- Brisbane family: ${calc3['total_monthly_cost']:,.0f}/month ({calc3['family_cost_percentage']:.0f}% of official cost)")
    print(f"\nTotal annual hidden cost for these 3 families: ${(calc1['total_annual_cost'] + calc2['total_annual_cost'] + calc3['total_annual_cost']):,.0f}")
    print("\nRun the dashboard to explore the interview responses and hidden cost analysis!")

if __name__ == "__main__":
    main()