import os
from pathlib import Path

from flask import Flask, jsonify, render_template, request

try:
    from google import genai as google_genai
except Exception:  # pragma: no cover
    google_genai = None

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

app = Flask(
    __name__,
    template_folder=str(FRONTEND_DIR),
    static_folder=str(FRONTEND_DIR),
    static_url_path="/static",
)
app.config["TEMPLATES_AUTO_RELOAD"] = True


def get_client():
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key or google_genai is None:
        return None

    try:
        return google_genai.Client(api_key=api_key)
    except Exception:
        return None


client = get_client()


def build_blog_content(title: str, prompt: str, category: str, tone: str, language: str, word_count: int) -> str:
    title_text = title.strip() or "Future Forward Insights"
    prompt_text = prompt.strip() or "AI-driven storytelling"
    category_text = category.strip() or "Technology"
    tone_text = tone.strip().lower() or "inspiring"
    language_text = language.strip() or "English"
    words = max(180, word_count or 700)

    return (
        f"# {title_text}\n\n"
        f"In the {category_text} landscape, the future is being written by bold ideas and smart systems. {prompt_text} is no longer a distant concept; it is becoming the engine behind how teams create, communicate, and grow.\n\n"
        f"## Why This Matters\n"
        f"Today’s audience expects clarity, precision, and originality. A {tone_text} voice helps your message feel human while still being powered by the speed of modern AI. In {language_text}, this approach creates a richer experience for readers who want substance alongside style.\n\n"
        f"## Key Opportunities\n"
        f"- Build trust through useful, well-structured insights\n"
        f"- Create strong narratives with a confident, premium tone\n"
        f"- Improve discoverability with clear structure and modern relevance\n\n"
        f"## Closing Thoughts\n"
        f"The most effective stories combine imagination with practicality. When you pair a strong topic with a polished voice, the result becomes memorable, relevant, and ready to resonate across a global audience.\n\n"
        f"This draft is designed to be engaging, professional, and naturally suited for roughly {words} words of polished content."
    )


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/chat", methods=["POST"])
def chat():
    payload = request.get_json(silent=True) or {}
    message = payload.get("message", "")

    if client:
        try:
            response = client.models.generate_content(
                model=os.getenv("GEMINI_MODEL", "gemini-2.0-flash-exp"),
                contents=message,
            )
            return jsonify({"reply": response.text})
        except Exception:
            pass

    return jsonify({"reply": f"Local fallback response: {message}"})


@app.route("/generate-blog", methods=["POST"])
def generate_blog():
    payload = request.get_json(silent=True) or {}
    title = (payload.get("title") or "").strip()
    prompt = (payload.get("prompt") or "").strip()
    category = (payload.get("category") or "Technology").strip()
    tone = (payload.get("tone") or "inspiring").strip()
    language = (payload.get("language") or "English").strip()
    word_count = int(payload.get("wordCount") or 700)

    if not title and not prompt:
        return jsonify({"error": "Please provide a title or prompt."}), 400

    if client:
        try:
            full_prompt = (
                f"Write a polished blog article about: {title or prompt}. "
                f"Use the category '{category}', tone '{tone}', language '{language}', "
                f"and create content suitable for around {word_count} words."
            )
            response = client.models.generate_content(
                model=os.getenv("GEMINI_MODEL", "gemini-2.0-flash-exp"),
                contents=full_prompt,
            )
            blog_text = response.text.strip()
            if blog_text:
                return jsonify({"title": title or "Generated Blog", "content": blog_text, "model": os.getenv("GEMINI_MODEL", "gemini-2.0-flash-exp")})
        except Exception:
            pass

    blog_text = build_blog_content(title, prompt, category, tone, language, word_count)
    return jsonify({"title": title or "Generated Blog", "content": blog_text, "model": "fallback"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
