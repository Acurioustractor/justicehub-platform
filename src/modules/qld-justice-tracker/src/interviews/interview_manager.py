import json
from datetime import datetime
from typing import List, Dict, Optional
from loguru import logger
import re
from collections import Counter

from ..database import get_db, InterviewTemplate, Interview, InterviewResponse, InterviewTheme

class InterviewManager:
    """Manage interview templates and responses."""
    
    def __init__(self):
        self.templates = self._load_default_templates()
        
    def _load_default_templates(self) -> Dict[str, Dict]:
        """Load default interview templates for different stakeholder groups."""
        templates = {
            'youth': {
                'name': 'Youth in Detention Interview',
                'description': 'Interview template for young people with detention experience',
                'questions': [
                    {
                        'id': 'y1',
                        'text': 'Can you tell me about your experience when you first arrived at the detention center?',
                        'type': 'text',
                        'category': 'experience'
                    },
                    {
                        'id': 'y2',
                        'text': 'How often does your family visit you?',
                        'type': 'text',
                        'category': 'family_contact'
                    },
                    {
                        'id': 'y3',
                        'text': 'Do you know how much it costs your family to visit? (travel, time off work, etc.)',
                        'type': 'text',
                        'category': 'hidden_costs'
                    },
                    {
                        'id': 'y4',
                        'text': 'How much does it cost to make phone calls to your family?',
                        'type': 'cost',
                        'category': 'hidden_costs'
                    },
                    {
                        'id': 'y5',
                        'text': 'What programs or support would have helped you avoid detention?',
                        'type': 'text',
                        'category': 'prevention'
                    },
                    {
                        'id': 'y6',
                        'text': 'Have you had access to cultural programs or elders? (if Indigenous)',
                        'type': 'text',
                        'category': 'cultural_support'
                    },
                    {
                        'id': 'y7',
                        'text': 'What has been the hardest part for your family?',
                        'type': 'text',
                        'category': 'family_impact'
                    },
                    {
                        'id': 'y8',
                        'text': 'Do you feel the programs here are preparing you for release?',
                        'type': 'text',
                        'category': 'programs'
                    }
                ]
            },
            'family': {
                'name': 'Family Member Interview',
                'description': 'Interview template for family members of youth in detention',
                'questions': [
                    {
                        'id': 'f1',
                        'text': 'How far do you have to travel to visit your child/family member?',
                        'type': 'number',
                        'unit': 'km',
                        'category': 'travel'
                    },
                    {
                        'id': 'f2',
                        'text': 'How much does each visit cost in total? (fuel, parking, food, accommodation)',
                        'type': 'cost',
                        'category': 'hidden_costs'
                    },
                    {
                        'id': 'f3',
                        'text': 'How many days of work have you missed for visits, court dates, or meetings?',
                        'type': 'number',
                        'unit': 'days',
                        'category': 'lost_wages'
                    },
                    {
                        'id': 'f4',
                        'text': 'What is your estimated lost income from missed work?',
                        'type': 'cost',
                        'category': 'hidden_costs'
                    },
                    {
                        'id': 'f5',
                        'text': 'How much do you spend on phone calls per month?',
                        'type': 'cost',
                        'category': 'hidden_costs'
                    },
                    {
                        'id': 'f6',
                        'text': 'Have you had to pay for legal representation? If so, how much?',
                        'type': 'cost',
                        'category': 'legal_costs'
                    },
                    {
                        'id': 'f7',
                        'text': 'What other expenses have you faced that people might not know about?',
                        'type': 'text',
                        'category': 'hidden_costs'
                    },
                    {
                        'id': 'f8',
                        'text': 'How has this impacted other family members (siblings, etc.)?',
                        'type': 'text',
                        'category': 'family_impact'
                    },
                    {
                        'id': 'f9',
                        'text': 'What support services would have helped prevent detention?',
                        'type': 'text',
                        'category': 'prevention'
                    },
                    {
                        'id': 'f10',
                        'text': 'Do you feel the money spent on detention could be better used? How?',
                        'type': 'text',
                        'category': 'alternatives'
                    }
                ]
            },
            'worker': {
                'name': 'Youth Justice Worker Interview',
                'description': 'Interview template for youth justice workers and staff',
                'questions': [
                    {
                        'id': 'w1',
                        'text': 'What are the main factors leading young people into detention?',
                        'type': 'text',
                        'category': 'causes'
                    },
                    {
                        'id': 'w2',
                        'text': 'What percentage of youth in your facility are Indigenous?',
                        'type': 'number',
                        'unit': '%',
                        'category': 'demographics'
                    },
                    {
                        'id': 'w3',
                        'text': 'What programs have you seen work best for preventing reoffending?',
                        'type': 'text',
                        'category': 'effective_programs'
                    },
                    {
                        'id': 'w4',
                        'text': 'What are the hidden costs for families that the government doesn\'t track?',
                        'type': 'text',
                        'category': 'hidden_costs'
                    },
                    {
                        'id': 'w5',
                        'text': 'How could the same money be better spent on prevention or community programs?',
                        'type': 'text',
                        'category': 'alternatives'
                    },
                    {
                        'id': 'w6',
                        'text': 'What resources or programs are most needed but underfunded?',
                        'type': 'text',
                        'category': 'gaps'
                    },
                    {
                        'id': 'w7',
                        'text': 'How do detention costs compare to community-based alternatives you\'ve seen?',
                        'type': 'text',
                        'category': 'cost_comparison'
                    },
                    {
                        'id': 'w8',
                        'text': 'What systemic changes would make the biggest difference?',
                        'type': 'text',
                        'category': 'system_reform'
                    }
                ]
            },
            'provider': {
                'name': 'Service Provider Interview',
                'description': 'Interview template for community service providers',
                'questions': [
                    {
                        'id': 'p1',
                        'text': 'What services do you provide to youth at risk or leaving detention?',
                        'type': 'text',
                        'category': 'services'
                    },
                    {
                        'id': 'p2',
                        'text': 'What is your annual budget and cost per youth served?',
                        'type': 'cost',
                        'category': 'costs'
                    },
                    {
                        'id': 'p3',
                        'text': 'How does your cost compare to detention costs?',
                        'type': 'text',
                        'category': 'cost_comparison'
                    },
                    {
                        'id': 'p4',
                        'text': 'What are your success rates in preventing detention or reoffending?',
                        'type': 'number',
                        'unit': '%',
                        'category': 'outcomes'
                    },
                    {
                        'id': 'p5',
                        'text': 'What additional funding would allow you to serve more youth?',
                        'type': 'cost',
                        'category': 'funding_needs'
                    },
                    {
                        'id': 'p6',
                        'text': 'What gaps in services lead youth into detention?',
                        'type': 'text',
                        'category': 'service_gaps'
                    },
                    {
                        'id': 'p7',
                        'text': 'How many youth could you serve with the cost of one detention placement?',
                        'type': 'number',
                        'category': 'cost_effectiveness'
                    },
                    {
                        'id': 'p8',
                        'text': 'What early intervention programs show the best results?',
                        'type': 'text',
                        'category': 'effective_programs'
                    }
                ]
            }
        }
        
        return templates
    
    def create_template_in_db(self, stakeholder_type: str):
        """Create interview template in database."""
        if stakeholder_type not in self.templates:
            raise ValueError(f"Unknown stakeholder type: {stakeholder_type}")
            
        template_data = self.templates[stakeholder_type]
        
        db = next(get_db())
        
        try:
            # Check if template already exists
            existing = db.query(InterviewTemplate).filter_by(
                stakeholder_type=stakeholder_type
            ).first()
            
            if not existing:
                template = InterviewTemplate(
                    name=template_data['name'],
                    stakeholder_type=stakeholder_type,
                    description=template_data['description'],
                    questions=json.dumps(template_data['questions'])
                )
                db.add(template)
                db.commit()
                logger.info(f"Created template for {stakeholder_type}")
                return template.id
            else:
                return existing.id
                
        except Exception as e:
            logger.error(f"Error creating template: {e}")
            db.rollback()
        finally:
            db.close()
    
    def conduct_interview(self, stakeholder_type: str, participant_code: str,
                         responses: Dict[str, str], interviewer: str = None,
                         location: str = None) -> Optional[int]:
        """Record interview responses."""
        db = next(get_db())
        
        try:
            # Get template
            template = db.query(InterviewTemplate).filter_by(
                stakeholder_type=stakeholder_type
            ).first()
            
            if not template:
                # Create template if it doesn't exist
                self.create_template_in_db(stakeholder_type)
                template = db.query(InterviewTemplate).filter_by(
                    stakeholder_type=stakeholder_type
                ).first()
            
            # Create interview record
            interview = Interview(
                template_id=template.id,
                participant_code=participant_code,
                stakeholder_type=stakeholder_type,
                interview_date=datetime.now(),
                location=location,
                interviewer=interviewer,
                duration_minutes=len(responses) * 5,  # Estimate
                consent_given=True
            )
            db.add(interview)
            db.flush()
            
            # Load questions
            questions = json.loads(template.questions)
            question_map = {q['id']: q for q in questions}
            
            # Save responses
            for question_id, response_text in responses.items():
                if question_id in question_map:
                    question = question_map[question_id]
                    
                    response = InterviewResponse(
                        interview_id=interview.id,
                        question_id=question_id,
                        question_text=question['text'],
                        response_text=str(response_text),
                        response_type=question.get('type', 'text')
                    )
                    db.add(response)
            
            db.commit()
            
            # Extract themes
            self._extract_themes(interview.id)
            
            logger.info(f"Recorded interview {interview.id} for {participant_code}")
            return interview.id
            
        except Exception as e:
            logger.error(f"Error recording interview: {e}")
            db.rollback()
            return None
        finally:
            db.close()
    
    def _extract_themes(self, interview_id: int):
        """Extract themes from interview responses."""
        db = next(get_db())
        
        try:
            # Get interview and responses
            interview = db.query(Interview).filter_by(id=interview_id).first()
            responses = db.query(InterviewResponse).filter_by(interview_id=interview_id).all()
            
            # Combine all response text
            all_text = ' '.join(r.response_text for r in responses if r.response_text)
            
            # Define theme keywords
            theme_keywords = {
                'Financial Burden': ['cost', 'expense', 'money', 'afford', 'pay', 'price', 'dollar'],
                'Family Separation': ['visit', 'miss', 'far', 'distance', 'separation', 'apart'],
                'Lost Opportunities': ['work', 'job', 'school', 'education', 'future', 'career'],
                'Mental Health': ['stress', 'worry', 'anxiety', 'depression', 'mental', 'emotional'],
                'Cultural Disconnection': ['culture', 'elder', 'traditional', 'language', 'identity'],
                'System Failures': ['support', 'help', 'service', 'program', 'failed', 'gap'],
                'Indigenous Overrepresentation': ['indigenous', 'aboriginal', 'first nations', 'closing the gap'],
                'Alternative Solutions': ['community', 'prevention', 'early', 'intervention', 'alternative']
            }
            
            # Extract themes
            for theme_name, keywords in theme_keywords.items():
                # Check if theme is present
                theme_score = sum(1 for keyword in keywords if keyword in all_text.lower())
                
                if theme_score > 0:
                    # Find supporting quote
                    quote = self._find_supporting_quote(all_text, keywords)
                    
                    theme = InterviewTheme(
                        interview_id=interview_id,
                        theme=theme_name,
                        description=f"References to {theme_name.lower()} found in interview",
                        quote=quote,
                        importance_score=min(5, theme_score)
                    )
                    db.add(theme)
            
            db.commit()
            
        except Exception as e:
            logger.error(f"Error extracting themes: {e}")
            db.rollback()
        finally:
            db.close()
    
    def _find_supporting_quote(self, text: str, keywords: List[str]) -> str:
        """Find a supporting quote containing theme keywords."""
        sentences = text.split('.')
        
        for sentence in sentences:
            if any(keyword in sentence.lower() for keyword in keywords):
                return sentence.strip()[:500]  # Limit length
                
        return ""
    
    def get_interview_summary(self, interview_id: int) -> Dict:
        """Get summary of an interview including themes and key responses."""
        db = next(get_db())
        
        try:
            interview = db.query(Interview).filter_by(id=interview_id).first()
            if not interview:
                return {}
                
            responses = db.query(InterviewResponse).filter_by(interview_id=interview_id).all()
            themes = db.query(InterviewTheme).filter_by(interview_id=interview_id).all()
            
            # Extract costs mentioned
            costs = []
            for response in responses:
                if response.response_type == 'cost':
                    try:
                        amount = float(re.sub(r'[^\d.]', '', response.response_text))
                        costs.append({
                            'question': response.question_text,
                            'amount': amount
                        })
                    except:
                        pass
            
            summary = {
                'interview_id': interview_id,
                'stakeholder_type': interview.stakeholder_type,
                'participant_code': interview.participant_code,
                'date': interview.interview_date,
                'themes': [
                    {
                        'name': theme.theme,
                        'score': theme.importance_score,
                        'quote': theme.quote
                    }
                    for theme in themes
                ],
                'costs_mentioned': costs,
                'total_costs': sum(c['amount'] for c in costs),
                'response_count': len(responses)
            }
            
            return summary
            
        finally:
            db.close()
    
    def analyze_all_interviews(self) -> Dict:
        """Analyze all interviews for patterns and insights."""
        db = next(get_db())
        
        try:
            interviews = db.query(Interview).all()
            
            # Aggregate themes
            all_themes = db.query(InterviewTheme).all()
            theme_counts = Counter(theme.theme for theme in all_themes)
            
            # Aggregate costs by category
            cost_responses = db.query(InterviewResponse).filter_by(
                response_type='cost'
            ).all()
            
            costs_by_category = {}
            for response in cost_responses:
                try:
                    amount = float(re.sub(r'[^\d.]', '', response.response_text))
                    question_text = response.question_text.lower()
                    
                    if 'travel' in question_text or 'visit' in question_text:
                        category = 'Travel'
                    elif 'phone' in question_text or 'call' in question_text:
                        category = 'Communication'
                    elif 'legal' in question_text or 'lawyer' in question_text:
                        category = 'Legal'
                    elif 'work' in question_text or 'wage' in question_text:
                        category = 'Lost Wages'
                    else:
                        category = 'Other'
                    
                    if category not in costs_by_category:
                        costs_by_category[category] = []
                    costs_by_category[category].append(amount)
                    
                except:
                    pass
            
            # Calculate averages
            cost_averages = {
                cat: sum(costs) / len(costs) if costs else 0
                for cat, costs in costs_by_category.items()
            }
            
            analysis = {
                'total_interviews': len(interviews),
                'by_stakeholder': Counter(i.stakeholder_type for i in interviews),
                'top_themes': theme_counts.most_common(10),
                'cost_averages': cost_averages,
                'total_hidden_costs_identified': sum(cost_averages.values()),
                'interviews_mentioning_costs': len(set(r.interview_id for r in cost_responses))
            }
            
            return analysis
            
        finally:
            db.close()