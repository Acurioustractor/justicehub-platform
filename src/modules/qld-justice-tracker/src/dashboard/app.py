import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from src.analysis.cost_analysis import CostAnalyzer
from src.analysis.hidden_costs_calculator import HiddenCostsCalculator
from src.interviews.interview_manager import InterviewManager
from src.database import get_db, BudgetAllocation, YouthStatistics, ParliamentaryDocument, Interview, InterviewTheme

st.set_page_config(
    page_title="Queensland Youth Justice Spending Tracker",
    page_icon="📊",
    layout="wide"
)

st.title("Queensland Youth Justice Spending Transparency Dashboard")
st.markdown("---")

# Initialize components
analyzer = CostAnalyzer()
hidden_calc = HiddenCostsCalculator()
interview_mgr = InterviewManager()

# Sidebar
st.sidebar.header("Navigation")
page = st.sidebar.selectbox(
    "Select Page",
    ["Overview", "Cost Analysis", "Hidden Costs", "Indigenous Disparities", "Alternative Scenarios", "Parliamentary Activity", "Interviews", "RTI Templates"]
)

if page == "Overview":
    st.header("Current Spending Overview")
    
    # Key metrics
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("Detention Cost", "$857/day", "per youth")
    
    with col2:
        st.metric("Community Cost", "$41/day", "per youth")
    
    with col3:
        st.metric("Cost Ratio", "20.9x", "detention vs community")
    
    with col4:
        st.metric("Current Split", "90.6% / 9.4%", "detention / community")
    
    # Spending breakdown pie chart
    st.subheader("Budget Allocation Split")
    
    split_data = analyzer.calculate_spending_split()
    
    fig = go.Figure(data=[go.Pie(
        labels=['Detention', 'Community Programs'],
        values=[split_data['detention_percentage'], split_data['community_percentage']],
        hole=.3,
        marker_colors=['#FF6B6B', '#4ECDC4']
    )])
    
    fig.update_layout(
        title="Current Youth Justice Budget Allocation",
        height=400
    )
    
    st.plotly_chart(fig, use_container_width=True)
    
    # Cost comparison
    st.subheader("Daily Cost Comparison")
    
    cost_df = pd.DataFrame({
        'Program Type': ['Youth Detention', 'Community Supervision', 'Restorative Justice', 'Early Intervention'],
        'Daily Cost': [857, 41, 25, 15],
        'Success Rate': [30, 55, 65, 75]
    })
    
    fig2 = px.bar(cost_df, x='Program Type', y='Daily Cost', 
                  color='Success Rate', color_continuous_scale='RdYlGn',
                  title='Daily Cost per Youth by Program Type')
    
    st.plotly_chart(fig2, use_container_width=True)

elif page == "Cost Analysis":
    st.header("Detailed Cost Analysis")
    
    # Cost per outcome
    st.subheader("Cost per Successful Outcome")
    
    outcomes = analyzer.calculate_cost_per_outcome()
    
    outcome_df = pd.DataFrame([
        {
            'Program': program,
            'Total Cost per Youth': data['cost_per_youth'],
            'Success Rate': data['success_rate'] * 100,
            'Cost per Success': data['cost_per_success']
        }
        for program, data in outcomes.items()
    ])
    
    fig = px.scatter(outcome_df, x='Success Rate', y='Cost per Success', 
                     size='Total Cost per Youth', hover_data=['Program'],
                     title='Program Effectiveness: Success Rate vs Cost per Successful Outcome')
    
    st.plotly_chart(fig, use_container_width=True)
    
    # Savings projection
    st.subheader("Projected Savings from Reallocation")
    
    projections = analyzer.project_savings()
    
    fig2 = go.Figure()
    
    fig2.add_trace(go.Scatter(
        x=projections['year'],
        y=projections['cumulative_savings'],
        mode='lines+markers',
        name='Cumulative Savings',
        line=dict(color='green', width=3)
    ))
    
    fig2.update_layout(
        title='5-Year Projected Savings from Shifting to Community Programs',
        xaxis_title='Year',
        yaxis_title='Cumulative Savings ($)',
        height=400
    )
    
    st.plotly_chart(fig2, use_container_width=True)
    
    # Display projection table
    st.dataframe(projections[['year', 'detention_percentage', 'community_percentage', 
                            'total_youth_served', 'successful_outcomes', 'cumulative_savings']])

