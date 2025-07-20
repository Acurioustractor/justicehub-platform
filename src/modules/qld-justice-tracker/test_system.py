#!/usr/bin/env python3
"""
System Test Script for Queensland Youth Justice Tracker
Tests database connection, scraper functionality, and Flask server
"""

import os
import sys
import time
import socket
import subprocess
import traceback
from datetime import datetime

# Add project root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def print_section(title):
    """Print a formatted section header"""
    print(f"\n{'='*60}")
    print(f" {title}")
    print(f"{'='*60}\n")

def test_python_environment():
    """Test Python environment and dependencies"""
    print_section("Python Environment Test")
    
    print(f"Python Version: {sys.version}")
    print(f"Python Executable: {sys.executable}")
    print(f"Current Directory: {os.getcwd()}")
    print(f"Script Directory: {os.path.dirname(os.path.abspath(__file__))}")
    
    # Test imports
    required_modules = [
        'flask', 'sqlalchemy', 'requests', 'bs4', 
        'pandas', 'matplotlib', 'seaborn', 'dotenv'
    ]
    
    print("\nChecking required modules:")
    missing_modules = []
    
    for module in required_modules:
        try:
            __import__(module.replace('-', '_'))
            print(f"✓ {module} - OK")
        except ImportError as e:
            print(f"✗ {module} - MISSING ({e})")
            missing_modules.append(module)
    
    if missing_modules:
        print(f"\nWARNING: Missing modules: {', '.join(missing_modules)}")
        print("Install with: pip install " + " ".join(missing_modules))
    
    return len(missing_modules) == 0

def test_database_connection():
    """Test database connection with detailed error reporting"""
    print_section("Database Connection Test")
    
    try:
        from sqlalchemy import create_engine, text
        from sqlalchemy.exc import SQLAlchemyError
        
        # Check for database file
        db_path = os.path.join(os.path.dirname(__file__), 'youth_justice.db')
        db_exists = os.path.exists(db_path)
        
        print(f"Database Path: {db_path}")
        print(f"Database Exists: {'Yes' if db_exists else 'No'}")
        
        if db_exists:
            print(f"Database Size: {os.path.getsize(db_path):,} bytes")
            print(f"Database Permissions: {oct(os.stat(db_path).st_mode)[-3:]}")
        
        # Create engine and test connection
        engine = create_engine(f'sqlite:///{db_path}', echo=False)
        
        with engine.connect() as conn:
            # Test basic query
            result = conn.execute(text("SELECT sqlite_version()"))
            version = result.scalar()
            print(f"\nSQLite Version: {version}")
            
            # Check tables
            result = conn.execute(text(
                "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
            ))
            tables = [row[0] for row in result]
            
            print(f"\nDatabase Tables Found: {len(tables)}")
            for table in tables:
                result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                count = result.scalar()
                print(f"  - {table}: {count} records")
        
        print("\n✓ Database connection successful!")
        return True
        
    except SQLAlchemyError as e:
        print(f"\n✗ SQLAlchemy Error: {type(e).__name__}")
        print(f"   Details: {str(e)}")
        traceback.print_exc()
        return False
    except Exception as e:
        print(f"\n✗ Unexpected Error: {type(e).__name__}")
        print(f"   Details: {str(e)}")
        traceback.print_exc()
        return False

def test_scraper():
    """Test one scraper with comprehensive error handling"""
    print_section("Scraper Test")
    
    try:
        # Import scraper modules
        from src.scrapers.youth_detention_scraper import YouthDetentionScraper
        
        print("Testing Youth Detention Scraper...")
        scraper = YouthDetentionScraper()
        
        # Test scraping
        print("\nFetching data from web...")
        start_time = time.time()
        
        try:
            scraper.scrape()
            elapsed = time.time() - start_time
            print(f"✓ Scraping completed in {elapsed:.2f} seconds")
            
            # Check if data was saved
            from sqlalchemy import create_engine, text
            db_path = os.path.join(os.path.dirname(__file__), 'youth_justice.db')
            engine = create_engine(f'sqlite:///{db_path}')
            
            with engine.connect() as conn:
                result = conn.execute(text(
                    "SELECT COUNT(*) FROM youth_detention_stats ORDER BY date DESC LIMIT 1"
                ))
                count = result.scalar()
                print(f"✓ Records in database: {count}")
                
        except Exception as e:
            print(f"\n✗ Scraping failed: {type(e).__name__}")
            print(f"   Details: {str(e)}")
            traceback.print_exc()
            return False
            
        return True
        
    except ImportError as e:
        print(f"\n✗ Import Error: {str(e)}")
        print("   Make sure all scraper modules are present")
        return False
    except Exception as e:
        print(f"\n✗ Unexpected Error: {type(e).__name__}")
        print(f"   Details: {str(e)}")
        traceback.print_exc()
        return False

def find_available_port(start_port=5000, max_attempts=10):
    """Find an available port starting from start_port"""
    for port in range(start_port, start_port + max_attempts):
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        try:
            sock.bind(('', port))
            sock.close()
            return port
        except OSError:
            continue
    return None

