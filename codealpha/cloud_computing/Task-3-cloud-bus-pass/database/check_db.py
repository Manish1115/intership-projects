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


connection = sqlite3.connect(DATABASE)

connection.row_factory = sqlite3.Row


print("\n========== USERS ==========\n")

users = connection.execute(
    """
    SELECT
        id,
        name,
        email,
        role,
        created_at
    FROM users
    """
).fetchall()


for user in users:

    print(
        f"ID: {user['id']} | "
        f"Name: {user['name']} | "
        f"Email: {user['email']} | "
        f"Role: {user['role']}"
    )


print("\n========== BUSES ==========\n")

buses = connection.execute(
    """
    SELECT
        id,
        bus_number,
        operator,
        source,
        destination,
        total_seats,
        available_seats,
        base_price
    FROM buses
    ORDER BY id
    """
).fetchall()


for bus in buses:

    print(
        f"ID: {bus['id']} | "
        f"{bus['bus_number']} | "
        f"{bus['source']} -> {bus['destination']} | "
        f"Total Seats: {bus['total_seats']} | "
        f"Available: {bus['available_seats']} | "
        f"Price: ₹{bus['base_price']:.2f}"
    )


print("\n========== BOOKINGS ==========\n")

bookings = connection.execute(
    """
    SELECT
        bookings.id,
        bookings.booking_reference,
        bookings.booking_date,
        bookings.seats,
        bookings.total_price,
        bookings.booking_status,

        users.name,

        buses.bus_number,
        buses.source,
        buses.destination

    FROM bookings

    JOIN users
        ON bookings.user_id = users.id

    JOIN buses
        ON bookings.bus_id = buses.id

    ORDER BY bookings.id
    """
).fetchall()


if not bookings:

    print("No bookings found.")

else:

    for booking in bookings:

        print(
            f"Booking ID: {booking['id']}\n"
            f"Reference: {booking['booking_reference']}\n"
            f"Passenger: {booking['name']}\n"
            f"Bus: {booking['bus_number']}\n"
            f"Route: {booking['source']} -> {booking['destination']}\n"
            f"Seats: {booking['seats']}\n"
            f"Total Price: ₹{booking['total_price']:.2f}\n"
            f"Status: {booking['booking_status']}\n"
        )


print("\n========== TICKETS ==========\n")

tickets = connection.execute(
    """
    SELECT
        tickets.id,
        tickets.ticket_number,
        tickets.issued_at,
        bookings.booking_reference

    FROM tickets

    JOIN bookings
        ON tickets.booking_id = bookings.id

    ORDER BY tickets.id
    """
).fetchall()


if not tickets:

    print("No tickets found.")

else:

    for ticket in tickets:

        print(
            f"Ticket ID: {ticket['id']} | "
            f"Ticket Number: {ticket['ticket_number']} | "
            f"Booking: {ticket['booking_reference']}"
        )


connection.close()