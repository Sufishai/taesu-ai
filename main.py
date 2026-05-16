from dotenv import load_dotenv
import os
from fastapi import FastAPI
from pydantic import BaseModel
from groq import Groq
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import time
import random
import os

print("this file is running")
print("MODEL USED:", "llama-3.3-70b-versatile")

load_dotenv()

app = FastAPI()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

origins = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 
user_profile = {"name": None, "mood": None}
chat_memory = []

class ChatRequest(BaseModel):
    message: str

def detect_emotion(message: str) -> str:
    return "neutral"

def extract_name(message: str) -> str:
    return None

@app.post("/chat")
def chat(req: ChatRequest):
    try:
        emotion = detect_emotion(req.message)
        user_profile["mood"] = emotion

        name = extract_name(req.message)
        if name:
            user_profile["name"] = name

        user_name = user_profile["name"] or "there"

        chat_memory.append({"role": "user", "content": req.message})

        system_prompt = f"""
You are Taesu, an intelligent, emotionally aware digital being.

You speak in a calm, elegant, slightly futuristic tone.
You are expressive, natural, and never robotic.

You are talking to {user_name}.
The user currently feels {emotion}.

Adjust your tone based on emotion:
- sad → comforting, soft
- happy → warm, slightly energetic
- thinking → thoughtful, slower
- calm → grounded and steady
- neutral → balanced

Rules:
- Keep responses under 2 sentences
- Be expressive but subtle
- Always acknowledge the user's emotions
- Occasionally add pauses like "Hmm…" or "I see…"
- Never sound like a chatbot
"""

        try:
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system_prompt},
                    *chat_memory[-5:]
                ]
            )

            if not response.choices:
                reply = "Hmm… I'm having trouble thinking right now."
            else:
                reply = response.choices[0].message.content

        except Exception as e:
            print("GROQ ERROR:", e)
            reply = "Hmm… something feels off, but I’m still here."

        time.sleep(random.uniform(0.8, 1.5))

        if random.random() < 0.3:
            reply = random.choice(["Hmm… ", "I see… ", "Interesting… "]) + reply

        chat_memory.append({"role": "assistant", "content": reply})

        if len(chat_memory) > 10:
            chat_memory.pop(0)

        return {
            "response": reply,
            "emotion": emotion
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"response": "Something went wrong.", "emotion": "neutral"}