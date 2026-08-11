import secrets
import io
import base64

from functools import wraps
from datetime import date

import mysql.connector
import qrcode

from flask import (
    Flask,
    render_template,
    request,
    redirect,
    url_for,
    session,
    flash
)

from werkzeug.security import (
    generate_password_hash,
    check_password_hash
)

from config import Config


app = Flask(__name__)
app.config.from_object(Config)


# ==========================================
# DATABASE
# ==========================================

def get_db():

    return mysql.connector.connect(
        host=Config.MYSQL_HOST,
        port=Config.MYSQL_PORT,
        user=Config.MYSQL_USER,
        password=Config.MYSQL_PASSWORD,
        database=Config.MYSQL_DATABASE,
        ssl_ca=Config.MYSQL_SSL_CA,
        ssl_verify_cert=True,
        ssl_verify_identity=True
    )

# ==========================================
# LOGIN PROTECTION
# ==========================================

def login_required(function):

    @wraps(function)
    def decorated_function(*args, **kwargs):

        if "user_id" not in session:

            flash(
                "Please login first.",
                "error"
            )

            return redirect(
                url_for("login")
            )

        return function(*args, **kwargs)

    return decorated_function


# ==========================================
# ADMIN PROTECTION
# ==========================================

def admin_required(function):

    @wraps(function)
    def decorated_function(*args, **kwargs):

        if "user_id" not in session:

            flash(
                "Please login first.",
                "error"
            )

            return redirect(
                url_for("login")
            )

        if session.get("user_role") != "admin":

            flash(
                "Admin access required.",
                "error"
            )

            return redirect(
                url_for("dashboard")
            )

        return function(*args, **kwargs)

    return decorated_function


# ==========================================
# QR CODE GENERATOR
# ==========================================

def generate_qr_code(ticket_number):

    verification_url = url_for(
        "verify_ticket",
        ticket_number=ticket_number,
        _external=True
    )

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=4
    )

    qr.add_data(
        verification_url
    )

    qr.make(
        fit=True
    )

    image = qr.make_image(
        fill_color="black",
        back_color="white"
    )

    image_buffer = io.BytesIO()

    image.save(
        image_buffer,
        format="PNG"
    )

    image_buffer.seek(0)

    encoded_image = base64.b64encode(
        image_buffer.getvalue()
    ).decode("utf-8")

    return encoded_image


# ==========================================
# HOME
# ==========================================

@app.route("/")
def home():

    return render_template(
        "index.html"
    )


# ==========================================
# REGISTER
# ==========================================

@app.route(
    "/register",
    methods=["GET", "POST"]
)
def register():

    if request.method == "POST":

        name = request.form.get(
            "name",
            ""
        ).strip()

        email = request.form.get(
            "email",
            ""
        ).strip().lower()

        password = request.form.get(
            "password",
            ""
        )

        confirm_password = request.form.get(
            "confirm_password",
            ""
        )

        if (
            not name
            or not email
            or not password
        ):

            flash(
                "All fields are required.",
                "error"
            )

            return render_template(
                "register.html"
            )

        if password != confirm_password:

            flash(
                "Passwords do not match.",
                "error"
            )

            return render_template(
                "register.html"
            )

        if len(password) < 6:

            flash(
                "Password must contain at least 6 characters.",
                "error"
            )

            return render_template(
                "register.html"
            )

        connection = get_db()

        cursor = connection.cursor(
            dictionary=True
        )

        try:

            cursor.execute(
                """
                SELECT id
                FROM users
                WHERE email = %s
                """,
                (email,)
            )

            existing_user = cursor.fetchone()

            if existing_user:

                flash(
                    "An account with this email already exists.",
                    "error"
                )

                return render_template(
                    "register.html"
                )

            hashed_password = (
                generate_password_hash(
                    password
                )
            )

            cursor.execute(
                """
                INSERT INTO users
                (
                    name,
                    email,
                    password,
                    role
                )

                VALUES
                (
                    %s,
                    %s,
                    %s,
                    %s
                )
                """,
                (
                    name,
                    email,
                    hashed_password,
                    "user"
                )
            )

            connection.commit()

        except mysql.connector.Error:

            connection.rollback()

            flash(
                "Registration failed. Please try again.",
                "error"
            )

            return render_template(
                "register.html"
            )

        finally:

            cursor.close()
            connection.close()

        flash(
            "Registration successful. Please login.",
            "success"
        )

        return redirect(
            url_for("login")
        )

    return render_template(
        "register.html"
    )


