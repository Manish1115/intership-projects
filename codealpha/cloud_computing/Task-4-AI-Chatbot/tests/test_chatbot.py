import sys
import os
import json

# Allow importing chatbot.py from the project root
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from chatbot import ChatBot


def normalize(text):
    return " ".join(text.lower().strip().split())


def test_chatbot():
    bot = ChatBot()

    with open(
        "knowledge_base/faq.json",
        "r",
        encoding="utf-8"
    ) as file:
        knowledge_base = json.load(file)

    total_tests = 0
    passed_tests = 0

    print("\n===================================")
    print("       CHATBOT ACCURACY TEST")
    print("===================================\n")

    for item in knowledge_base:

        expected_response = item["response"]

        for pattern in item["patterns"]:

            total_tests += 1

            actual_response = bot.get_response(pattern)

            if normalize(actual_response) == normalize(expected_response):
                passed_tests += 1
                status = "PASS"
            else:
                status = "FAIL"

            print(f"Test {total_tests}: {status}")
            print(f"Question : {pattern}")
            print(f"Expected : {expected_response}")
            print(f"Actual   : {actual_response}")
            print("-" * 60)

    if total_tests > 0:
        accuracy = (passed_tests / total_tests) * 100
    else:
        accuracy = 0

    print("\n===================================")
    print("           TEST RESULTS")
    print("===================================")
    print(f"Total Tests : {total_tests}")
    print(f"Passed      : {passed_tests}")
    print(f"Failed      : {total_tests - passed_tests}")
    print(f"Accuracy    : {accuracy:.2f}%")
    print("===================================\n")

def test_unseen_queries():
    bot = ChatBot()

    test_cases = [
        {
            "question": "Can you tell me what you do?",
            "expected": "I can answer questions from my knowledge base and assist users instantly."
        },
        {
            "question": "May I know who you are?",
            "expected": "I am an AI-powered chatbot developed for the CodeAlpha internship project."
        },
        {
            "question": "What should I call you?",
            "expected": "I am an AI-powered chatbot developed for the CodeAlpha internship project."
        },
        {
            "question": "Who was responsible for creating you?",
            "expected": "I was developed by Manish as part of the CodeAlpha AI Chatbot project."
        },
        {
            "question": "I appreciate your help",
            "expected": "You're welcome! Have a great day."
        },
        {
            "question": "Could you help me?",
            "expected": "I can answer questions from my knowledge base and assist users instantly."
        }
    ]

    total = len(test_cases)
    passed = 0

    print("\n===================================")
    print("       UNSEEN QUERY TEST")
    print("===================================\n")

    for i, test in enumerate(test_cases, 1):
        actual = bot.get_response(test["question"])

        if actual.strip().lower() == test["expected"].strip().lower():
            passed += 1
            status = "PASS"
        else:
            status = "FAIL"

        print(f"Test {i}: {status}")
        print(f"Question : {test['question']}")
        print(f"Expected : {test['expected']}")
        print(f"Actual   : {actual}")
        print("-" * 60)

    accuracy = (passed / total) * 100

    print("\n===================================")
    print("       UNSEEN QUERY RESULTS")
    print("===================================")
    print(f"Total Tests : {total}")
    print(f"Passed      : {passed}")
    print(f"Failed      : {total - passed}")
    print(f"Accuracy    : {accuracy:.2f}%")
    print("===================================\n")


if __name__ == "__main__":
    test_chatbot()
    test_unseen_queries()
    
if __name__ == "__main__":
    test_chatbot()