elif page == "Indigenous Disparities":
    st.header("Indigenous Youth Detention Disparities")
    
    disparities = analyzer.analyze_indigenous_disparities()
    
    # Key metrics
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric("Indigenous Youth in Detention", 
                  f"{disparities['indigenous_percentage_detained']:.0f}%",
                  f"vs {disparities['indigenous_percentage_population']}% of population")
    
    with col2:
        st.metric("Overrepresentation Factor", 
                  f"{disparities['overrepresentation_factor']:.0f}x",
                  "higher than population rate")
    
    with col3:
        st.metric("Non-Indigenous in Detention", 
                  f"{100 - disparities['indigenous_percentage_detained']:.0f}%",
                  "of detained youth")
    
    # Visualization
    st.subheader("Representation in Youth Justice System")
    
    rep_data = pd.DataFrame({
        'Category': ['General Youth Population', 'Youth in Detention'],
        'Indigenous': [6, disparities['indigenous_percentage_detained']],
        'Non-Indigenous': [94, 100 - disparities['indigenous_percentage_detained']]
    })
    
    fig = px.bar(rep_data, x='Category', y=['Indigenous', 'Non-Indigenous'],
                 title='Indigenous vs Non-Indigenous Youth: Population vs Detention',
                 color_discrete_map={'Indigenous': '#FF6B6B', 'Non-Indigenous': '#4ECDC4'})
    
    st.plotly_chart(fig, use_container_width=True)
    
    # Facility breakdown
    if disparities.get('facilities'):
        st.subheader("Indigenous Representation by Facility")
        
        facility_df = pd.DataFrame([
            {
                'Facility': facility,
                'Indigenous Percentage': data.get('indigenous_percentage', 0),
                'Total Youth': data.get('total_youth', 'N/A')
            }
            for facility, data in disparities['facilities'].items()
        ])
        
        if not facility_df.empty:
            fig2 = px.bar(facility_df, x='Facility', y='Indigenous Percentage',
                          title='Indigenous Youth Percentage by Detention Facility')
            st.plotly_chart(fig2, use_container_width=True)

elif page == "Alternative Scenarios":
    st.header("Alternative Budget Scenarios")
    
    st.markdown("""
    Explore how different budget allocations between detention and community programs 
    would affect the number of youth that can be served and outcomes achieved.
    """)
    
    # Get total budget
    split = analyzer.calculate_spending_split()
    total_budget = split['total_budget'] or 500_000_000
    
    # Budget slider
    budget_input = st.number_input(
        "Total Budget ($)", 
        min_value=100_000_000,
        max_value=1_000_000_000,
        value=int(total_budget),
        step=10_000_000,
        format="%d"
    )
    
    # Calculate scenarios
    scenarios = analyzer.calculate_alternative_scenarios(budget_input)
    
    # Create comparison chart
    scenario_df = pd.DataFrame(scenarios)
    
    fig = go.Figure()
    
    fig.add_trace(go.Bar(
        name='Youth Days - Detention',
        x=scenario_df['name'],
        y=scenario_df['youth_days_detention'],
        marker_color='#FF6B6B'
    ))
    
    fig.add_trace(go.Bar(
        name='Youth Days - Community',
        x=scenario_df['name'],
        y=scenario_df['youth_days_community'],
        marker_color='#4ECDC4'
    ))
    
    fig.update_layout(
        title='Youth Service Days by Budget Allocation Scenario',
        xaxis_title='Scenario',
        yaxis_title='Total Youth Days',
        barmode='stack',
        height=500
    )
    
    st.plotly_chart(fig, use_container_width=True)
    
    # Capacity increase chart
    capacity_df = scenario_df[scenario_df['capacity_increase_pct'].notna()]
    
    if not capacity_df.empty:
        fig2 = px.line(capacity_df, x='detention_percentage', y='capacity_increase_pct',
                       title='Service Capacity Increase by Reducing Detention Percentage',
                       markers=True)
        
        fig2.update_layout(
            xaxis_title='Detention Budget %',
            yaxis_title='Capacity Increase %',
            xaxis=dict(autorange='reversed')
        )
        
        st.plotly_chart(fig2, use_container_width=True)
    
    # Scenario details table
    st.subheader("Detailed Scenario Comparison")
    
    display_df = scenario_df[['name', 'detention_percentage', 'community_percentage', 
                             'total_youth_days', 'capacity_increase_pct']].copy()
    display_df.columns = ['Scenario', 'Detention %', 'Community %', 'Total Youth Days', 'Capacity Increase %']
    
    st.dataframe(display_df, use_container_width=True)

