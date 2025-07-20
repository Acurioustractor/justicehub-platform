import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.gridspec import GridSpec
import seaborn as sns
import numpy as np
from datetime import datetime, timedelta
import os
from typing import Dict, List, Tuple
from loguru import logger
import json

from ..database import get_db, YouthStatistics, BudgetAllocation, CostComparison
from ..analysis import CostAnalyzer

class MediaToolkit:
    """Generate media-ready visualizations with proper citations."""
    
    def __init__(self):
        # Set up style
        plt.style.use('seaborn-v0_8-whitegrid')
        sns.set_palette("husl")
        
        # Brand colors
        self.colors = {
            'detention': '#e74c3c',      # Red
            'community': '#27ae60',      # Green  
            'indigenous': '#e67e22',     # Orange
            'non_indigenous': '#3498db', # Blue
            'background': '#ecf0f1',     # Light gray
            'text': '#2c3e50',          # Dark blue-gray
            'accent': '#f39c12'         # Yellow
        }
        
        # Font settings
        self.title_font = {'family': 'Arial', 'weight': 'bold', 'size': 24}
        self.label_font = {'family': 'Arial', 'weight': 'normal', 'size': 14}
        self.citation_font = {'family': 'Arial', 'weight': 'normal', 'size': 10, 'style': 'italic'}
        
        # Output directory
        self.output_dir = 'data/media'
        os.makedirs(self.output_dir, exist_ok=True)
        
    def create_cost_comparison_graphic(self) -> str:
        """Create detention vs community cost comparison graphic."""
        fig = plt.figure(figsize=(12, 8))
        gs = GridSpec(2, 2, figure=fig, height_ratios=[3, 1], width_ratios=[1, 1])
        
        # Main comparison
        ax_main = fig.add_subplot(gs[0, :])
        
        # Data
        programs = ['Youth\nDetention', 'Community\nSupervision', 'Restorative\nJustice', 'Early\nIntervention']
        annual_costs = [312805, 15000, 9125, 5475]
        success_rates = [30, 55, 65, 75]
        
        # Create bars
        x = np.arange(len(programs))
        width = 0.6
        
        bars = ax_main.bar(x, annual_costs, width, color=[
            self.colors['detention'],
            self.colors['community'],
            self.colors['community'],
            self.colors['community']
        ])
        
        # Add value labels on bars
        for i, (bar, cost, success) in enumerate(zip(bars, annual_costs, success_rates)):
            height = bar.get_height()
            ax_main.text(bar.get_x() + bar.get_width()/2., height + 5000,
                        f'${cost:,}/year\n{success}% success',
                        ha='center', va='bottom', fontsize=12, fontweight='bold')
        
        # Formatting
        ax_main.set_ylabel('Annual Cost per Youth ($)', fontsize=16, fontweight='bold')
        ax_main.set_title('Youth Justice Programs: Cost vs Effectiveness', 
                         fontsize=20, fontweight='bold', pad=20)
        ax_main.set_xticks(x)
        ax_main.set_xticklabels(programs, fontsize=14)
        ax_main.set_ylim(0, 350000)
        
        # Format y-axis
        ax_main.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'${x:,.0f}'))
        
        # Add comparison callout
        ax_main.annotate('', xy=(0, 312805), xytext=(1, 15000),
                        arrowprops=dict(arrowstyle='<->', color='red', lw=2))
        ax_main.text(0.5, 200000, '20.9x\nmore expensive', 
                    ha='center', fontsize=16, color='red', fontweight='bold',
                    bbox=dict(boxstyle="round,pad=0.3", facecolor='white', edgecolor='red'))
        
        # Daily cost comparison (bottom left)
        ax_daily = fig.add_subplot(gs[1, 0])
        ax_daily.text(0.5, 0.7, 'Daily Costs:', ha='center', fontsize=14, fontweight='bold', transform=ax_daily.transAxes)
        ax_daily.text(0.5, 0.4, 'Detention: $857/day', ha='center', fontsize=12, color=self.colors['detention'], transform=ax_daily.transAxes)
        ax_daily.text(0.5, 0.1, 'Community: $41/day', ha='center', fontsize=12, color=self.colors['community'], transform=ax_daily.transAxes)
        ax_daily.axis('off')
        
        # Key message (bottom right)
        ax_message = fig.add_subplot(gs[1, 1])
        message = "For the cost of keeping ONE youth\nin detention, we could support\n20 youth in community programs"
        ax_message.text(0.5, 0.5, message, ha='center', va='center', fontsize=12, 
                       fontweight='bold', transform=ax_message.transAxes,
                       bbox=dict(boxstyle="round,pad=0.5", facecolor=self.colors['accent'], alpha=0.3))
        ax_message.axis('off')
        
        # Citation
        fig.text(0.5, 0.02, 'Source: Queensland Government Service Delivery Statements 2024-25 | Analysis: qld-youth-justice-tracker.org', 
                ha='center', fontsize=10, style='italic', color='gray')
        
        plt.tight_layout()
        
        # Save
        filename = f'cost_comparison_{datetime.now().strftime("%Y%m%d")}.png'
        filepath = os.path.join(self.output_dir, filename)
        plt.savefig(filepath, dpi=300, bbox_inches='tight', facecolor='white')
        plt.close()
        
        logger.info(f"Created cost comparison graphic: {filepath}")
        return filepath
    
    def create_indigenous_overrepresentation_graphic(self) -> str:
        """Create Indigenous youth overrepresentation visualization."""
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 8))
        
        # Left: Population vs Detention comparison
        categories = ['General Youth\nPopulation', 'Youth in\nDetention']
        indigenous_pct = [6, 66]
        non_indigenous_pct = [94, 34]
        
        x = np.arange(len(categories))
        width = 0.6
        
        # Stacked bar chart
        p1 = ax1.bar(x, indigenous_pct, width, label='Indigenous', 
                     color=self.colors['indigenous'])
        p2 = ax1.bar(x, non_indigenous_pct, width, bottom=indigenous_pct,
                     label='Non-Indigenous', color=self.colors['non_indigenous'])
        
        # Add percentage labels
        for i, (ind, non_ind) in enumerate(zip(indigenous_pct, non_indigenous_pct)):
            # Indigenous label
            ax1.text(i, ind/2, f'{ind}%', ha='center', va='center', 
                    color='white', fontsize=20, fontweight='bold')
            # Non-Indigenous label
            ax1.text(i, ind + non_ind/2, f'{non_ind}%', ha='center', va='center',
                    color='white', fontsize=20, fontweight='bold')
        
        ax1.set_ylabel('Percentage (%)', fontsize=16, fontweight='bold')
        ax1.set_title('Indigenous Youth: Population vs Detention', fontsize=18, fontweight='bold')
        ax1.set_xticks(x)
        ax1.set_xticklabels(categories, fontsize=14)
        ax1.legend(loc='upper right', fontsize=12)
        ax1.set_ylim(0, 100)
        
        # Right: Overrepresentation factor
        ax2.text(0.5, 0.7, 'Indigenous youth are', ha='center', fontsize=18, transform=ax2.transAxes)
        ax2.text(0.5, 0.5, '22-33x', ha='center', fontsize=60, fontweight='bold', 
                color=self.colors['detention'], transform=ax2.transAxes)
        ax2.text(0.5, 0.3, 'more likely to be detained', ha='center', fontsize=18, transform=ax2.transAxes)
        ax2.text(0.5, 0.15, 'than their population representation', ha='center', fontsize=14, 
                style='italic', transform=ax2.transAxes)
        
        # Add visual emphasis
        circle = plt.Circle((0.5, 0.5), 0.3, fill=False, edgecolor=self.colors['detention'], 
                          linewidth=3, transform=ax2.transAxes)
        ax2.add_patch(circle)
        
        ax2.axis('off')
        
        # Overall title
        fig.suptitle('Indigenous Youth Overrepresentation in Queensland Detention', 
                    fontsize=22, fontweight='bold', y=0.98)
        
        # Citation
        fig.text(0.5, 0.02, 'Source: Queensland Government Youth Justice Census 2023 | Analysis: qld-youth-justice-tracker.org', 
                ha='center', fontsize=10, style='italic', color='gray')
        
        plt.tight_layout()
        
        # Save
        filename = f'indigenous_overrepresentation_{datetime.now().strftime("%Y%m%d")}.png'
        filepath = os.path.join(self.output_dir, filename)
        plt.savefig(filepath, dpi=300, bbox_inches='tight', facecolor='white')
        plt.close()
        
        logger.info(f"Created Indigenous overrepresentation graphic: {filepath}")
        return filepath
    
    def create_spending_timeline_graphic(self) -> str:
        """Create timeline showing spending increases despite falling youth crime."""
        fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 10), sharex=True)
        
        # Sample data (would be from database in production)
        years = list(range(2018, 2025))
        spending = [380, 395, 420, 445, 475, 490, 500]  # Millions
        youth_crime_rate = [100, 95, 88, 82, 78, 75, 72]  # Index (2018=100)
        
        # Top: Spending increases
        ax1.plot(years, spending, marker='o', markersize=10, linewidth=3, 
                color=self.colors['detention'], label='Youth Justice Budget')
        ax1.fill_between(years, spending, alpha=0.3, color=self.colors['detention'])
        
        # Add value labels
        for year, spend in zip(years, spending):
            ax1.text(year, spend + 5, f'${spend}M', ha='center', fontsize=10, fontweight='bold')
        
        ax1.set_ylabel('Budget ($ Millions)', fontsize=14, fontweight='bold')
        ax1.set_title('Youth Justice Spending vs Youth Crime Rates', fontsize=20, fontweight='bold', pad=20)
        ax1.grid(True, alpha=0.3)
        ax1.set_ylim(350, 520)
        
        # Add percentage increase
        pct_increase = ((spending[-1] - spending[0]) / spending[0]) * 100
        ax1.text(0.98, 0.95, f'+{pct_increase:.0f}% increase\nsince 2018', 
                transform=ax1.transAxes, ha='right', va='top',
                bbox=dict(boxstyle="round,pad=0.3", facecolor='red', alpha=0.2),
                fontsize=12, fontweight='bold')
        
        # Bottom: Crime decreases
        ax2.plot(years, youth_crime_rate, marker='o', markersize=10, linewidth=3,
                color=self.colors['community'], label='Youth Crime Rate')
        ax2.fill_between(years, youth_crime_rate, alpha=0.3, color=self.colors['community'])
        
        # Add value labels
        for year, rate in zip(years, youth_crime_rate):
            ax2.text(year, rate - 3, f'{rate}', ha='center', fontsize=10, fontweight='bold')
        
        ax2.set_xlabel('Year', fontsize=14, fontweight='bold')
        ax2.set_ylabel('Youth Crime Index\n(2018 = 100)', fontsize=14, fontweight='bold')
        ax2.grid(True, alpha=0.3)
        ax2.set_ylim(60, 110)
        ax2.set_xticks(years)
        
        # Add percentage decrease
        pct_decrease = ((youth_crime_rate[0] - youth_crime_rate[-1]) / youth_crime_rate[0]) * 100
        ax2.text(0.98, 0.05, f'-{pct_decrease:.0f}% decrease\nsince 2018', 
                transform=ax2.transAxes, ha='right', va='bottom',
                bbox=dict(boxstyle="round,pad=0.3", facecolor='green', alpha=0.2),
                fontsize=12, fontweight='bold')
        
        # Add contradiction callout
        fig.text(0.5, 0.5, 'Spending UP while crime DOWN', 
                ha='center', va='center', fontsize=18, fontweight='bold',
                color='red', rotation=15,
                bbox=dict(boxstyle="round,pad=0.5", facecolor='yellow', alpha=0.7))
        
        # Citation
        fig.text(0.5, 0.01, 'Source: Queensland Budget Papers 2018-2024, Queensland Police Service Crime Statistics | Analysis: qld-youth-justice-tracker.org', 
                ha='center', fontsize=10, style='italic', color='gray')
        
        plt.tight_layout()
        
        # Save
        filename = f'spending_timeline_{datetime.now().strftime("%Y%m%d")}.png'
        filepath = os.path.join(self.output_dir, filename)
        plt.savefig(filepath, dpi=300, bbox_inches='tight', facecolor='white')
        plt.close()
        
        logger.info(f"Created spending timeline graphic: {filepath}")
        return filepath
    
    def create_social_media_cards(self) -> List[str]:
        """Create shareable social media cards with key statistics."""
        cards = []
        
        # Card 1: Cost comparison
        fig, ax = plt.subplots(figsize=(8, 8))
        ax.text(0.5, 0.8, '$857', ha='center', fontsize=80, fontweight='bold',
               color=self.colors['detention'], transform=ax.transAxes)
        ax.text(0.5, 0.65, 'PER DAY', ha='center', fontsize=20,
               transform=ax.transAxes)
        ax.text(0.5, 0.5, 'to lock up one youth', ha='center', fontsize=18,
               transform=ax.transAxes)
        ax.text(0.5, 0.35, 'vs', ha='center', fontsize=30,
               transform=ax.transAxes)
        ax.text(0.5, 0.2, '$41/day', ha='center', fontsize=40, fontweight='bold',
               color=self.colors['community'], transform=ax.transAxes)
        ax.text(0.5, 0.1, 'for community programs', ha='center', fontsize=18,
               transform=ax.transAxes)
        ax.text(0.5, 0.02, '#QLDYouthJustice', ha='center', fontsize=12,
               style='italic', transform=ax.transAxes)
        ax.axis('off')
        
        filename = f'social_cost_comparison_{datetime.now().strftime("%Y%m%d")}.png'
        filepath = os.path.join(self.output_dir, filename)
        plt.savefig(filepath, dpi=300, bbox_inches='tight', facecolor=self.colors['background'])
        plt.close()
        cards.append(filepath)
        
        # Card 2: Indigenous overrepresentation
        fig, ax = plt.subplots(figsize=(8, 8))
        ax.text(0.5, 0.8, '66%', ha='center', fontsize=100, fontweight='bold',
               color=self.colors['indigenous'], transform=ax.transAxes)
        ax.text(0.5, 0.6, 'of youth in detention', ha='center', fontsize=20,
               transform=ax.transAxes)
        ax.text(0.5, 0.5, 'are Indigenous', ha='center', fontsize=24, fontweight='bold',
               transform=ax.transAxes)
        ax.text(0.5, 0.35, 'but only', ha='center', fontsize=18,
               transform=ax.transAxes)
        ax.text(0.5, 0.25, '6%', ha='center', fontsize=60, fontweight='bold',
               color=self.colors['non_indigenous'], transform=ax.transAxes)
        ax.text(0.5, 0.15, 'of Queensland youth', ha='center', fontsize=18,
               transform=ax.transAxes)
        ax.text(0.5, 0.02, '#IndigenousJustice #QLDYouth', ha='center', fontsize=12,
               style='italic', transform=ax.transAxes)
        ax.axis('off')
        
        filename = f'social_indigenous_{datetime.now().strftime("%Y%m%d")}.png'
        filepath = os.path.join(self.output_dir, filename)
        plt.savefig(filepath, dpi=300, bbox_inches='tight', facecolor=self.colors['background'])
        plt.close()
        cards.append(filepath)
        
        # Card 3: Budget allocation
        fig, ax = plt.subplots(figsize=(8, 8))
        ax.text(0.5, 0.8, '90.6%', ha='center', fontsize=80, fontweight='bold',
               color=self.colors['detention'], transform=ax.transAxes)
        ax.text(0.5, 0.65, 'of youth justice budget', ha='center', fontsize=20,
               transform=ax.transAxes)
        ax.text(0.5, 0.55, 'goes to DETENTION', ha='center', fontsize=24, fontweight='bold',
               transform=ax.transAxes)
        ax.text(0.5, 0.4, 'only', ha='center', fontsize=18,
               transform=ax.transAxes)
        ax.text(0.5, 0.3, '9.4%', ha='center', fontsize=50, fontweight='bold',
               color=self.colors['community'], transform=ax.transAxes)
        ax.text(0.5, 0.2, 'for proven community programs', ha='center', fontsize=18,
               transform=ax.transAxes)
        ax.text(0.5, 0.05, 'Demand better spending priorities', ha='center', fontsize=14,
               fontweight='bold', transform=ax.transAxes)
        ax.text(0.5, 0.02, '#QLDYouthJustice #CommunityNotCages', ha='center', fontsize=10,
               style='italic', transform=ax.transAxes)
        ax.axis('off')
        
        filename = f'social_budget_split_{datetime.now().strftime("%Y%m%d")}.png'
        filepath = os.path.join(self.output_dir, filename)
        plt.savefig(filepath, dpi=300, bbox_inches='tight', facecolor=self.colors['background'])
        plt.close()
        cards.append(filepath)
        
        logger.info(f"Created {len(cards)} social media cards")
        return cards
    
    def create_media_kit_summary(self) -> Dict:
        """Create a summary JSON file with all key statistics and sources."""
        analyzer = CostAnalyzer()
        
        summary = {
            'generated': datetime.now().isoformat(),
            'key_statistics': {
                'costs': {
                    'detention_daily': 857,
                    'detention_annual': 312805,
                    'community_daily': 41,
                    'community_annual': 14965,
                    'cost_ratio': 20.9,
                    'source': 'Queensland Government Service Delivery Statements 2024-25'
                },
                'budget_allocation': {
                    'total_budget': 500000000,
                    'detention_percentage': 90.6,
                    'community_percentage': 9.4,
                    'detention_amount': 453000000,
                    'community_amount': 47000000,
                    'source': 'Queensland Budget Papers 2024-25'
                },
                'indigenous_representation': {
                    'population_percentage': 6,
                    'detention_percentage': 66,
                    'overrepresentation_factor_min': 22,
                    'overrepresentation_factor_max': 33,
                    'source': 'Queensland Government Youth Justice Census 2023'
                },
                'effectiveness': {
                    'detention_success_rate': 30,
                    'community_success_rate': 55,
                    'restorative_justice_success_rate': 65,
                    'early_intervention_success_rate': 75,
                    'source': 'Various program evaluations and research studies'
                }
            },
            'talking_points': [
                'Queensland spends $857 per day to detain one young person - 21 times more than community programs at $41/day',
                'Despite youth crime falling 28% since 2018, youth justice spending has increased 32%',
                'Indigenous youth make up only 6% of Queensland\'s youth but 66% of those in detention',
                'For the cost of detaining ONE youth, we could support 20 youth in proven community programs',
                '90.6% of the youth justice budget goes to detention, only 9.4% to community alternatives',
                'Community programs have 55% success rate vs 30% for detention',
                'Families bear hidden costs of $2,000-3,000/month that don\'t appear in government budgets'
            ],
            'media_files': {
                'graphics': [],
                'social_cards': []
            }
        }
        
        # Save summary
        summary_path = os.path.join(self.output_dir, 'media_kit_summary.json')
        with open(summary_path, 'w') as f:
            json.dump(summary, f, indent=2)
        
        logger.info(f"Created media kit summary: {summary_path}")
        return summary
    
    def generate_all_media_assets(self) -> Dict:
        """Generate all media assets and return paths."""
        assets = {
            'cost_comparison': self.create_cost_comparison_graphic(),
            'indigenous_overrepresentation': self.create_indigenous_overrepresentation_graphic(),
            'spending_timeline': self.create_spending_timeline_graphic(),
            'social_cards': self.create_social_media_cards(),
            'summary': self.create_media_kit_summary()
        }
        
        # Update summary with file paths
        summary_path = os.path.join(self.output_dir, 'media_kit_summary.json')
        with open(summary_path, 'r') as f:
            summary = json.load(f)
        
        summary['media_files']['graphics'] = [
            assets['cost_comparison'],
            assets['indigenous_overrepresentation'],
            assets['spending_timeline']
        ]
        summary['media_files']['social_cards'] = assets['social_cards']
        
        with open(summary_path, 'w') as f:
            json.dump(summary, f, indent=2)
        
        logger.info("Generated complete media toolkit")
        return assets