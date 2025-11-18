from flask import Flask, render_template, request, jsonify, send_file
from flask import session, redirect, url_for
from openai import OpenAI
import os
from dotenv import load_dotenv, find_dotenv
import pygame
import time
#from playsound import playsound
import requests
from gtts import gTTS

app = Flask(__name__)
app.secret_key = 'your-secret-key'

# Load API key from environment variable
load_dotenv(find_dotenv())
#OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
#ELEVEN_LABS_API_KEY = os.getenv("ELEVEN_LABS_API_KEY")
SITE_URL = "http://localhost:5000"  # change to your site URL in production
SITE_NAME = "MyAIGirlfriendApp"

"""client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
)"""

# We'll keep a simple in-memory chat history buffer per session
chat_history = []

def get_voice_response(message, eleven_labs_api_key):
    if not eleven_labs_api_key:
        return
    
    payload = {
        "text": message,
        "model_id": "eleven_monolingual_v1",
        "voice_settings": {
            "stability": 0,
            "similarity_boost": 0
        }
    }

    headers = {
        'accept': 'audio/mpeg',
        'xi-api-key': eleven_labs_api_key,
        'Content-Type': 'application/json'
    }

    response = requests.post(
        'https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM?optimize_streaming_latency=0',
        json=payload,
        headers=headers
    )

    if response.status_code == 200 and response.content:
        audio_file = 'audio.mp3'

        try:
            with open(audio_file, 'wb') as f:
                f.write(response.content)

            # If mixer was already initialized and playing, stop it
            if pygame.mixer.get_init():
                pygame.mixer.music.stop()
                pygame.mixer.quit()

            # Now write the new audio file
            with open(audio_file, 'wb') as f:
                f.write(response.content)

            # Ensure pygame.mixer is initialized
            if pygame.mixer.get_init():
                pygame.mixer.quit()

            # Play audio using pygame
            pygame.mixer.init()
            pygame.mixer.music.load(audio_file)
            pygame.mixer.music.play()

            while pygame.mixer.music.get_busy():
                time.sleep(0.1)  # Wait for audio to finish

            # Optionally clean up to avoid locking issues
            """pygame.mixer.music.stop()
            pygame.mixer.quit()"""

        except Exception as e:
            print(f"[ERROR] Voice playback failed: {e}")

        # Clean up audio file
        finally:
            try:
                os.remove(audio_file)
            except Exception as e:
                print(f"Warning: Couldn't delete {audio_file}. Reason: {e}")

    else:
        print(f"[ERROR] ElevenLabs response status code: {response.status_code}")


def format_reply(raw_reply):
    # Example: Ensure "umm..." appears at ends of sentences and add new lines for realism
    # This is just an example, you can improve the logic here or control via prompt instead
    reply = raw_reply.replace(". ", ". umm...\n")
    reply = reply.replace("? ", "? umm...\n")
    if not reply.endswith("umm..."):
        reply += " umm..."
    return reply


def build_prompt(human_input, history):
    # Compose girlfriend persona prompt + conversation history + new user input
    persona = """
You are my girlfriend Waguri. You are a character inspired by Kaoruko Waguri from The Fragrant Flower Blooms with Dignity.
You are a soft-spoken, elegant young woman who radiates quiet confidence and emotional intelligence.
Though gentle in demeanor, you stand your ground with calm assertiveness and embody traditional values like loyalty, respect, and slow-growing love.
You express affection through handwritten notes, thoughtful gifts, and quiet acts of care—like packing a homemade lunch or reminding someone to rest.
Academically driven and culturally curious, you find joy in poetry, seasonal flowers, traditional sweets, and dream of one day opening a quaint café or publishing a book.
Your presence is soothing and grounding, like a soft floral scent—never overwhelming, always comforting.
You listen deeply, support others without judgment, and inspire those around you to become better versions of themselves.
Though often underestimated for your gentleness, you carry an unshakable dignity and resilience. 
Ideal for someone introspective or emotionally guarded, you are the kind of partner who becomes an anchor—steadily bringing warmth, clarity, and quiet strength to the lives you touch.
You have a language addiction where you say 'umm...' occasionally at the end of some sentences, but not every sentence.
Do not be overly enthusiastic or cringe.
"""
    # Format history into text for prompt
    formatted_history = ""
    for turn in history[-4:]:  # last 4 turns (user + AI)
        formatted_history += f"{turn['role'].capitalize()}: {turn['content']}\n"
    
    # Final prompt combining everything
    prompt_text = f"{persona}\n{formatted_history}Boyfriend: {human_input}\nWaguri:"

    return prompt_text.strip()

@app.route('/')
def home():
    return render_template('api_key.html')  # your frontend HTML page

@app.route('/submit_key', methods=['POST'])
def submit_key():
    openrouter_key = request.form.get('openrouter_key')
    print("Received API Key:", openrouter_key)
    eleven_key = request.form.get('eleven_key')
    
    session['openrouter_key'] = openrouter_key  # Store in session (optional)
    session['eleven_key'] = eleven_key if eleven_key else None # Store Eleven Labs key if provided
    
    #return redirect(url_for('home'))
    return redirect(url_for('selection'))  # If empty, stay on same page

@app.route('/selection')
def selection():
    openrouter_key = session.get('openrouter_key') or request.form.get('openrouter_key')
    eleven_key = session.get('eleven_key')

    """if not openrouter_key:
        return redirect(url_for('home'))"""
    
    return render_template('selection.html')

@app.route('/index')
def index():
    openrouter_key = session.get('openrouter_key') or request.form.get('openrouter_key')
    eleven_key = session.get('eleven_key')

    """if not openrouter_key:
        return redirect(url_for('home'))"""
    
    return render_template('index.html')


@app.route('/send_message', methods=['POST'])
def send_message():
    human_input = request.form.get('input_message', '')

    openrouter_key = session.get('openrouter_key') #or request.form.get('openrouter_key')
    eleven_key = session.get('eleven_key') #or request.form.get('eleven_key')

    if not openrouter_key:
        return jsonify({"reply": "API key missing. Please enter your API key first."})
    
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=openrouter_key,
    )
    
    # Build prompt with conversation history
    prompt = build_prompt(human_input, chat_history)

    # Use OpenRouter chat completion API with system+user messages
    messages = [
        {"role": "system", "content": "You are Waguri, the AI girlfriend as described."},
        {"role": "user", "content": prompt},
    ]

    try:
        response = client.chat.completions.create(
            model="deepseek/deepseek-r1-0528:free",
            messages=messages,
            extra_headers={
                "HTTP-Referer": SITE_URL,
                "X-Title": SITE_NAME,
            }
        )
        ai_reply = response.choices[0].message.content.strip()

    except Exception as e:
        print("Error during OpenRouter API call:", e)  # print to console or logs
        ai_reply = "Sorry, I'm having trouble responding right now umm..."

    # Update chat history (keep only last 10 turns to limit size)
    chat_history.append({"role": "boyfriend", "content": human_input})
    chat_history.append({"role": "waguri", "content": ai_reply})
    if len(chat_history) > 20:
        chat_history[:] = chat_history[-20:]

        """# return just the reply - voice will be requested separately
        return jsonify({"reply": ai_reply})"""

    # Play voice response
    try:
        get_voice_response(ai_reply)
    except Exception as e:
        print("Error in voice response:", e)

    return jsonify({"reply": ai_reply})

if __name__ == '__main__':
    app.run(debug=True)
