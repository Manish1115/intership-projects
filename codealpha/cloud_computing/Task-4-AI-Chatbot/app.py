from flask import Flask, render_template, request, jsonify, redirect
import json

from chatbot import bot
from database import initialize_database, save_chat, get_chat_history

from flask import send_file
import csv

app = Flask(__name__)

initialize_database()


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/chat", methods=["POST"])
def chat():

    user_message = request.json["message"]

    response = bot.get_response(user_message)

    save_chat(user_message, response)

    return jsonify({
        "response": response
    })


@app.route("/admin")
def admin():
    return render_template("admin.html")


@app.route("/add", methods=["POST"])
def add():

    question = request.form["question"]
    response = request.form["response"]

    with open("knowledge_base/faq.json", "r") as file:
        data = json.load(file)

    new_item = {
        "id": len(data) + 1,
        "patterns": [question],
        "response": response
    }

    data.append(new_item)

    with open("knowledge_base/faq.json", "w") as file:
        json.dump(data, file, indent=4)

    # Reload chatbot without restarting Flask
    bot.reload()

    return redirect("/admin")

@app.route("/history")
def history():

    return jsonify(
        get_chat_history()
    )

@app.route("/export")
def export():

    chats = get_chat_history()

    with open("chat_history.csv", "w", newline="", encoding="utf-8") as file:

        writer = csv.writer(file)

        writer.writerow([
            "User Message",
            "Bot Response",
            "Timestamp"
        ])

        writer.writerows(chats)

    return send_file(
        "chat_history.csv",
        as_attachment=True
    )


if __name__ == "__main__":
    app.run(debug=True)