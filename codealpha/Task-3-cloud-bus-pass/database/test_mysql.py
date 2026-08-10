import os
import sys
import mysql.connector


# Add project root directory to Python path
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


try:

    connection = mysql.connector.connect(
        host=Config.MYSQL_HOST,
        port=Config.MYSQL_PORT,
        user=Config.MYSQL_USER,
        password=Config.MYSQL_PASSWORD,
        database=Config.MYSQL_DATABASE
    )

    if connection.is_connected():

        cursor = connection.cursor()

        cursor.execute(
            "SELECT DATABASE()"
        )

        database_name = cursor.fetchone()[0]

        print()
        print("================================")
        print("MYSQL CONNECTION SUCCESSFUL")
        print("================================")
        print(f"Database: {database_name}")

        cursor.execute(
            "SHOW TABLES"
        )

        tables = cursor.fetchall()

        print()
        print("Tables:")

        for table in tables:
            print(f"- {table[0]}")

        print()
        print("Connection test completed successfully.")

        cursor.close()

    connection.close()


except mysql.connector.Error as error:

    print()
    print("================================")
    print("MYSQL CONNECTION FAILED")
    print("================================")
    print()
    print(error)