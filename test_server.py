#!/usr/bin/env python3
"""Simple test server to check if we can run any web server."""

from http.server import HTTPServer, SimpleHTTPRequestHandler
import os

class TestHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        
        html = """
        <html>
        <head><title>Queensland Youth Justice Tracker</title></head>
        <body>
            <h1>Queensland Youth Justice Tracker - Test Server</h1>
            <p>If you can see this, the web server is working!</p>
            <h2>System Summary:</h2>
            <ul>
                <li>Detention cost: $857/day</li>
                <li>Community cost: $41/day</li>
                <li>Cost ratio: 20.9:1</li>
                <li>Indigenous overrepresentation: 22x</li>
            </ul>
            <h2>Data Available:</h2>
            <ul>
                <li>10 interviews conducted</li>
                <li>4 hidden cost calculations</li>
                <li>3 coalition members</li>
                <li>2 media citations (900,000 reach)</li>
                <li>6 media graphics generated</li>
            </ul>
            <p>The full dashboard has connection issues on this system.</p>
            <p>Run <code>python3 view_data.py</code> to see all data in terminal.</p>
        </body>
        </html>
        """
        self.wfile.write(html.encode())

def run_server(port=8000):
    server_address = ('', port)
    httpd = HTTPServer(server_address, TestHandler)
    print(f"Test server running on http://localhost:{port}")
    print("Press Ctrl+C to stop")
    httpd.serve_forever()

if __name__ == '__main__':
    run_server()