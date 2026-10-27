import os

# Importing the application settings constructs the DB URL. Use isolated values;
# tests below never connect to a database unless a test explicitly requests one.
os.environ.setdefault("POSTGRES_DB", "rentcar_test")
os.environ.setdefault("POSTGRES_USER", "rentcar_test")
os.environ.setdefault("POSTGRES_PASSWORD", "local-test-password-not-for-production")
os.environ.setdefault("ALLOWED_ORIGINS", '["http://localhost:8080"]')