elif page == "Parliamentary Activity":
    st.header("Parliamentary Activity on Youth Justice")
    
    db = next(get_db())
    
    # Get recent documents
    recent_docs = db.query(ParliamentaryDocument).filter(
        ParliamentaryDocument.mentions_youth_justice == True
    ).order_by(ParliamentaryDocument.date.desc()).limit(50).all()
    
    db.close()
    
    if recent_docs:
        # Document type breakdown
        doc_types = {}
        for doc in recent_docs:
            doc_types[doc.document_type] = doc_types.get(doc.document_type, 0) + 1
        
        fig = px.pie(values=list(doc_types.values()), names=list(doc_types.keys()),
                     title='Parliamentary Documents by Type')
        
        st.plotly_chart(fig, use_container_width=True)
        
        # Recent documents table
        st.subheader("Recent Parliamentary Documents")
        
        doc_data = []
        for doc in recent_docs[:20]:
            doc_data.append({
                'Date': doc.date.strftime('%Y-%m-%d') if doc.date else 'Unknown',
                'Type': doc.document_type,
                'Title': doc.title[:100] + '...' if len(doc.title) > 100 else doc.title,
                'Mentions Spending': '✓' if doc.mentions_spending else '',
                'Mentions Indigenous': '✓' if doc.mentions_indigenous else ''
            })
        
        st.dataframe(pd.DataFrame(doc_data), use_container_width=True)
    else:
        st.info("No parliamentary documents found. Run the scrapers to populate data.")

