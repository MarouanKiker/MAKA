FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt* ./
RUN pip install --no-cache-dir fastapi uvicorn sqlalchemy psycopg2-binary alembic 2>/dev/null || true
COPY . .
EXPOSE 8004
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8004"]
