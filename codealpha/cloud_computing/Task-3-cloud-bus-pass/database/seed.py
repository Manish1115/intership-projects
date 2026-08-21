import sqlite3
import os


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DATABASE = os.path.join(
    BASE_DIR,
    "database",
    "bus_pass.db"
)


connection = sqlite3.connect(DATABASE)

connection.execute("PRAGMA foreign_keys = ON")


buses = [
    (
        "MH12AB1001",
        "Pune Express",
        "Pune",
        "Mumbai",
        "07:00",
        "10:30",
        40,
        40,
        350.00
    ),

    (
        "MH12AB1002",
        "Pune Express",
        "Pune",
        "Mumbai",
        "10:00",
        "13:30",
        40,
        40,
        350.00
    ),

    (
        "MH12AB1003",
        "Deccan Travels",
        "Pune",
        "Nashik",
        "08:30",
        "12:30",
        50,
        50,
        450.00
    ),

    (
        "MH12AB1004",
        "Deccan Travels",
        "Mumbai",
        "Pune",
        "15:00",
        "18:30",
        40,
        40,
        350.00
    ),

    (
        "MH12AB1005",
        "Maharashtra Bus",
        "Pune",
        "Satara",
        "09:00",
        "11:30",
        40,
        40,
        250.00
    )
]


for bus in buses:

    connection.execute(
        """
        INSERT OR IGNORE INTO buses
        (
            bus_number,
            operator,
            source,
            destination,
            departure_time,
            arrival_time,
            total_seats,
            available_seats,
            base_price
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        bus
    )


connection.commit()


print("Sample buses added successfully.")


print("\nAvailable buses:\n")


rows = connection.execute(
    """
    SELECT
        bus_number,
        operator,
        source,
        destination,
        departure_time,
        arrival_time,
        available_seats,
        base_price
    FROM buses
    ORDER BY id
    """
).fetchall()


for row in rows:

    print(
        f"{row[0]} | "
        f"{row[1]} | "
        f"{row[2]} -> {row[3]} | "
        f"{row[4]} -> {row[5]} | "
        f"Seats: {row[6]} | "
        f"Price: ₹{row[7]:.2f}"
    )


connection.close()