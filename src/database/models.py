from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime, Date, Text, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from datetime import datetime

Base = declarative_base()

class BudgetAllocation(Base):
    __tablename__ = 'budget_allocations'
    
    id = Column(Integer, primary_key=True)
    fiscal_year = Column(String(20), nullable=False)
    department = Column(String(200))
    program = Column(String(200), nullable=False)
    category = Column(String(100))  # 'detention' or 'community'
    amount = Column(Float, nullable=False)
    description = Column(Text)
    source_url = Column(String(500))
    source_document = Column(String(200))
    scraped_date = Column(DateTime, default=datetime.utcnow)
    
    expenditures = relationship("Expenditure", back_populates="allocation")

class Expenditure(Base):
    __tablename__ = 'expenditures'
    
    id = Column(Integer, primary_key=True)
    allocation_id = Column(Integer, ForeignKey('budget_allocations.id'))
    date = Column(Date, nullable=False)
    amount = Column(Float, nullable=False)
    facility_name = Column(String(200))
    program_type = Column(String(100))  # 'detention' or 'community'
    daily_cost = Column(Float)  # Cost per youth per day
    youth_count = Column(Integer)
    indigenous_youth_count = Column(Integer)
    description = Column(Text)
    
    allocation = relationship("BudgetAllocation", back_populates="expenditures")

class YouthStatistics(Base):
    __tablename__ = 'youth_statistics'
    
    id = Column(Integer, primary_key=True)
    date = Column(Date, nullable=False)
    facility_name = Column(String(200))
    total_youth = Column(Integer, nullable=False)
    indigenous_youth = Column(Integer)
    indigenous_percentage = Column(Float)
    average_age = Column(Float)
    average_stay_days = Column(Float)
    program_type = Column(String(100))  # 'detention' or 'community'
    source_url = Column(String(500))
    scraped_date = Column(DateTime, default=datetime.utcnow)

class ParliamentaryDocument(Base):
    __tablename__ = 'parliamentary_documents'
    
    id = Column(Integer, primary_key=True)
    document_type = Column(String(100))  # 'hansard', 'committee_report', 'question_on_notice'
    title = Column(String(500), nullable=False)
    date = Column(Date)
    author = Column(String(200))
    url = Column(String(500), unique=True)
    content = Column(Text)
    mentions_youth_justice = Column(Boolean, default=False)
    mentions_spending = Column(Boolean, default=False)
    mentions_indigenous = Column(Boolean, default=False)
    scraped_date = Column(DateTime, default=datetime.utcnow)

class CostComparison(Base):
    __tablename__ = 'cost_comparisons'
    
    id = Column(Integer, primary_key=True)
    date = Column(Date, nullable=False)
    detention_daily_cost = Column(Float, nullable=False)  # $857/day
    community_daily_cost = Column(Float, nullable=False)  # $41/day
    cost_ratio = Column(Float)
    detention_spending_percentage = Column(Float)  # 90.6%
    community_spending_percentage = Column(Float)  # 9.4%
    total_budget = Column(Float)
    notes = Column(Text)

class RTIRequest(Base):
    __tablename__ = 'rti_requests'
    
    id = Column(Integer, primary_key=True)
    request_date = Column(Date, nullable=False)
    department = Column(String(200), nullable=False)
    subject = Column(String(500), nullable=False)
    request_text = Column(Text, nullable=False)
    response_date = Column(Date)
    response_summary = Column(Text)
    documents_received = Column(Integer)
    status = Column(String(50))  # 'pending', 'partial', 'complete', 'refused'
    reference_number = Column(String(100))

class Report(Base):
    __tablename__ = 'reports'
    
    id = Column(Integer, primary_key=True)
    report_date = Column(Date, nullable=False)
    report_type = Column(String(50))  # 'weekly', 'monthly', 'ad-hoc'
    title = Column(String(500), nullable=False)
    summary = Column(Text)
    key_findings = Column(Text)
    recommendations = Column(Text)
    file_path = Column(String(500))
    sent_to = Column(String(500))
    created_date = Column(DateTime, default=datetime.utcnow)

