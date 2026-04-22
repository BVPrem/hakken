import psycopg2
from config import DATABASE_URL
conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()
# Try to insert directly
try:
    cur.execute("""
        INSERT INTO user_series (user_id, series_id, status, progress)
        VALUES ('test-user-123', 'anilist-21', 'watching', 0)
    """)
    conn.commit()
    print("Direct insert SUCCESS")
except Exception as e:
    print(f"Direct insert FAILED: {e}")

# Check
cur.execute("SELECT * FROM user_series")
rows = cur.fetchall()
print(f"Rows after insert: {len(rows)}")
for row in rows:
    print(row)

conn.close()