elif page == "Hidden Costs":
    st.header("Hidden Costs Calculator")
    
    st.markdown("""
    Calculate the true cost of youth detention by including expenses borne by families 
    that don't appear in government budgets.
    """)
    
    # Calculator form
    col1, col2 = st.columns(2)
    
    with col1:
        family_location = st.selectbox(
            "Family Location",
            sorted(hidden_calc.queensland_towns.keys())
        )
        
        detention_center = st.selectbox(
            "Detention Center",
            list(hidden_calc.detention_centers.keys())
        )
        
        visits_per_month = st.slider(
            "Visits per Month",
            min_value=0,
            max_value=8,
            value=2
        )
    
    with col2:
        calls_per_week = st.slider(
            "Phone Calls per Week",
            min_value=0,
            max_value=14,
            value=3
        )
        
        work_days_missed = st.slider(
            "Work Days Missed per Month",
            min_value=0.0,
            max_value=10.0,
            value=2.0,
            step=0.5
        )
        
        private_lawyer = st.checkbox("Private Legal Representation", value=True)
    
    # Calculate costs
    if st.button("Calculate Hidden Costs"):
        calc_result = hidden_calc.calculate_total_family_burden(
            family_location=family_location,
            detention_center=detention_center,
            visits_per_month=visits_per_month,
            calls_per_week=calls_per_week,
            work_days_missed=work_days_missed,
            private_lawyer=private_lawyer
        )
        
        # Display results
        st.subheader("Cost Breakdown")
        
        # Summary metrics
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.metric(
                "Monthly Family Cost",
                f"${calc_result['total_monthly_cost']:,.0f}",
                f"{calc_result['family_cost_percentage']:.0f}% of official cost"
            )
        
        with col2:
            st.metric(
                "Annual Family Cost",
                f"${calc_result['total_annual_cost']:,.0f}"
            )
        
        with col3:
            st.metric(
                "Distance to Travel",
                f"{calc_result['breakdown']['travel']['distance_km']:.0f} km",
                "one way"
            )
        
        with col4:
            st.metric(
                "Equivalent Detention Days",
                f"{calc_result['family_days_equivalent']:.0f} days",
                "of family costs"
            )
        
        # Detailed breakdown
        st.subheader("Detailed Cost Breakdown")
        
        breakdown_data = []
        for category, details in calc_result['breakdown'].items():
            if isinstance(details, dict) and 'monthly_cost' in details:
                breakdown_data.append({
                    'Category': category.replace('_', ' ').title(),
                    'Monthly Cost': f"${details.get('monthly_cost', details.get('total_monthly', 0)):,.2f}",
                    'Annual Cost': f"${details.get('annual_cost', details.get('monthly_cost', 0) * 12):,.2f}"
                })
        
        if breakdown_data:
            st.table(pd.DataFrame(breakdown_data))
        
        # Comparison chart
        st.subheader("Cost Comparison")
        
        comparison_df = pd.DataFrame({
            'Cost Type': ['Official Detention Cost', 'Hidden Family Costs', 'True Total Cost'],
            'Monthly Amount': [
                calc_result['official_monthly_cost'],
                calc_result['total_monthly_cost'],
                calc_result['combined_monthly_cost']
            ]
        })
        
        fig = px.bar(comparison_df, x='Cost Type', y='Monthly Amount',
                     title='Official vs Hidden Costs per Month',
                     color='Cost Type',
                     color_discrete_map={
                         'Official Detention Cost': '#FF6B6B',
                         'Hidden Family Costs': '#FFA500',
                         'True Total Cost': '#8B0000'
                     })
        
        st.plotly_chart(fig, use_container_width=True)
        
        # Save calculation option
        if st.button("Save This Calculation"):
            hidden_calc.save_calculation(calc_result)
            st.success("Calculation saved to database!")
    
    # Comparative analysis
    st.subheader("Comparative Analysis Across Queensland")
    
    if st.button("Run Comparative Analysis"):
        with st.spinner("Analyzing costs from different locations..."):
            analysis = hidden_calc.get_comparative_analysis()
            
            if analysis and 'highest_burden_routes' in analysis:
                st.markdown("### Highest Family Cost Burden Routes")
                
                burden_df = pd.DataFrame(analysis['highest_burden_routes'])
                burden_df['Monthly Cost'] = burden_df['monthly_cost'].apply(lambda x: f"${x:,.0f}")
                burden_df['% of Official'] = burden_df['percentage_of_official'].apply(lambda x: f"{x:.0f}%")
                burden_df['Distance'] = burden_df['distance_km'].apply(lambda x: f"{x:.0f} km")
                
                st.dataframe(
                    burden_df[['from', 'to', 'Distance', 'Monthly Cost', '% of Official']].rename(
                        columns={'from': 'Family Location', 'to': 'Detention Center'}
                    ),
                    use_container_width=True
                )
                
                # Summary statistics
                col1, col2, col3 = st.columns(3)
                
                with col1:
                    st.metric(
                        "Average Monthly Family Cost",
                        f"${analysis['average_monthly_cost']:,.0f}"
                    )
                
                with col2:
                    st.metric(
                        "Average % of Official Cost",
                        f"{analysis['average_percentage_of_official']:.0f}%"
                    )
                
                with col3:
                    st.metric(
                        "Remote Community Average",
                        f"${analysis['remote_community_average']:,.0f}"
                    )
                
                # Visualization
                routes_df = pd.DataFrame(analysis['all_routes'])
                
                fig = px.scatter(routes_df, 
                               x='distance_km', 
                               y='monthly_cost',
                               size='percentage_of_official',
                               color='to',
                               hover_data=['from'],
                               title='Family Costs by Distance to Detention Center',
                               labels={
                                   'distance_km': 'Distance (km)',
                                   'monthly_cost': 'Monthly Family Cost ($)',
                                   'to': 'Detention Center',
                                   'from': 'Family Location'
                               })
                
                st.plotly_chart(fig, use_container_width=True)