# ==========================================
# LOGIN
# ==========================================

@app.route(
    "/login",
    methods=["GET", "POST"]
)
def login():

    if request.method == "POST":

        email = request.form.get(
            "email",
            ""
        ).strip().lower()

        password = request.form.get(
            "password",
            ""
        )

        if not email or not password:

            flash(
                "Email and password are required.",
                "error"
            )

            return render_template(
                "login.html"
            )

        connection = get_db()

        cursor = connection.cursor(
            dictionary=True
        )

        try:

            cursor.execute(
                """
                SELECT
                    id,
                    name,
                    email,
                    password,
                    role

                FROM users

                WHERE email = %s
                """,
                (email,)
            )

            user = cursor.fetchone()

        finally:

            cursor.close()
            connection.close()

        if user is None:

            flash(
                "Invalid email or password.",
                "error"
            )

            return render_template(
                "login.html"
            )

        if not check_password_hash(
            user["password"],
            password
        ):

            flash(
                "Invalid email or password.",
                "error"
            )

            return render_template(
                "login.html"
            )

        session.clear()

        session["user_id"] = user["id"]
        session["user_name"] = user["name"]
        session["user_email"] = user["email"]
        session["user_role"] = user["role"]

        flash(
            "Login successful.",
            "success"
        )

        if user["role"] == "admin":

            return redirect(
                url_for("admin_dashboard")
            )

        return redirect(
            url_for("dashboard")
        )

    return render_template(
        "login.html"
    )


# ==========================================
# USER DASHBOARD
# ==========================================

@app.route("/dashboard")
@login_required
def dashboard():

    connection = get_db()

    cursor = connection.cursor(
        dictionary=True
    )

    try:

        cursor.execute(
            """
            SELECT

                bookings.id,
                bookings.booking_date,
                bookings.seats,
                bookings.total_price,
                bookings.booking_status,
                bookings.booking_reference,

                buses.bus_number,
                buses.operator,
                buses.source,
                buses.destination,
                buses.departure_time,
                buses.arrival_time,

                tickets.ticket_number

            FROM bookings

            JOIN buses
                ON bookings.bus_id = buses.id

            LEFT JOIN tickets
                ON bookings.id = tickets.booking_id

            WHERE bookings.user_id = %s

            ORDER BY bookings.created_at DESC
            """,
            (
                session["user_id"],
            )
        )

        bookings = cursor.fetchall()

    finally:

        cursor.close()
        connection.close()

    return render_template(
        "dashboard.html",
        bookings=bookings
    )


# ==========================================
# BUS SEARCH
# ==========================================

