import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import hashlib
import secrets
from loguru import logger

from ..database import get_db, CoalitionMember, CoalitionAction, SharedDocument, Event
from ..automation.email_alerts import EmailAlertSystem

class CoalitionManager:
    """Manage coalition members, communications, and shared resources."""
    
    def __init__(self):
        self.email_system = EmailAlertSystem()
        self.organization_types = [
            'ngo',
            'community',
            'academic',
            'legal',
            'media',
            'faith',
            'union',
            'student',
            'indigenous',
            'other'
        ]
        
        self.interest_areas = [
            'youth_advocacy',
            'indigenous_justice',
            'criminal_justice_reform',
            'human_rights',
            'child_welfare',
            'education',
            'mental_health',
            'substance_abuse',
            'homelessness',
            'policy_reform'
        ]
    
    def register_member(self, member_data: Dict) -> Optional[int]:
        """Register a new coalition member."""
        db = next(get_db())
        
        try:
            # Check if email already exists
            existing = db.query(CoalitionMember).filter_by(
                email=member_data['email']
            ).first()
            
            if existing:
                logger.warning(f"Member already exists: {member_data['email']}")
                return None
            
            # Create new member
            member = CoalitionMember(
                organization_name=member_data['organization_name'],
                contact_name=member_data['contact_name'],
                email=member_data['email'],
                phone=member_data.get('phone'),
                organization_type=member_data.get('organization_type', 'other'),
                location=member_data.get('location'),
                website=member_data.get('website'),
                areas_of_interest=json.dumps(member_data.get('areas_of_interest', [])),
                notes=member_data.get('notes')
            )
            
            db.add(member)
            db.commit()
            
            # Send welcome email
            self._send_welcome_email(member)
            
            # Log action
            action = CoalitionAction(
                member_id=member.id,
                action_type='joined',
                details='Joined the coalition'
            )
            db.add(action)
            db.commit()
            
            logger.info(f"Registered new coalition member: {member.organization_name}")
            return member.id
            
        except Exception as e:
            logger.error(f"Error registering member: {e}")
            db.rollback()
            return None
        finally:
            db.close()
    
    def _send_welcome_email(self, member: CoalitionMember):
        """Send welcome email to new member."""
        subject = "Welcome to the Queensland Youth Justice Reform Coalition"
        
        html_content = f"""
        <html>
        <body>
            <h2>Welcome to the Coalition, {member.contact_name}!</h2>
            
            <p>Thank you for joining the Queensland Youth Justice Reform Coalition. 
            Together, we're working to shift youth justice spending from detention to 
            proven community programs.</p>
            
            <h3>What happens next:</h3>
            <ul>
                <li>You'll receive our weekly updates on youth justice data and advocacy opportunities</li>
                <li>Access our shared resources including RTI templates and media kits</li>
                <li>Invitations to coalition meetings and actions</li>
                <li>Opportunities to collaborate on research and advocacy</li>
            </ul>
            
            <h3>Key Facts:</h3>
            <ul>
                <li>Queensland spends $857/day on youth detention vs $41/day on community programs</li>
                <li>90.6% of the youth justice budget goes to detention</li>
                <li>Indigenous youth are 22-33x overrepresented in detention</li>
            </ul>
            
            <p>Visit our dashboard at <a href="https://qld-youth-justice-tracker.org">qld-youth-justice-tracker.org</a> 
            for real-time data and visualizations.</p>
            
            <p>If you have any questions, please don't hesitate to reach out.</p>
            
            <p>In solidarity,<br>
            The Queensland Youth Justice Reform Coalition</p>
        </body>
        </html>
        """
        
        self.email_system.send_email([member.email], subject, html_content)
    
    def send_action_alert(self, alert_data: Dict) -> int:
        """Send action alert to coalition members."""
        db = next(get_db())
        sent_count = 0
        
        try:
            # Get active members based on interest areas
            query = db.query(CoalitionMember).filter(CoalitionMember.active == True)
            
            # Filter by interest areas if specified
            if alert_data.get('target_interests'):
                members = []
                for member in query.all():
                    interests = json.loads(member.areas_of_interest or '[]')
                    if any(interest in alert_data['target_interests'] for interest in interests):
                        members.append(member)
            else:
                members = query.all()
            
            # Prepare email
            subject = f"[ACTION ALERT] {alert_data['subject']}"
            
            html_template = """
            <html>
            <body>
                <div style="background-color: #e74c3c; color: white; padding: 20px; text-align: center;">
                    <h1>ACTION ALERT</h1>
                </div>
                
                <div style="padding: 20px;">
                    <h2>{{ title }}</h2>
                    
                    <p><strong>Deadline:</strong> {{ deadline }}</p>
                    
                    <div style="background-color: #f4f4f4; padding: 15px; margin: 20px 0;">
                        {{ description }}
                    </div>
                    
                    <h3>What you can do:</h3>
                    {{ action_items }}
                    
                    {% if resources %}
                    <h3>Resources:</h3>
                    <ul>
                    {% for resource in resources %}
                        <li><a href="{{ resource.url }}">{{ resource.title }}</a></li>
                    {% endfor %}
                    </ul>
                    {% endif %}
                    
                    <p><a href="{{ action_link }}" style="background-color: #e74c3c; color: white; padding: 10px 20px; text-decoration: none; display: inline-block;">TAKE ACTION NOW</a></p>
                </div>
                
                <div style="background-color: #f4f4f4; padding: 20px; margin-top: 30px; font-size: 12px;">
                    <p>You're receiving this because you're a member of the Queensland Youth Justice Reform Coalition.</p>
                </div>
            </body>
            </html>
            """
            
            from jinja2 import Template
            template = Template(html_template)
            html_content = template.render(**alert_data)
            
            # Send in batches
            batch_size = 50
            for i in range(0, len(members), batch_size):
                batch = members[i:i+batch_size]
                emails = [m.email for m in batch]
                
                if self.email_system.send_email(emails, subject, html_content):
                    sent_count += len(emails)
                    
                    # Log actions
                    for member in batch:
                        action = CoalitionAction(
                            member_id=member.id,
                            action_type='email_sent',
                            details=f"Action alert: {alert_data['subject']}"
                        )
                        db.add(action)
                        member.last_contact = datetime.now()
                    
                    db.commit()
            
            logger.info(f"Sent action alert to {sent_count} members")
            
        except Exception as e:
            logger.error(f"Error sending action alert: {e}")
            db.rollback()
        finally:
            db.close()
        
        return sent_count
    
    def add_shared_document(self, doc_data: Dict) -> Optional[int]:
        """Add a document to the shared repository."""
        db = next(get_db())
        
        try:
            document = SharedDocument(
                title=doc_data['title'],
                category=doc_data.get('category', 'other'),
                description=doc_data.get('description'),
                file_path=doc_data.get('file_path'),
                uploaded_by=doc_data.get('uploaded_by', 'System'),
                tags=json.dumps(doc_data.get('tags', []))
            )
            
            db.add(document)
            db.commit()
            
            logger.info(f"Added shared document: {document.title}")
            return document.id
            
        except Exception as e:
            logger.error(f"Error adding document: {e}")
            db.rollback()
            return None
        finally:
            db.close()
    
    def get_document(self, doc_id: int, member_id: Optional[int] = None) -> Optional[Dict]:
        """Get a shared document and track access."""
        db = next(get_db())
        
        try:
            document = db.query(SharedDocument).filter_by(id=doc_id).first()
            
            if not document:
                return None
            
            # Update access tracking
            document.download_count += 1
            document.last_accessed = datetime.now()
            
            # Log member action if provided
            if member_id:
                action = CoalitionAction(
                    member_id=member_id,
                    action_type='document_accessed',
                    details=f"Accessed: {document.title}"
                )
                db.add(action)
            
            db.commit()
            
            return {
                'id': document.id,
                'title': document.title,
                'category': document.category,
                'description': document.description,
                'file_path': document.file_path,
                'download_count': document.download_count,
                'uploaded_by': document.uploaded_by,
                'uploaded_date': document.uploaded_date,
                'tags': json.loads(document.tags or '[]')
            }
            
        except Exception as e:
            logger.error(f"Error accessing document: {e}")
            db.rollback()
            return None
        finally:
            db.close()
    
    def create_event(self, event_data: Dict) -> Optional[int]:
        """Create a coalition event."""
        db = next(get_db())
        
        try:
            event = Event(
                title=event_data['title'],
                description=event_data.get('description'),
                event_type=event_data.get('event_type', 'meeting'),
                start_date=event_data['start_date'],
                end_date=event_data.get('end_date'),
                location=event_data.get('location'),
                online_link=event_data.get('online_link'),
                organizer=event_data.get('organizer', 'Coalition'),
                expected_attendance=event_data.get('expected_attendance')
            )
            
            db.add(event)
            db.commit()
            
            logger.info(f"Created event: {event.title}")
            return event.id
            
        except Exception as e:
            logger.error(f"Error creating event: {e}")
            db.rollback()
            return None
        finally:
            db.close()
    
    def get_member_statistics(self) -> Dict:
        """Get coalition membership statistics."""
        db = next(get_db())
        
        try:
            total_members = db.query(CoalitionMember).count()
            active_members = db.query(CoalitionMember).filter(
                CoalitionMember.active == True
            ).count()
            
            # Members by type
            type_counts = {}
            for org_type in self.organization_types:
                count = db.query(CoalitionMember).filter(
                    CoalitionMember.organization_type == org_type
                ).count()
                if count > 0:
                    type_counts[org_type] = count
            
            # Recent activity
            week_ago = datetime.now() - timedelta(days=7)
            recent_actions = db.query(CoalitionAction).filter(
                CoalitionAction.action_date >= week_ago
            ).count()
            
            # Popular documents
            popular_docs = db.query(SharedDocument).order_by(
                SharedDocument.download_count.desc()
            ).limit(5).all()
            
            return {
                'total_members': total_members,
                'active_members': active_members,
                'members_by_type': type_counts,
                'recent_actions': recent_actions,
                'popular_documents': [
                    {
                        'title': doc.title,
                        'downloads': doc.download_count
                    }
                    for doc in popular_docs
                ]
            }
            
        finally:
            db.close()
    
    def get_upcoming_events(self, limit: int = 10) -> List[Dict]:
        """Get upcoming coalition events."""
        db = next(get_db())
        
        try:
            events = db.query(Event).filter(
                Event.start_date >= datetime.now()
            ).order_by(Event.start_date).limit(limit).all()
            
            return [
                {
                    'id': event.id,
                    'title': event.title,
                    'description': event.description,
                    'event_type': event.event_type,
                    'start_date': event.start_date,
                    'location': event.location,
                    'online_link': event.online_link,
                    'organizer': event.organizer
                }
                for event in events
            ]
            
        finally:
            db.close()
    
    def generate_member_token(self, member_id: int) -> str:
        """Generate secure access token for member."""
        # Simple token generation - in production, use proper JWT
        data = f"{member_id}:{datetime.now().isoformat()}:{secrets.token_urlsafe(16)}"
        return hashlib.sha256(data.encode()).hexdigest()[:32]