elif page == "Interviews":
    st.header("Interview Management System")
    
    tab1, tab2, tab3 = st.tabs(["Conduct Interview", "View Responses", "Analysis"])
    
    with tab1:
        st.subheader("Conduct New Interview")
        
        # Interview setup
        col1, col2 = st.columns(2)
        
        with col1:
            stakeholder_type = st.selectbox(
                "Stakeholder Type",
                ["youth", "family", "worker", "provider"]
            )
            
            participant_code = st.text_input(
                "Participant Code",
                placeholder="e.g., FAM001",
                help="Anonymous identifier for participant"
            )
        
        with col2:
            interviewer = st.text_input("Interviewer Name")
            location = st.text_input("Interview Location")
        
        if stakeholder_type and participant_code:
            # Load questions
            template = interview_mgr.templates[stakeholder_type]
            st.markdown(f"### {template['name']}")
            st.markdown(f"*{template['description']}*")
            
            # Display questions
            responses = {}
            
            for question in template['questions']:
                st.markdown(f"**{question['id']}. {question['text']}**")
                
                if question['type'] == 'text':
                    response = st.text_area(
                        f"Response to {question['id']}",
                        key=f"q_{question['id']}",
                        label_visibility="collapsed"
                    )
                elif question['type'] == 'number':
                    response = st.number_input(
                        f"Response to {question['id']}",
                        key=f"q_{question['id']}",
                        label_visibility="collapsed",
                        step=1
                    )
                elif question['type'] == 'cost':
                    response = st.number_input(
                        f"Response to {question['id']} ($)",
                        key=f"q_{question['id']}",
                        label_visibility="collapsed",
                        format="%.2f"
                    )
                
                if response:
                    responses[question['id']] = response
                
                st.markdown("---")
            
            # Submit button
            if st.button("Submit Interview"):
                if responses:
                    interview_id = interview_mgr.conduct_interview(
                        stakeholder_type=stakeholder_type,
                        participant_code=participant_code,
                        responses=responses,
                        interviewer=interviewer,
                        location=location
                    )
                    
                    if interview_id:
                        st.success(f"Interview recorded successfully! ID: {interview_id}")
                        
                        # Show extracted themes
                        summary = interview_mgr.get_interview_summary(interview_id)
                        if summary['themes']:
                            st.subheader("Extracted Themes")
                            for theme in summary['themes']:
                                st.write(f"**{theme['name']}** (Score: {theme['score']})")
                                if theme['quote']:
                                    st.write(f"> {theme['quote']}")
                else:
                    st.warning("Please answer at least one question before submitting.")
    
    with tab2:
        st.subheader("Interview Responses")
        
        db = next(get_db())
        interviews = db.query(Interview).order_by(Interview.interview_date.desc()).limit(20).all()
        db.close()
        
        if interviews:
            # Create summary table
            interview_data = []
            for interview in interviews:
                interview_data.append({
                    'ID': interview.id,
                    'Date': interview.interview_date.strftime('%Y-%m-%d'),
                    'Type': interview.stakeholder_type,
                    'Participant': interview.participant_code,
                    'Location': interview.location or 'N/A',
                    'Responses': len(interview.responses),
                    'Themes': len(interview.themes)
                })
            
            st.dataframe(pd.DataFrame(interview_data), use_container_width=True)
            
            # View individual interview
            selected_id = st.selectbox(
                "Select Interview to View Details",
                [i['ID'] for i in interview_data],
                format_func=lambda x: f"Interview {x}"
            )
            
            if selected_id:
                summary = interview_mgr.get_interview_summary(selected_id)
                
                col1, col2 = st.columns(2)
                with col1:
                    st.metric("Total Responses", summary['response_count'])
                with col2:
                    st.metric("Costs Mentioned", f"${summary['total_costs']:,.0f}")
                
                if summary['themes']:
                    st.subheader("Themes Identified")
                    for theme in summary['themes']:
                        with st.expander(f"{theme['name']} (Score: {theme['score']})"):
                            if theme['quote']:
                                st.write(theme['quote'])
                
                if summary['costs_mentioned']:
                    st.subheader("Costs Mentioned")
                    for cost in summary['costs_mentioned']:
                        st.write(f"- {cost['question']}: ${cost['amount']:,.2f}")
        else:
            st.info("No interviews recorded yet.")
    
    with tab3:
        st.subheader("Interview Analysis")
        
        analysis = interview_mgr.analyze_all_interviews()
        
        if analysis['total_interviews'] > 0:
            # Summary metrics
            col1, col2, col3, col4 = st.columns(4)
            
            with col1:
                st.metric("Total Interviews", analysis['total_interviews'])
            
            with col2:
                st.metric("Hidden Costs Identified", 
                         f"${analysis['total_hidden_costs_identified']:,.0f}",
                         "average per family/month")
            
            with col3:
                st.metric("Interviews with Costs", analysis['interviews_mentioning_costs'])
            
            with col4:
                top_type = max(analysis['by_stakeholder'].items(), key=lambda x: x[1])[0] if analysis['by_stakeholder'] else 'N/A'
                st.metric("Most Interviewed", top_type.title())
            
            # Stakeholder breakdown
            if analysis['by_stakeholder']:
                st.subheader("Interviews by Stakeholder Type")
                
                stakeholder_df = pd.DataFrame(
                    list(analysis['by_stakeholder'].items()),
                    columns=['Type', 'Count']
                )
                
                fig = px.pie(stakeholder_df, values='Count', names='Type',
                           title='Distribution of Interview Participants')
                st.plotly_chart(fig, use_container_width=True)
            
            # Top themes
            if analysis['top_themes']:
                st.subheader("Most Common Themes")
                
                themes_df = pd.DataFrame(
                    analysis['top_themes'],
                    columns=['Theme', 'Mentions']
                )
                
                fig = px.bar(themes_df, x='Mentions', y='Theme',
                           orientation='h',
                           title='Frequency of Themes in Interviews')
                st.plotly_chart(fig, use_container_width=True)
            
            # Cost breakdown
            if analysis['cost_averages']:
                st.subheader("Average Hidden Costs by Category")
                
                cost_df = pd.DataFrame(
                    list(analysis['cost_averages'].items()),
                    columns=['Category', 'Average Cost']
                )
                
                fig = px.bar(cost_df, x='Category', y='Average Cost',
                           title='Average Hidden Costs Reported by Families')
                st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("No interviews to analyze yet. Conduct some interviews to see analysis.")

