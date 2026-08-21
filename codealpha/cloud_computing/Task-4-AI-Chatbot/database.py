import sqlite3


DATABASE = "database/chatlogs.db"


def initialize_database():

    connection = sqlite3.connect(DATABASE)

    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chat_logs(

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            user_message TEXT,

            bot_response TEXT,

            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP

        )
    """)

    connection.commit()

    connection.close()


def save_chat(user_message, bot_response):

    connection = sqlite3.connect(DATABASE)

    cursor = connection.cursor()

    cursor.execute(
        """
        INSERT INTO chat_logs(user_message, bot_response)
        VALUES (?,?)
        """,
        (user_message, bot_response)
    )

    connection.commit()

    connection.close()

def get_chat_history():

    connection = sqlite3.connect(DATABASE)

    cursor = connection.cursor()

    cursor.execute("""
        SELECT user_message, bot_response, timestamp
        FROM chat_logs
        ORDER BY id DESC
    """)

    data = cursor.fetchall()

    connection.close()

    return data