@app.route(
    "/search",
    methods=["GET", "POST"]
)
@login_required
def search():

    buses = []

    source = ""

    destination = ""

    if request.method == "POST":

        source = request.form.get(
            "source",
            ""
        ).strip()

        destination = request.form.get(
            "destination",
            ""
        ).strip()

        if not source or not destination:

            flash(
                "Please enter both source and destination.",
                "error"
            )

        else:

            connection = get_db()

            cursor = connection.cursor(
                dictionary=True
            )

            try:

                cursor.execute(
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

                    WHERE LOWER(source) = LOWER(%s)

                    AND LOWER(destination) = LOWER(%s)

                    AND available_seats > 0

                    ORDER BY departure_time
                    """,
                    (
                        source,
                        destination
                    )
                )

                buses = cursor.fetchall()

            finally:

                cursor.close()
                connection.close()

            if not buses:

                flash(
                    "No buses found for this route.",
                    "error"
                )

    return render_template(
        "search.html",
        buses=buses,
        source=source,
        destination=destination
    )


# ==========================================
# BOOKING
# ==========================================

@app.route(
    "/book/<int:bus_id>",
    methods=["GET", "POST"]
)
@login_required
def book(bus_id):

    connection = get_db()

    cursor = connection.cursor(
        dictionary=True
    )

    try:

        cursor.execute(
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

            WHERE id = %s
            """,
            (bus_id,)
        )

        bus = cursor.fetchone()

    finally:

        cursor.close()
        connection.close()

    if bus is None:

        flash(
            "The selected bus does not exist.",
            "error"
        )

        return redirect(
            url_for("search")
        )

    if request.method == "POST":

        try:

            seats = int(
                request.form.get(
                    "seats",
                    "0"
                )
            )

        except ValueError:

            seats = 0

        if seats <= 0:

            flash(
                "Please select at least one seat.",
                "error"
            )

            return render_template(
                "booking.html",
                bus=bus
            )

        connection = get_db()

        cursor = connection.cursor(
            dictionary=True
        )

        try:

            # Lock the bus row while booking.
            connection.start_transaction()

            cursor.execute(
                """
                SELECT
                    available_seats,
                    base_price

                FROM buses

                WHERE id = %s

                FOR UPDATE
                """,
                (bus_id,)
            )

            current_bus = cursor.fetchone()

            if current_bus is None:

                connection.rollback()

                flash(
                    "Bus is no longer available.",
                    "error"
                )

                return redirect(
                    url_for("search")
                )

            if seats > current_bus["available_seats"]:

                connection.rollback()

                flash(
                    f"Only {current_bus['available_seats']} seats are available.",
                    "error"
                )

                return render_template(
                    "booking.html",
                    bus=bus
                )

            # IMPORTANT:
            # Price comes from MySQL,
            # not from the browser.

            total_price = (
                current_bus["base_price"]
                * seats
            )

            booking_reference = (
                "CB-"
                + secrets.token_hex(5).upper()
            )

            cursor.execute(
                """
                UPDATE buses

                SET available_seats =
                    available_seats - %s

                WHERE id = %s
                """,
                (
                    seats,
                    bus_id
                )
            )

            cursor.execute(
                """
                INSERT INTO bookings
                (
                    user_id,
                    bus_id,
                    booking_date,
                    seats,
                    total_price,
                    booking_status,
                    booking_reference
                )

                VALUES
                (
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s
                )
                """,
                (
                    session["user_id"],
                    bus_id,
                    date.today(),
                    seats,
                    total_price,
                    "CONFIRMED",
                    booking_reference
                )
            )

            booking_id = cursor.lastrowid

            ticket_number = (
                "TKT-"
                + secrets.token_hex(6).upper()
            )

            cursor.execute(
                """
                INSERT INTO tickets
                (
                    booking_id,
                    ticket_number
                )

                VALUES
                (
                    %s,
                    %s
                )
                """,
                (
                    booking_id,
                    ticket_number
                )
            )

            connection.commit()

        except mysql.connector.Error:

            connection.rollback()

            flash(
                "Booking could not be completed. Please try again.",
                "error"
            )

            return redirect(
                url_for(
                    "book",
                    bus_id=bus_id
                )
            )

        finally:

            cursor.close()
            connection.close()

        return redirect(
            url_for(
                "ticket",
                booking_id=booking_id
            )
        )

    return render_template(
        "booking.html",
        bus=bus
    )


# ==========================================
# TICKET
# ==========================================

@app.route(
    "/ticket/<int:booking_id>"
)
@login_required
def ticket(booking_id):

    connection = get_db()

    cursor = connection.cursor(
        dictionary=True
    )

    try:

        cursor.execute(
            """
            SELECT

                bookings.id,
                bookings.booking_date,
                bookings.seats,
                bookings.total_price,
                bookings.booking_status,
                bookings.booking_reference,

                buses.bus_number,
                buses.operator,
                buses.source,
                buses.destination,
                buses.departure_time,
                buses.arrival_time,

                tickets.ticket_number

            FROM bookings

            JOIN buses
                ON bookings.bus_id = buses.id

            JOIN tickets
                ON bookings.id = tickets.booking_id

            WHERE bookings.id = %s

            AND bookings.user_id = %s

            AND bookings.booking_status = 'CONFIRMED'
            """,
            (
                booking_id,
                session["user_id"]
            )
        )

        booking = cursor.fetchone()

    finally:

        cursor.close()
        connection.close()

    if booking is None:

        flash(
            "This ticket is no longer valid.",
            "error"
        )

        return redirect(
            url_for("dashboard")
        )

    qr_code = generate_qr_code(
        booking["ticket_number"]
    )

    return render_template(
        "ticket.html",
        booking=booking,
        qr_code=qr_code
    )