elif page == "RTI Templates":
    st.header("Right to Information (RTI) Request Templates")
    
    st.markdown("""
    Use these templates to request information about youth justice spending from Queensland government departments.
    """)
    
    templates = {
        "Detention Facility Costs": """
Dear RTI Officer,

I am writing to request information under the Right to Information Act 2009 regarding the operational costs of youth detention facilities in Queensland.

Specifically, I request:

1. Daily operational costs per youth for each detention facility for the past 3 financial years, broken down by:
   - Cleveland Youth Detention Centre
   - West Moreton Youth Detention Centre
   
2. Breakdown of costs including:
   - Staffing costs
   - Facility maintenance
   - Programs and services
   - Security
   - Healthcare
   - Education

3. Average length of stay per youth by facility

4. Occupancy rates by month for each facility

I am happy to receive this information in electronic format.

Yours sincerely,
[Your name]
        """,
        
        "Community Program Effectiveness": """
Dear RTI Officer,

I am writing to request information under the Right to Information Act 2009 regarding community-based youth justice programs in Queensland.

Specifically, I request:

1. List of all community-based youth justice programs currently funded, including:
   - Program name
   - Annual funding amount
   - Number of youth served annually
   - Success/completion rates

2. Comparative recidivism rates for:
   - Youth who completed detention sentences
   - Youth who completed community-based programs
   - Youth who participated in restorative justice programs

3. Cost per participant for each community program

4. Evaluation reports for community programs from the past 3 years

I am happy to receive this information in electronic format.

Yours sincerely,
[Your name]
        """,
        
        "Indigenous Youth Data": """
Dear RTI Officer,

I am writing to request information under the Right to Information Act 2009 regarding Indigenous youth in the Queensland youth justice system.

Specifically, I request:

1. Monthly statistics for the past 3 years showing:
   - Total number of youth in detention
   - Number and percentage of Indigenous youth in detention
   - Breakdown by detention facility

2. Average length of detention for:
   - Indigenous youth
   - Non-Indigenous youth

3. Access to culturally appropriate programs:
   - List of programs specifically for Indigenous youth
   - Participation rates
   - Funding amounts

4. Number of Indigenous youth in community-based programs vs detention

I acknowledge the sensitivity of this data and am happy to receive it in aggregated form that protects individual privacy.

Yours sincerely,
[Your name]
        """
    }
    
    for title, template in templates.items():
        with st.expander(title):
            st.text_area("Template", template, height=400, key=title)
            
            if st.button(f"Copy {title}", key=f"copy_{title}"):
                st.write("Template copied! (Note: Copy functionality requires JavaScript)")
    
    st.subheader("How to Submit an RTI Request")
    
    st.markdown("""
    1. **Choose the appropriate department:**
       - Department of Youth Justice, Employment, Small Business and Training
       - Queensland Police Service (for arrest data)
       - Department of Children, Youth Justice and Multicultural Affairs
    
    2. **Submit your request:**
       - Online: Through the department's RTI portal
       - Email: To the department's RTI email address
       - Post: To the department's RTI unit
    
    3. **Include:**
       - Your name and contact details
       - Clear description of the information sought
       - Preferred format (electronic/hard copy)
    
    4. **Fees:**
       - Application fee: $52.90 (may be waived in some circumstances)
       - Processing charges may apply for large requests
    
    5. **Timeframe:**
       - Departments have 25 business days to respond
       - May be extended by 10 business days in some circumstances
    """)

# Footer
st.markdown("---")
st.markdown("""
<small>Data sources: Queensland Budget Papers, Parliament of Queensland, Department of Youth Justice. 
This dashboard is for transparency and advocacy purposes.</small>
""", unsafe_allow_html=True)