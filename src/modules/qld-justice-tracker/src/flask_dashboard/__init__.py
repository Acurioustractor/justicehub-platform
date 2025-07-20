# Lazy import to avoid circular dependencies
def get_app():
    from .app import app
    return app

def get_socketio():
    from .app import socketio
    return socketio

# For backward compatibility
import sys
if 'src.flask_dashboard.app' not in sys.modules:
    # Only import if not already imported (avoids circular import)
    from .app import app, socketio

__all__ = ['app', 'socketio', 'get_app', 'get_socketio']