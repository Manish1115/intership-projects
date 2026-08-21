import sqlite3
import os


BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

DATABASE = os.path.join(
    BASE_DIR,
    "database",
    "bus_pass.db"
)

EMAIL = "manishbagul11251125@gmail.com"


connection = sqlite3.connect(DATABASE)

cursor = connection.execute(
    """
    UPDATE users
    SET role = 'admin'
    WHERE email = ?
    """,
    (EMAIL,)
)

connection.commit()


if cursor.rowcount == 1:
    print("Admin role assigned successfully.")
else:
    print("User not found. Check the email address.")


user = connection.execute(
    """
    SELECT id, name, email, role
    FROM users
    WHERE email = ?
    """,
    (EMAIL,)
).fetchone()


if user:
    print()
    print("User:")
    print(f"ID: {user[0]}")
    print(f"Name: {user[1]}")
    print(f"Email: {user[2]}")
    print(f"Role: {user[3]}")


connection.close()