# ==========================================
# VERIFY TICKET
# ==========================================

@app.route(
    "/verify/<ticket_number>"
)
def verify_ticket(ticket_number):

    connection = get_db()

    cursor = connection.cursor(
        dictionary=True
    )

    try:

        cursor.execute(
            """
            SELECT

                tickets.ticket_number,

                bookings.booking_reference,
                bookings.booking_status,
                bookings.booking_date,
                bookings.seats,
                bookings.total_price,

                users.name,

                buses.bus_number,
                buses.operator,
                buses.source,
                buses.destination,
                buses.departure_time,
                buses.arrival_time

            FROM tickets

            JOIN bookings
                ON tickets.booking_id = bookings.id

            JOIN users
                ON bookings.user_id = users.id

            JOIN buses
                ON bookings.bus_id = buses.id

            WHERE tickets.ticket_number = %s
            """,
            (ticket_number,)
        )

        ticket = cursor.fetchone()

    finally:

        cursor.close()
        connection.close()

    return render_template(
        "verify.html",
        ticket=ticket
    )


# ==========================================
# CANCEL BOOKING
# ==========================================

@app.route(
    "/cancel/<int:booking_id>",
    methods=["POST"]
)
@login_required
def cancel_booking(booking_id):

    connection = get_db()

    cursor = connection.cursor(
        dictionary=True
    )

    try:

        connection.start_transaction()

        cursor.execute(
            """
            SELECT

                id,
                bus_id,
                seats,
                booking_status

            FROM bookings

            WHERE id = %s

            AND user_id = %s

            FOR UPDATE
            """,
            (
                booking_id,
                session["user_id"]
            )
        )

        booking = cursor.fetchone()

        if booking is None:

            connection.rollback()

            flash(
                "Booking not found.",
                "error"
            )

            return redirect(
                url_for("dashboard")
            )

        if booking["booking_status"] == "CANCELLED":

            connection.rollback()

            flash(
                "This booking has already been cancelled.",
                "error"
            )

            return redirect(
                url_for("dashboard")
            )

        cursor.execute(
            """
            UPDATE bookings

            SET booking_status = 'CANCELLED'

            WHERE id = %s

            AND user_id = %s
            """,
            (
                booking_id,
                session["user_id"]
            )
        )

        cursor.execute(
            """
            UPDATE buses

            SET available_seats =
                available_seats + %s

            WHERE id = %s
            """,
            (
                booking["seats"],
                booking["bus_id"]
            )
        )

        connection.commit()

        flash(
            "Booking cancelled successfully. Seats have been released.",
            "success"
        )

    except mysql.connector.Error:

        connection.rollback()

        flash(
            "Unable to cancel the booking.",
            "error"
        )

    finally:

        cursor.close()
        connection.close()

    return redirect(
        url_for("dashboard")
    )


# ==========================================
# ADMIN DASHBOARD
# ==========================================

