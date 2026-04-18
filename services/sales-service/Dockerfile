FROM python:3.11-slim

WORKDIR /app

# installer les dependances Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# copier le code source
COPY . .

EXPOSE 8004

# demarrer le serveur uvicorn avec hot-reload
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8004", "--reload"]
