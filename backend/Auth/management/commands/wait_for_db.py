import time
import os
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'Wait for the database to be ready'

    def handle(self, *args, **kwargs):
        self.stdout.write("Waiting for database...")
        connected = False
        attempts = 0
        max_attempts = 60
        while not connected and attempts < max_attempts:
            try:
                import MySQLdb
                conn = MySQLdb.connect(
                    host=os.getenv('MYSQL_HOST', 'db'),
                    user=os.getenv('MYSQL_USER', 'mergius_user'),
                    password=os.getenv('MYSQL_PASSWORD', 'mergius170905!'),
                    database=os.getenv('MYSQL_DATABASE', 'mergius_db'),
                    port=int(os.getenv('MYSQL_PORT', '3306'))
                )
                conn.close()
                connected = True
                self.stdout.write(self.style.SUCCESS("Database is ready!"))
            except ImportError:
                self.stdout.write("MySQLdb not available, trying mysql.connector...")
                try:
                    import mysql.connector
                    conn = mysql.connector.connect(
                        host=os.getenv('MYSQL_HOST', 'db'),
                        user=os.getenv('MYSQL_USER', 'mergius_user'),
                        password=os.getenv('MYSQL_PASSWORD', 'mergius170905!'),
                        database=os.getenv('MYSQL_DATABASE', 'mergius_db'),
                        port=int(os.getenv('MYSQL_PORT', '3306'))
                    )
                    conn.close()
                    connected = True
                    self.stdout.write(self.style.SUCCESS("Database is ready!"))
                except mysql.connector.Error as e:
                    self.stdout.write(f"Database not ready (attempt {attempts + 1}/{max_attempts}): {str(e)}")
                    time.sleep(2)
                    attempts += 1
            except MySQLdb.OperationalError as e:
                self.stdout.write(f"Database not ready (attempt {attempts + 1}/{max_attempts}): {str(e)}")
                time.sleep(2)
                attempts += 1
        if not connected:
            raise Exception(f"Could not connect to database after {max_attempts} attempts")