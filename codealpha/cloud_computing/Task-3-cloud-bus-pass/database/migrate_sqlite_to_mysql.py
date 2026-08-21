import os
import sys
import sqlite3
import mysql.connector


# ==========================================
# PROJECT ROOT
# ==========================================

PROJECT_ROOT = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

sys.path.insert(
    0,
    PROJECT_ROOT
)


from config import Config


# ==========================================
# SQLITE DATABASE
# ==========================================

SQLITE_DATABASE = os.path.join(
    PROJECT_ROOT,
    "database",
    "bus_pass.db"
)


# ==========================================
# MYSQL CONNECTION
# ==========================================

def get_mysql_connection():

    return mysql.connector.connect(
        host=Config.MYSQL_HOST,
        port=Config.MYSQL_PORT,
        user=Config.MYSQL_USER,
        password=Config.MYSQL_PASSWORD,
        database=Config.MYSQL_DATABASE
    )


# ==========================================
# MAIN MIGRATION
# ==========================================

def migrate():

    print()
    print("==========================================")
    print("CloudBus SQLite → MySQL Migration")
    print("==========================================")
    print()


    # --------------------------------------
    # Connect to SQLite
    # --------------------------------------

    sqlite_connection = sqlite3.connect(
        SQLITE_DATABASE
    )

    sqlite_connection.row_factory = sqlite3.Row


    # --------------------------------------
    # Connect to MySQL
    # --------------------------------------

    mysql_connection = get_mysql_connection()

    mysql_cursor = mysql_connection.cursor()


    try:

        # ==================================
        # USERS
        # ==================================

        print("Migrating users...")

        users = sqlite_connection.execute(
            """
            SELECT
                id,
                name,
                email,
                password,
                role,
                created_at

            FROM users

            ORDER BY id
            """
        ).fetchall()


        for user in users:

            mysql_cursor.execute(
                """
                INSERT INTO users
                (
                    id,
                    name,
                    email,
                    password,
                    role,
                    created_at
                )

                VALUES
                (
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s
                )

                ON DUPLICATE KEY UPDATE

                    name = VALUES(name),
                    password = VALUES(password),
                    role = VALUES(role)
                """,
                (
                    user["id"],
                    user["name"],
                    user["email"],
                    user["password"],
                    user["role"],
                    user["created_at"]
                )
            )


        print(
            f"  Migrated {len(users)} user(s)"
        )


        # ==================================
        # BUSES
        # ==================================

        print("Migrating buses...")

        buses = sqlite_connection.execute(
            """
            SELECT
                id,
                bus_number,
                operator,
                source,
                destination,
                departure_time,
                arrival_time,
                total_seats,
                available_seats,
                base_price

            FROM buses

            ORDER BY id
            """
        ).fetchall()


        for bus in buses:

            mysql_cursor.execute(
                """
                INSERT INTO buses
                (
                    id,
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

                VALUES
                (
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s
                )

                ON DUPLICATE KEY UPDATE

                    operator = VALUES(operator),
                    source = VALUES(source),
                    destination = VALUES(destination),
                    departure_time = VALUES(departure_time),
                    arrival_time = VALUES(arrival_time),
                    total_seats = VALUES(total_seats),
                    available_seats = VALUES(available_seats),
                    base_price = VALUES(base_price)
                """,
                (
                    bus["id"],
                    bus["bus_number"],
                    bus["operator"],
                    bus["source"],
                    bus["destination"],
                    bus["departure_time"],
                    bus["arrival_time"],
                    bus["total_seats"],
                    bus["available_seats"],
                    bus["base_price"]
                )
            )


        print(
            f"  Migrated {len(buses)} bus(es)"
        )


        # ==================================
        # BOOKINGS
        # ==================================

        print("Migrating bookings...")

        bookings = sqlite_connection.execute(
            """
            SELECT
                id,
                user_id,
                bus_id,
                booking_date,
                seats,
                total_price,
                booking_status,
                booking_reference,
                created_at

            FROM bookings

            ORDER BY id
            """
        ).fetchall()


        for booking in bookings:

            mysql_cursor.execute(
                """
                INSERT INTO bookings
                (
                    id,
                    user_id,
                    bus_id,
                    booking_date,
                    seats,
                    total_price,
                    booking_status,
                    booking_reference,
                    created_at
                )

                VALUES
                (
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s
                )

                ON DUPLICATE KEY UPDATE

                    booking_status =
                        VALUES(booking_status),

                    seats =
                        VALUES(seats),

                    total_price =
                        VALUES(total_price)
                """,
                (
                    booking["id"],
                    booking["user_id"],
                    booking["bus_id"],
                    booking["booking_date"],
                    booking["seats"],
                    booking["total_price"],
                    booking["booking_status"],
                    booking["booking_reference"],
                    booking["created_at"]
                )
            )


        print(
            f"  Migrated {len(bookings)} booking(s)"
        )


        # ==================================
        # TICKETS
        # ==================================

        print("Migrating tickets...")

        tickets = sqlite_connection.execute(
            """
            SELECT
                id,
                booking_id,
                ticket_number,
                issued_at

            FROM tickets

            ORDER BY id
            """
        ).fetchall()


        for ticket in tickets:

            mysql_cursor.execute(
                """
                INSERT INTO tickets
                (
                    id,
                    booking_id,
                    ticket_number,
                    issued_at
                )

                VALUES
                (
                    %s,
                    %s,
                    %s,
                    %s
                )

                ON DUPLICATE KEY UPDATE

                    ticket_number =
                        VALUES(ticket_number)
                """,
                (
                    ticket["id"],
                    ticket["booking_id"],
                    ticket["ticket_number"],
                    ticket["issued_at"]
                )
            )


        print(
            f"  Migrated {len(tickets)} ticket(s)"
        )


        # ==================================
        # COMMIT
        # ==================================

        mysql_connection.commit()


        print()
        print("==========================================")
        print("MIGRATION COMPLETED SUCCESSFULLY")
        print("==========================================")
        print()


    except Exception as error:

        mysql_connection.rollback()

        print()
        print("==========================================")
        print("MIGRATION FAILED")
        print("==========================================")
        print()
        print(error)

        raise


    finally:

        mysql_cursor.close()

        mysql_connection.close()

        sqlite_connection.close()


# ==========================================
# RUN
# ==========================================

if __name__ == "__main__":

    migrate()