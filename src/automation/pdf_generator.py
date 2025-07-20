import os
from datetime import datetime, timedelta
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.pdfgen import canvas
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.lineplots import LinePlot
from reportlab.graphics.widgets.markers import makeMarker
from typing import Dict, List
from loguru import logger

class PDFReportGenerator:
    """Generate PDF reports for youth justice spending analysis."""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
        
    def _setup_custom_styles(self):
        """Set up custom paragraph styles."""
        # Title style
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Title'],
            fontSize=24,
            textColor=colors.HexColor('#2c3e50'),
            spaceAfter=30
        ))
        
        # Heading styles
        self.styles.add(ParagraphStyle(
            name='CustomHeading',
            parent=self.styles['Heading1'],
            fontSize=16,
            textColor=colors.HexColor('#2c3e50'),
            spaceAfter=12
        ))
        
        # Alert style
        self.styles.add(ParagraphStyle(
            name='Alert',
            parent=self.styles['Normal'],
            fontSize=12,
            textColor=colors.HexColor('#e74c3c'),
            borderColor=colors.HexColor('#e74c3c'),
            borderWidth=1,
            borderPadding=10,
            spaceAfter=12
        ))
        
        # Success style
        self.styles.add(ParagraphStyle(
            name='Success',
            parent=self.styles['Normal'],
            fontSize=12,
            textColor=colors.HexColor('#27ae60'),
            spaceAfter=12
        ))
    
    def generate_spending_trends_report(self, report_data: Dict) -> str:
        """Generate weekly spending trends PDF report."""
        filename = f"youth_justice_report_{datetime.now().strftime('%Y%m%d')}.pdf"
        filepath = os.path.join('data', 'processed', filename)
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        # Create PDF document
        doc = SimpleDocTemplate(
            filepath,
            pagesize=A4,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=18
        )
        
        # Build content
        story = []
        
        # Title page
        story.append(Paragraph(
            "Queensland Youth Justice Spending Report",
            self.styles['CustomTitle']
        ))
        
        story.append(Paragraph(
            f"Week ending {report_data['report_date']}",
            self.styles['Normal']
        ))
        
        story.append(Spacer(1, 0.5*inch))
        
        # Executive summary
        story.append(Paragraph("Executive Summary", self.styles['CustomHeading']))
        
        summary_data = [
            ['Metric', 'Value', 'Status'],
            ['Total Budget', f"${report_data.get('total_budget', 500000000):,.0f}", 'Current'],
            ['Detention Spending', f"{report_data.get('detention_percentage', 90.6):.1f}%", 'High'],
            ['Community Programs', f"{report_data.get('community_percentage', 9.4):.1f}%", 'Low'],
            ['Cost Ratio', f"{report_data.get('detention_daily_cost', 857) / report_data.get('community_daily_cost', 41):.1f}x", 'Concern'],
            ['Indigenous Detention', f"{report_data.get('indigenous_percentage', 66)}%", 'Critical']
        ]
        
        summary_table = Table(summary_data, colWidths=[2.5*inch, 2*inch, 1.5*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c3e50')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(summary_table)
        story.append(Spacer(1, 0.5*inch))
        
        # Key findings
        story.append(Paragraph("Key Findings", self.styles['CustomHeading']))
        
        for highlight in report_data.get('highlights', []):
            story.append(Paragraph(f"• {highlight}", self.styles['Normal']))
        
        story.append(PageBreak())
        
        # Spending breakdown chart
        story.append(Paragraph("Spending Allocation", self.styles['CustomHeading']))
        
        # Create pie chart
        drawing = Drawing(400, 200)
        pie = Pie()
        pie.x = 100
        pie.y = 20
        pie.width = 200
        pie.height = 160
        pie.data = [
            report_data.get('detention_percentage', 90.6),
            report_data.get('community_percentage', 9.4)
        ]
        pie.labels = ['Detention (90.6%)', 'Community (9.4%)']
        pie.slices[0].fillColor = colors.HexColor('#e74c3c')
        pie.slices[1].fillColor = colors.HexColor('#27ae60')
        
        drawing.add(pie)
        story.append(drawing)
        
        # Hidden costs section
        story.append(Paragraph("Hidden Family Costs", self.styles['CustomHeading']))
        
        hidden_costs_data = [
            ['Location', 'Distance (km)', 'Monthly Cost', '% of Official'],
            ['Aurukun to Cleveland', '1,700', '$3,200', '37%'],
            ['Palm Island to Cleveland', '600', '$2,100', '24%'],
            ['Mount Isa to Cleveland', '1,400', '$2,800', '32%'],
            ['Brisbane to Wacol', '50', '$850', '10%']
        ]
        
        hidden_table = Table(hidden_costs_data, colWidths=[2*inch, 1.5*inch, 1.5*inch, 1.5*inch])
        hidden_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f39c12')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(hidden_table)
        story.append(Spacer(1, 0.3*inch))
        
        # Alerts
        if report_data.get('alerts'):
            story.append(Paragraph("Alerts", self.styles['CustomHeading']))
            for alert in report_data['alerts']:
                story.append(Paragraph(alert, self.styles['Alert']))
        
        # Recommendations
        story.append(Paragraph("Recommendations", self.styles['CustomHeading']))
        
        for i, rec in enumerate(report_data.get('recommendations', []), 1):
            story.append(Paragraph(f"{i}. {rec}", self.styles['Normal']))
        
        # Footer
        story.append(Spacer(1, 0.5*inch))
        story.append(Paragraph(
            "This report is automatically generated from publicly available data.",
            self.styles['Normal']
        ))
        
        # Build PDF
        doc.build(story)
        
        logger.info(f"PDF report generated: {filepath}")
        return filepath
    
    def generate_comparison_report(self, data: Dict) -> str:
        """Generate detention vs community comparison report."""
        filename = f"comparison_report_{datetime.now().strftime('%Y%m%d')}.pdf"
        filepath = os.path.join('data', 'processed', filename)
        
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        doc = SimpleDocTemplate(filepath, pagesize=A4)
        story = []
        
        # Title
        story.append(Paragraph(
            "Detention vs Community Programs: Cost Analysis",
            self.styles['CustomTitle']
        ))
        
        story.append(Spacer(1, 0.5*inch))
        
        # Cost comparison table
        story.append(Paragraph("Cost Comparison", self.styles['CustomHeading']))
        
        comparison_data = [
            ['Program Type', 'Daily Cost', 'Annual Cost per Youth', 'Success Rate'],
            ['Youth Detention', '$857', '$312,805', '30%'],
            ['Community Supervision', '$41', '$14,965', '55%'],
            ['Restorative Justice', '$25', '$9,125', '65%'],
            ['Early Intervention', '$15', '$5,475', '75%']
        ]
        
        comparison_table = Table(comparison_data)
        comparison_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c3e50')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(comparison_table)
        
        # Build PDF
        doc.build(story)
        
        logger.info(f"Comparison report generated: {filepath}")
        return filepath
    
    def generate_rti_request_pdf(self, request_data: Dict) -> str:
        """Generate RTI request as PDF."""
        filename = f"rti_request_{request_data['department'].replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.pdf"
        filepath = os.path.join('data', 'processed', 'rti_requests', filename)
        
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        doc = SimpleDocTemplate(filepath, pagesize=letter)
        story = []
        
        # Header
        story.append(Paragraph("RIGHT TO INFORMATION REQUEST", self.styles['Title']))
        story.append(Paragraph(f"Date: {datetime.now().strftime('%d %B %Y')}", self.styles['Normal']))
        story.append(Spacer(1, 0.5*inch))
        
        # Recipient
        story.append(Paragraph("To:", self.styles['Heading2']))
        story.append(Paragraph("RTI Officer", self.styles['Normal']))
        story.append(Paragraph(request_data['department'], self.styles['Normal']))
        story.append(Spacer(1, 0.3*inch))
        
        # Subject
        story.append(Paragraph(f"Subject: {request_data['subject']}", self.styles['Heading2']))
        story.append(Spacer(1, 0.3*inch))
        
        # Body
        story.append(Paragraph("Dear RTI Officer,", self.styles['Normal']))
        story.append(Spacer(1, 0.2*inch))
        
        for paragraph in request_data['body'].split('\n\n'):
            story.append(Paragraph(paragraph, self.styles['Normal']))
            story.append(Spacer(1, 0.2*inch))
        
        # Footer
        story.append(Paragraph("Yours sincerely,", self.styles['Normal']))
        story.append(Spacer(1, 0.5*inch))
        story.append(Paragraph("[Your name]", self.styles['Normal']))
        
        # Build PDF
        doc.build(story)
        
        logger.info(f"RTI request PDF generated: {filepath}")
        return filepath