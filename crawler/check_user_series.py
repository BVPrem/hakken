import psycopg2
from config import DATABASE_URL
conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()
cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user_series' ORDER BY ordinal_position")
print('User_series table columns:')
for row in cur.fetchall():
    print(row)
conn.close()