class InterviewTemplate(Base):
    __tablename__ = 'interview_templates'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    stakeholder_type = Column(String(50), nullable=False)  # 'youth', 'family', 'worker', 'provider'
    description = Column(Text)
    questions = Column(Text, nullable=False)  # JSON format
    created_date = Column(DateTime, default=datetime.utcnow)
    updated_date = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Interview(Base):
    __tablename__ = 'interviews'
    
    id = Column(Integer, primary_key=True)
    template_id = Column(Integer, ForeignKey('interview_templates.id'))
    participant_code = Column(String(50), nullable=False)  # Anonymous code
    stakeholder_type = Column(String(50), nullable=False)
    interview_date = Column(DateTime, nullable=False)
    location = Column(String(200))
    interviewer = Column(String(100))
    duration_minutes = Column(Integer)
    consent_given = Column(Boolean, default=True)
    
    template = relationship("InterviewTemplate")
    responses = relationship("InterviewResponse", back_populates="interview")
    themes = relationship("InterviewTheme", back_populates="interview")

class InterviewResponse(Base):
    __tablename__ = 'interview_responses'
    
    id = Column(Integer, primary_key=True)
    interview_id = Column(Integer, ForeignKey('interviews.id'))
    question_id = Column(String(50), nullable=False)
    question_text = Column(Text, nullable=False)
    response_text = Column(Text)
    response_type = Column(String(50))  # 'text', 'number', 'cost', 'scale'
    
    interview = relationship("Interview", back_populates="responses")

class InterviewTheme(Base):
    __tablename__ = 'interview_themes'
    
    id = Column(Integer, primary_key=True)
    interview_id = Column(Integer, ForeignKey('interviews.id'))
    theme = Column(String(100), nullable=False)
    description = Column(Text)
    quote = Column(Text)  # Supporting quote from interview
    importance_score = Column(Float)  # 1-5 scale
    
    interview = relationship("Interview", back_populates="themes")

class HiddenCost(Base):
    __tablename__ = 'hidden_costs'
    
    id = Column(Integer, primary_key=True)
    cost_category = Column(String(100), nullable=False)  # 'travel', 'phone', 'legal', 'lost_wages'
    stakeholder_type = Column(String(50))  # Who bears this cost
    description = Column(Text)
    amount_per_instance = Column(Float)
    frequency = Column(String(50))  # 'daily', 'weekly', 'per_visit'
    annual_estimate = Column(Float)
    source = Column(String(200))  # Interview, calculation, or external source
    notes = Column(Text)
    created_date = Column(DateTime, default=datetime.utcnow)

class FamilyCostCalculation(Base):
    __tablename__ = 'family_cost_calculations'
    
    id = Column(Integer, primary_key=True)
    calculation_date = Column(Date, nullable=False)
    youth_location = Column(String(200), nullable=False)  # Detention facility
    family_location = Column(String(200), nullable=False)  # Home town
    
    # Travel costs
    distance_km = Column(Float)
    travel_cost_per_trip = Column(Float)
    trips_per_month = Column(Integer)
    monthly_travel_cost = Column(Float)
    
    # Communication costs
    phone_calls_per_week = Column(Integer)
    call_cost_per_minute = Column(Float)
    average_call_duration = Column(Integer)
    monthly_phone_cost = Column(Float)
    
    # Lost wages
    work_days_missed_per_month = Column(Float)
    average_daily_wage = Column(Float)
    monthly_lost_wages = Column(Float)
    
    # Legal costs
    legal_representation = Column(Boolean)
    legal_cost_estimate = Column(Float)
    
    # Totals
    total_monthly_cost = Column(Float)
    total_annual_cost = Column(Float)
    
    # Comparison
    official_daily_cost = Column(Float, default=857)
    family_cost_percentage = Column(Float)  # Family cost as % of official cost
    
    notes = Column(Text)

