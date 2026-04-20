import psycopg2
from config import DATABASE_URL
conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()
cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'friendships' ORDER BY ordinal_position")
print('Friendships table columns:')
for row in cur.fetchall():
    print(row)
conn.close()