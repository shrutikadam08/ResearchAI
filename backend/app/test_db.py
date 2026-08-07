from app.database.connection import engine
from sqlalchemy import text

try:
    with engine.connect() as connection:
        result=connection.execute(text("SELECT version();"))

        print("Database Connected Successfully!")
        print(result.fetchone()[0])

except Exception as e:
    print("Database Connection Failed!")
    print(e)