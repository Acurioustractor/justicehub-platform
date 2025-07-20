#!/usr/bin/env python3
"""
Demo script for coalition management and impact tracking features.
"""

from datetime import datetime, date, timedelta
from src.database import init_db
from src.media import MediaToolkit
from src.coalition import CoalitionManager, ImpactTracker
from loguru import logger

def main():
    """Run coalition feature demos."""
    logger.info("Initializing database...")
    init_db()
    
    # 1. Generate Media Toolkit
    logger.info("\n=== GENERATING MEDIA TOOLKIT ===")
    media = MediaToolkit()
    assets = media.generate_all_media_assets()
    
    print("\nMedia assets created:")
    print(f"✓ Cost comparison graphic: {assets['cost_comparison']}")
    print(f"✓ Indigenous overrepresentation: {assets['indigenous_overrepresentation']}")
    print(f"✓ Spending timeline: {assets['spending_timeline']}")
    print(f"✓ Social media cards: {len(assets['social_cards'])} created")
    print(f"✓ Media kit summary: {assets['summary']['media_files']}")
    
    # 2. Coalition Management Demo
    logger.info("\n=== COALITION MANAGEMENT DEMO ===")
    coalition = CoalitionManager()
    
    # Register some demo members
    demo_members = [
        {
            'organization_name': 'Queensland Youth Advocacy Network',
            'contact_name': 'Sarah Chen',
            'email': 'sarah@qyan.org.au',
            'organization_type': 'ngo',
            'location': 'Brisbane',
            'areas_of_interest': ['youth_advocacy', 'policy_reform']
        },
        {
            'organization_name': 'Indigenous Justice Coalition',
            'contact_name': 'Marcus Williams',
            'email': 'marcus@ijc.org.au',
            'organization_type': 'indigenous',
            'location': 'Townsville',
            'areas_of_interest': ['indigenous_justice', 'youth_advocacy']
        },
        {
            'organization_name': 'Griffith University Criminology',
            'contact_name': 'Dr. Emma Thompson',
            'email': 'e.thompson@griffith.edu.au',
            'organization_type': 'academic',
            'location': 'Gold Coast',
            'areas_of_interest': ['criminal_justice_reform', 'policy_reform']
        }
    ]
    
    member_ids = []
    for member_data in demo_members:
        member_id = coalition.register_member(member_data)
        if member_id:
            member_ids.append(member_id)
            print(f"✓ Registered: {member_data['organization_name']}")
    
    # Add shared documents
    docs = [
        {
            'title': 'RTI Request Template - Detention Costs',
            'category': 'rti_template',
            'description': 'Template for requesting detailed detention facility costs',
            'tags': ['rti', 'costs', 'detention']
        },
        {
            'title': 'Media Talking Points - Cost Comparison',
            'category': 'media_kit',
            'description': 'Key messages about detention vs community program costs',
            'tags': ['media', 'costs', 'advocacy']
        },
        {
            'title': 'Coalition Strategy 2024',
            'category': 'guide',
            'description': 'Strategic plan for youth justice reform advocacy',
            'tags': ['strategy', 'planning', 'coalition']
        }
    ]
    
    for doc in docs:
        doc_id = coalition.add_shared_document(doc)
        if doc_id:
            print(f"✓ Added document: {doc['title']}")
    
    # Create an event
    event_data = {
        'title': 'Coalition Strategy Meeting',
        'description': 'Quarterly planning meeting for all coalition members',
        'event_type': 'meeting',
        'start_date': datetime.now() + timedelta(days=14),
        'location': 'Brisbane City Hall',
        'online_link': 'https://zoom.us/meeting/12345',
        'expected_attendance': 50
    }
    
    event_id = coalition.create_event(event_data)
    if event_id:
        print(f"✓ Created event: {event_data['title']}")
    
    # Get statistics
    stats = coalition.get_member_statistics()
    print(f"\nCoalition Statistics:")
    print(f"  Total members: {stats['total_members']}")
    print(f"  Active members: {stats['active_members']}")
    print(f"  Members by type: {stats['members_by_type']}")
    
    # 3. Impact Tracking Demo
    logger.info("\n=== IMPACT TRACKING DEMO ===")
    impact = ImpactTracker()
    
    # Record some RTI requests
    impact.record_rti_filed(1)
    impact.record_rti_filed(2)
    impact.record_rti_answered(1)
    
    # Record media citations
    media_citations = [
        {
            'publication': 'The Guardian',
            'article_title': 'Queensland youth detention costs soar despite falling crime',
            'article_url': 'https://example.com/article1',
            'publication_date': date.today() - timedelta(days=5),
            'author': 'Jane Smith',
            'citation_type': 'direct_quote',
            'quoted_text': 'According to the Youth Justice Tracker, detention costs $857 per day',
            'sentiment': 'positive'
        },
        {
            'publication': 'Brisbane Times',
            'article_title': 'Calls for youth justice reform gain momentum',
            'publication_date': date.today() - timedelta(days=2),
            'citation_type': 'data_reference',
            'sentiment': 'positive'
        }
    ]
    
    for citation in media_citations:
        citation_id = impact.record_media_citation(citation)
        if citation_id:
            print(f"✓ Recorded media citation: {citation['publication']}")
    
    # Record a policy change
    policy_change = {
        'title': 'Pilot funding for restorative justice program',
        'description': '$2M allocated for community-based youth program pilot',
        'change_type': 'budget_reallocation',
        'date_announced': date.today() - timedelta(days=10),
        'department': 'Department of Youth Justice',
        'impact_estimate': '50 youth diverted from detention',
        'our_contribution': 'Data and advocacy influenced decision',
        'budget_amount': 2000000,
        'verified': True
    }
    
    change_id = impact.record_policy_change(policy_change)
    if change_id:
        print(f"✓ Recorded policy change: {policy_change['title']}")
    
    # Record member engagement
    impact.record_member_engagement(15, 'Attended coalition meeting')
    impact.record_member_engagement(25, 'Participated in email campaign')
    
    # Get impact summary
    summary = impact.get_impact_summary(30)
    
    print(f"\n30-Day Impact Summary:")
    print(f"  RTI Requests: {summary['rti_statistics']['total']} total, "
          f"{summary['rti_statistics']['answered']} answered")
    print(f"  Media reach: {summary['media_impact']['total_reach']:,} people")
    print(f"  Media citations: {summary['media_impact']['citations']}")
    print(f"  Policy changes: {len(summary['policy_changes'])}")
    print(f"  Coalition activity: {summary['coalition_activity']['recent_actions']} actions")
    
    # Generate full impact report
    report = impact.generate_impact_report()
    
    print(f"\nKey Achievements:")
    for achievement in report['achievements']:
        print(f"  ✓ {achievement['title']}: {achievement['description']}")
    
    print("\nAll demo features have been created successfully!")
    print("\nNext steps:")
    print("1. Check data/media/ folder for generated graphics")
    print("2. View coalition statistics in the dashboard")
    print("3. Use impact metrics for reporting and advocacy")

if __name__ == "__main__":
    main()