def test_flask_server():
    """Test Flask server with comprehensive diagnostics"""
    print_section("Flask Server Test")
    
    try:
        # Check network interfaces
        print("Network Interfaces:")
        hostname = socket.gethostname()
        print(f"  Hostname: {hostname}")
        
        try:
            local_ip = socket.gethostbyname(hostname)
            print(f"  Local IP: {local_ip}")
        except:
            print("  Local IP: Unable to determine")
        
        # Test localhost resolution
        try:
            localhost_ip = socket.gethostbyname('localhost')
            print(f"  Localhost resolves to: {localhost_ip}")
        except:
            print("  WARNING: Cannot resolve localhost!")
        
        # Find available port
        port = find_available_port(5000)
        if not port:
            print("\n✗ No available ports found between 5000-5009")
            return False
        
        print(f"\nUsing port: {port}")
        
        # Import Flask app
        try:
            from src.flask_dashboard.app import app
            print("✓ Flask app imported successfully")
        except ImportError as e:
            print(f"✗ Cannot import Flask app: {e}")
            return False
        
        # Test if we can bind to the port
        test_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        test_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        
        try:
            test_socket.bind(('0.0.0.0', port))
            test_socket.close()
            print(f"✓ Can bind to 0.0.0.0:{port}")
        except Exception as e:
            print(f"✗ Cannot bind to port {port}: {e}")
            return False
        
        # Configure Flask app
        app.config['DEBUG'] = True
        app.config['TESTING'] = True
        
        print("\nStarting Flask server...")
        print(f"Server will be accessible at:")
        print(f"  - http://localhost:{port}")
        print(f"  - http://127.0.0.1:{port}")
        print(f"  - http://0.0.0.0:{port}")
        
        # Start server in a subprocess to test it
        print("\nTesting server startup (5 second test)...")
        
        # Create a test script to run the server
        test_script = f"""
import sys
sys.path.insert(0, '{os.path.dirname(os.path.abspath(__file__))}')
from app import app
app.run(host='0.0.0.0', port={port}, debug=True, use_reloader=False)
"""
        
        # Start server process
        process = subprocess.Popen(
            [sys.executable, '-c', test_script],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Wait for server to start
        time.sleep(2)
        
        # Test if server is running
        import requests
        test_urls = [
            f"http://localhost:{port}",
            f"http://127.0.0.1:{port}",
            f"http://0.0.0.0:{port}"
        ]
        
        server_accessible = False
        for url in test_urls:
            try:
                response = requests.get(url, timeout=2)
                if response.status_code == 200:
                    print(f"✓ Server accessible at {url}")
                    server_accessible = True
                    break
            except requests.exceptions.RequestException as e:
                print(f"✗ Cannot access {url}: {type(e).__name__}")
        
        # Stop test server
        process.terminate()
        time.sleep(1)
        
        if server_accessible:
            print("\n✓ Flask server test successful!")
            print(f"\nTo run the server manually:")
            print(f"  python app.py")
            print(f"\nOr with specific port:")
            print(f"  python -c \"from app import app; app.run(host='0.0.0.0', port={port}, debug=True)\"")
        else:
            print("\n✗ Server started but not accessible")
            print("\nPossible issues:")
            print("  - Firewall blocking connections")
            print("  - Network configuration issues")
            print("  - Flask app errors")
            
            # Show any output from the process
            stdout, stderr = process.communicate(timeout=1)
            if stdout:
                print(f"\nServer stdout:\n{stdout}")
            if stderr:
                print(f"\nServer stderr:\n{stderr}")
        
        return server_accessible
        
    except Exception as e:
        print(f"\n✗ Unexpected Error: {type(e).__name__}")
        print(f"   Details: {str(e)}")
        traceback.print_exc()
        return False

def check_firewall_status():
    """Check macOS firewall status"""
    print_section("Firewall Status Check")
    
    try:
        # Check if firewall is enabled
        result = subprocess.run(
            ['sudo', '-n', '/usr/libexec/ApplicationFirewall/socketfilterfw', '--getglobalstate'],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print(f"Firewall Status: {result.stdout.strip()}")
        else:
            print("Cannot check firewall status (requires sudo)")
            print("To check manually: sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate")
        
        # Check for Python in firewall
        result = subprocess.run(
            ['sudo', '-n', '/usr/libexec/ApplicationFirewall/socketfilterfw', '--listapps'],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0 and 'python' in result.stdout.lower():
            print("\nPython found in firewall rules")
        
    except Exception as e:
        print(f"Firewall check skipped: {e}")

def main():
    """Run all system tests"""
    print("\n" + "="*60)
    print(" Queensland Youth Justice Tracker - System Test")
    print(" " + datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    print("="*60)
    
    results = {
        'Python Environment': test_python_environment(),
        'Database Connection': test_database_connection(),
        'Scraper Functionality': test_scraper(),
        'Flask Server': test_flask_server()
    }
    
    # Check firewall (informational only)
    check_firewall_status()
    
    # Summary
    print_section("Test Summary")
    
    all_passed = True
    for test, passed in results.items():
        status = "✓ PASSED" if passed else "✗ FAILED"
        print(f"{test}: {status}")
        if not passed:
            all_passed = False
    
    if all_passed:
        print("\n✓ All tests passed! System is ready.")
    else:
        print("\n✗ Some tests failed. Please address the issues above.")
        print("\nCommon fixes:")
        print("  1. Install missing dependencies: pip install -r requirements.txt")
        print("  2. Check firewall settings")
        print("  3. Ensure database file has proper permissions")
        print("  4. Try running with sudo if permission issues persist")
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())