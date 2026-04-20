import psycopg2
from config import DATABASE_URL
conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()
cur.execute("SELECT source, COUNT(*) FROM articles GROUP BY source ORDER BY COUNT(*) DESC")
print('Source article counts:')
for row in cur.fetchall():
    print(f'{row[0]}: {row[1]}')
conn.close()