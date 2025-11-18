document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('chatForm');
    const chatbox = document.getElementById('chatbox');
    const modeToggle = document.getElementById('modeToggle');
    const modeLabel = document.getElementById('modeLabel');
    const input = form.querySelector('input[name="input_message"]');

    // Add references to API key inputs
    const openrouterInput = document.querySelector('input[name="openrouter_key"]');
    const elevenlabsInput = document.querySelector('input[name="eleven_key"]');

    // Theme toggle
    modeToggle.addEventListener('change', () => {
        document.body.classList.toggle('dark');
        chatbox.classList.toggle('dark');
        modeLabel.textContent = modeToggle.checked ? "Dark Mode" : "Light Mode";
    });

    // Handle form submission
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        const input = form.querySelector('input[name="input_message"]');
        const message = input.value.trim();

        appendMessage(message, 'user');
        input.value = '';

        const formData = new FormData();
        formData.append('input_message', message);

        // Append API keys from inputs
        if (openrouterInput) {
            formData.append('openrouter_key', openrouterInput.value.trim());
        }

        if (elevenlabsInput) {
            formData.append('eleven_key', elevenlabsInput.value.trim());
        }

        fetch('/send_message', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            // Your Python returns a redirect URL sometimes, handle both cases:
            if (data.redirect) {
                window.location.href = data.redirect;
            } else if (data.reply) {
                appendMessage(data.reply, 'ai');
            } else {
                appendMessage("Sorry, no response received.", 'ai');
            }
        })
        .catch(err => {
            appendMessage("Error communicating with server.", 'ai');
            console.error(err);
        });
    });

    // Load saved chat history on page load
    window.addEventListener('DOMContentLoaded', () => {
        const savedChat = localStorage.getItem('chatHistory');
        if (savedChat) {
            chatbox.innerHTML = savedChat;
        }

        // Restore theme from localStorage
        const savedMode = localStorage.getItem('mode');
        if (savedMode === 'dark') {
            document.body.classList.add('dark-mode');
            document.getElementById('modeToggle').checked = true;
            document.getElementById('modeLabel').textContent = 'Dark Mode';
        }
    });

    // Save chat history to localStorage
    function saveChatHistory() {
        localStorage.setItem('chatHistory', chatbox.innerHTML);
    }

    function clearChat() {
        localStorage.removeItem('chatHistory');
        document.getElementById('checkbox').innerHTML = '';
    }

    function appendMessage(text, sender) {
        const messageElem = document.createElement('div');
        messageElem.classList.add('message');
        messageElem.classList.add(sender === 'user' ? 'user-message' : 'ai-message');
        messageElem.innerHTML = text
            .replace(/\*([^*]+)\*/g, '<b>$1</b>')        // *bold*
            .replace(/_([^_]+)_/g, '<i>$1</i>');         // _italic_
        chatbox.appendChild(messageElem);
        chatbox.scrollTop = chatbox.scrollHeight;
        saveChatHistory();
    }

    // Append typing indicator
    function showTyping() {
        const typing = document.createElement("div");
        typing.className = "typing-indicator bubble waguri";
        typing.innerHTML = `<span class="typing-dots">Waguri is typing</span>`;
        document.querySelector('.chatbox').appendChild(typing);
    }

    // Remove typing indicator
    function hideTyping() {
        const typing = document.querySelector('.typing-indicator');
        if (typing) typing.remove();
    }

});
