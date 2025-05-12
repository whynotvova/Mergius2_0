FROM python:3.11

WORKDIR /app
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt
RUN apt-get update && apt-get install -y mariadb-client
RUN mkdir -p /app/static
COPY . .
EXPOSE 8000