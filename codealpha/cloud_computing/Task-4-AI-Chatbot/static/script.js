const clearBtn = document.getElementById("clear-btn");
const sendBtn = document.getElementById("send-btn");
const userInput = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");


sendBtn.addEventListener("click", sendMessage);
clearBtn.addEventListener("click", clearChat);

userInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        sendMessage();
    }
});

async function sendMessage() {

    const message = userInput.value.trim();

    if (message === "") return;

    addMessage(message, "user-message");

    userInput.value = "";

    // Typing Indicator
    const typing = document.createElement("div");
    typing.className = "bot-message";
    typing.id = "typing";
    typing.innerText = "Typing...";

    chatBox.appendChild(typing);
    chatBox.scrollTop = chatBox.scrollHeight;

    const response = await fetch("/chat", {
        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            message: message
        })
    });

    const data = await response.json();

    // Wait 700ms so the typing indicator is visible
    await new Promise(resolve => setTimeout(resolve, 700));

    document.getElementById("typing").remove();

    addMessage(data.response, "bot-message");
}


function addMessage(message, type) {

    const wrapper = document.createElement("div");

    wrapper.classList.add("message");

    if(type === "user-message")
        wrapper.classList.add("user");
    else
        wrapper.classList.add("bot");

    const avatar = document.createElement("div");

    avatar.classList.add("avatar");

    if(type === "user-message"){
        avatar.classList.add("user-avatar");
        avatar.innerHTML = "👤";
    }
    else{
        avatar.classList.add("bot-avatar");
        avatar.innerHTML = "🤖";
    }

    const content = document.createElement("div");

    const bubble = document.createElement("div");

    bubble.classList.add("bubble");

    bubble.innerText = message;

    const time = document.createElement("div");

    time.classList.add("time");

    const now = new Date();

    time.innerText = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });

    content.appendChild(bubble);

    content.appendChild(time);

    if(type === "user-message"){
        wrapper.appendChild(content);
        wrapper.appendChild(avatar);
    }
    else{
        wrapper.appendChild(avatar);
        wrapper.appendChild(content);
    }

    chatBox.appendChild(wrapper);

    chatBox.scrollTop = chatBox.scrollHeight;

}

function clearChat(){

    chatBox.innerHTML = `
        <div class="message bot">
            <div class="avatar bot-avatar">🤖</div>

            <div>
                <div class="bubble">
                    Hello! How can I help you today?
                </div>

                <div class="time">
                    Just now
                </div>
            </div>
        </div>
    `;
}