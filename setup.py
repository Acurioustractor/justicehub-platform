from setuptools import setup, find_packages

setup(
    name="qld-youth-justice-tracker",
    version="1.0.0",
    description="Queensland Youth Justice Spending Transparency System",
    author="Your Name",
    packages=find_packages(),
    install_requires=[
        "beautifulsoup4>=4.12.3",
        "requests>=2.31.0",
        "selenium>=4.18.1",
        "lxml>=5.1.0",
        "sqlalchemy>=2.0.25",
        "pandas>=2.1.4",
        "numpy>=1.26.3",
        "streamlit>=1.31.0",
        "plotly>=5.19.0",
        "altair>=5.2.0",
        "schedule>=1.2.0",
        "python-crontab>=3.0.0",
        "python-dotenv>=1.0.0",
        "pyyaml>=6.0.1",
        "loguru>=0.7.2",
        "pytest>=8.0.0",
        "black>=24.1.1",
        "jinja2>=3.1.3"
    ],
    python_requires=">=3.8",
    scripts=[
        "scrape_data.py",
        "generate_report.py",
        "run_dashboard.py",
        "scheduler.py"
    ],
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
)