import psycopg2
from config import DATABASE_URL
conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()
cur.execute("SELECT * FROM user_series LIMIT 10")
rows = cur.fetchall()
if rows:
    print("user_series rows found:")
    for row in rows:
        print(row)
else:
    print("user_series table is EMPTY")
conn.close()