"""
Shared rate limiter instance.

Lives in its own module (rather than inside main.py or auth.py) so both
can import it without a circular import: main.py needs it to register
the limiter on app.state, auth.py needs it to decorate the login/signup
routes.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