@app.route("/admin")
@admin_required
def admin_dashboard():

    connection = get_db()

    cursor = connection.cursor(
        dictionary=True
    )

    try:

        cursor.execute(
            """
            SELECT COUNT(*) AS count
            FROM users
            """
        )

        total_users = cursor.fetchone()["count"]


        cursor.execute(
            """
            SELECT COUNT(*) AS count
            FROM buses
            """
        )

        total_buses = cursor.fetchone()["count"]


        cursor.execute(
            """
            SELECT COUNT(*) AS count
            FROM bookings
            """
        )

        total_bookings = cursor.fetchone()["count"]


        cursor.execute(
            """
            SELECT COUNT(*) AS count

            FROM bookings

            WHERE booking_status = 'CONFIRMED'
            """
        )

        confirmed_bookings = (
            cursor.fetchone()["count"]
        )


        cursor.execute(
            """
            SELECT COUNT(*) AS count

            FROM bookings

            WHERE booking_status = 'CANCELLED'
            """
        )

        cancelled_bookings = (
            cursor.fetchone()["count"]
        )


        cursor.execute(
            """
            SELECT COALESCE(
                SUM(total_price),
                0
            ) AS revenue

            FROM bookings

            WHERE booking_status = 'CONFIRMED'
            """
        )

        total_revenue = (
            cursor.fetchone()["revenue"]
        )


        cursor.execute(
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

            ORDER BY id DESC
            """
        )

        buses = cursor.fetchall()


        cursor.execute(
            """
            SELECT

                bookings.booking_reference,
                bookings.booking_date,
                bookings.seats,
                bookings.total_price,
                bookings.booking_status,

                users.name,
                users.email,

                buses.bus_number,
                buses.source,
                buses.destination

            FROM bookings

            JOIN users
                ON bookings.user_id = users.id

            JOIN buses
                ON bookings.bus_id = buses.id

            ORDER BY bookings.created_at DESC

            LIMIT 20
            """
        )

        bookings = cursor.fetchall()

    finally:

        cursor.close()
        connection.close()

    return render_template(
        "admin.html",
        total_users=total_users,
        total_buses=total_buses,
        total_bookings=total_bookings,
        confirmed_bookings=confirmed_bookings,
        cancelled_bookings=cancelled_bookings,
        total_revenue=total_revenue,
        buses=buses,
        bookings=bookings
    )


# ==========================================
# ADD BUS
# ==========================================

@app.route(
    "/admin/add-bus",
    methods=["POST"]
)
@admin_required
def add_bus():

    bus_number = request.form.get(
        "bus_number",
        ""
    ).strip()

    operator = request.form.get(
        "operator",
        ""
    ).strip()

    source = request.form.get(
        "source",
        ""
    ).strip()

    destination = request.form.get(
        "destination",
        ""
    ).strip()

    departure_time = request.form.get(
        "departure_time",
        ""
    ).strip()

    arrival_time = request.form.get(
        "arrival_time",
        ""
    ).strip()

    try:

        total_seats = int(
            request.form.get(
                "total_seats",
                "0"
            )
        )

        base_price = float(
            request.form.get(
                "base_price",
                "0"
            )
        )

    except ValueError:

        flash(
            "Seats and price must be valid numbers.",
            "error"
        )

        return redirect(
            url_for("admin_dashboard")
        )

    if (
        not bus_number
        or not operator
        or not source
        or not destination
        or not departure_time
        or not arrival_time
    ):

        flash(
            "All bus fields are required.",
            "error"
        )

        return redirect(
            url_for("admin_dashboard")
        )

    if total_seats <= 0:

        flash(
            "Total seats must be greater than zero.",
            "error"
        )

        return redirect(
            url_for("admin_dashboard")
        )

    if base_price <= 0:

        flash(
            "Price must be greater than zero.",
            "error"
        )

        return redirect(
            url_for("admin_dashboard")
        )

    connection = get_db()

    cursor = connection.cursor()

    try:

        cursor.execute(
            """
            INSERT INTO buses
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
            """,
            (
                bus_number,
                operator,
                source,
                destination,
                departure_time,
                arrival_time,
                total_seats,
                total_seats,
                base_price
            )
        )

        connection.commit()

        flash(
            "Bus added successfully.",
            "success"
        )

    except mysql.connector.Error as error:

        connection.rollback()

        if error.errno == 1062:

            flash(
                "A bus with this bus number already exists.",
                "error"
            )

        else:

            flash(
                "Unable to add the bus.",
                "error"
            )

    finally:

        cursor.close()
        connection.close()

    return redirect(
        url_for("admin_dashboard")
    )


# ==========================================
# LOGOUT
# ==========================================

@app.route("/logout")
def logout():

    session.clear()

    flash(
        "You have been logged out.",
        "success"
    )

    return redirect(
        url_for("home")
    )


# ==========================================
# RUN APPLICATION
# ==========================================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )