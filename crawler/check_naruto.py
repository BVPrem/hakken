import psycopg2
from config import DATABASE_URL
conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()
cur.execute("SELECT id, title_en FROM series WHERE title_en ILIKE '%naruto%'")
print('Naruto series IDs:')
for row in cur.fetchall():
    print(f'{row[0]}: {row[1]}')
conn.close()