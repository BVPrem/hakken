import psycopg2
from config import DATABASE_URL
conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()
cur.execute("SELECT COUNT(*) FROM users")
count = cur.fetchone()[0]
print(f"Users table: {count} rows")

if count > 0:
    cur.execute("SELECT id, username, email FROM users LIMIT 5")
    for row in cur.fetchall():
        print(row)

conn.close()