class CoalitionMember(Base):
    __tablename__ = 'coalition_members'
    
    id = Column(Integer, primary_key=True)
    organization_name = Column(String(200), nullable=False)
    contact_name = Column(String(100), nullable=False)
    email = Column(String(200), nullable=False, unique=True)
    phone = Column(String(50))
    organization_type = Column(String(100))  # 'ngo', 'community', 'academic', 'legal', 'media'
    location = Column(String(200))
    website = Column(String(500))
    areas_of_interest = Column(Text)  # JSON array
    active = Column(Boolean, default=True)
    joined_date = Column(DateTime, default=datetime.utcnow)
    last_contact = Column(DateTime)
    notes = Column(Text)
    
    actions = relationship("CoalitionAction", back_populates="member")

class CoalitionAction(Base):
    __tablename__ = 'coalition_actions'
    
    id = Column(Integer, primary_key=True)
    member_id = Column(Integer, ForeignKey('coalition_members.id'))
    action_type = Column(String(100))  # 'email_sent', 'document_accessed', 'event_attended'
    action_date = Column(DateTime, default=datetime.utcnow)
    details = Column(Text)
    
    member = relationship("CoalitionMember", back_populates="actions")

class SharedDocument(Base):
    __tablename__ = 'shared_documents'
    
    id = Column(Integer, primary_key=True)
    title = Column(String(500), nullable=False)
    category = Column(String(100))  # 'rti_template', 'media_kit', 'research', 'guide'
    description = Column(Text)
    file_path = Column(String(500))
    download_count = Column(Integer, default=0)
    uploaded_by = Column(String(200))
    uploaded_date = Column(DateTime, default=datetime.utcnow)
    last_accessed = Column(DateTime)
    tags = Column(Text)  # JSON array

class MediaCitation(Base):
    __tablename__ = 'media_citations'
    
    id = Column(Integer, primary_key=True)
    publication = Column(String(200), nullable=False)
    article_title = Column(String(500), nullable=False)
    article_url = Column(String(500))
    publication_date = Column(Date, nullable=False)
    author = Column(String(200))
    citation_type = Column(String(100))  # 'direct_quote', 'data_reference', 'mention'
    quoted_text = Column(Text)
    reach_estimate = Column(Integer)  # Estimated audience
    sentiment = Column(String(50))  # 'positive', 'neutral', 'negative'
    notes = Column(Text)
    created_date = Column(DateTime, default=datetime.utcnow)

class PolicyChange(Base):
    __tablename__ = 'policy_changes'
    
    id = Column(Integer, primary_key=True)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    change_type = Column(String(100))  # 'budget_reallocation', 'program_creation', 'legislation'
    date_announced = Column(Date)
    date_implemented = Column(Date)
    department = Column(String(200))
    impact_estimate = Column(Text)  # Description of impact
    our_contribution = Column(Text)  # How we influenced it
    supporting_documents = Column(Text)  # JSON array of URLs
    verified = Column(Boolean, default=False)
    created_date = Column(DateTime, default=datetime.utcnow)

class ImpactMetric(Base):
    __tablename__ = 'impact_metrics'
    
    id = Column(Integer, primary_key=True)
    metric_date = Column(Date, nullable=False)
    metric_type = Column(String(100), nullable=False)  # 'rti_filed', 'media_reach', 'members_engaged'
    value = Column(Float, nullable=False)
    details = Column(Text)
    created_date = Column(DateTime, default=datetime.utcnow)

class Event(Base):
    __tablename__ = 'events'
    
    id = Column(Integer, primary_key=True)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    event_type = Column(String(100))  # 'meeting', 'rally', 'workshop', 'webinar'
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime)
    location = Column(String(500))
    online_link = Column(String(500))
    organizer = Column(String(200))
    expected_attendance = Column(Integer)
    actual_attendance = Column(Integer)
    notes = Column(Text)
    created_date = Column(DateTime, default=datetime.utcnow)