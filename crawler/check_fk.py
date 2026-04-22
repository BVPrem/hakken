import psycopg2
from config import DATABASE_URL
conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()
# Check if FK is still there
cur.execute("""
  SELECT constraint_name 
  FROM information_schema.table_constraints 
  WHERE table_name = 'user_series' 
  AND constraint_type = 'FOREIGN KEY'
""")
fks = cur.fetchall()
if fks:
    print("FK constraints still exist:", fks)
else:
    print("No FK constraints - good!")

conn.close()