import psycopg2
from config import DATABASE_URL
conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()
cur.execute("SELECT id, title_en FROM series WHERE title_en ILIKE '%one piece%' OR title_en ILIKE '%bleach%' OR title_en ILIKE '%naruto%' OR title_en ILIKE '%attack on titan%'")
print('Popular series IDs:')
for row in cur.fetchall():
    print(f'{row[0]}: {row[1]}')
conn.close()