from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .models import (
    Base, BudgetAllocation, Expenditure, YouthStatistics, ParliamentaryDocument,
    CostComparison, RTIRequest, Report, Interview, InterviewTemplate, 
    InterviewResponse, InterviewTheme, HiddenCost, FamilyCostCalculation,
    MediaCitation, PolicyChange, ImpactMetric, CoalitionMember, 
    CoalitionAction, SharedDocument, Event
)
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///data/youth_justice.db')

engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """Initialize the database by creating all tables."""
    Base.metadata.create_all(bind=engine)
    
    # Import here to avoid circular import
    from .populate_sample_data import populate_sample_data
    try:
        populate_sample_data()
    except Exception as e:
        print(f"Warning: Could not populate sample data: {e}")

def get_db():
    """Get a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()