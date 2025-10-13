# app.py (DEMO VERSION)
# ==============================================================================
# This file contains the main FastAPI application for the PsyDesign AI demo.
# It sets up the server, defines API endpoints, and handles database interactions.
# All AI-related functionalities are mocked to simulate the full version's behavior.
# ==============================================================================

# --- Core Imports ---
import uvicorn
import json
import time
import logging
import warnings

# --- Framework and Database Imports ---
from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func

# ==============================================================================
# 1. APPLICATION CONFIGURATION & SETUP
# ==============================================================================

# --- Suppress unnecessary terminal output for a cleaner console experience ---
# Hides deprecation warnings and standard Uvicorn access/error logs.
warnings.filterwarnings('ignore', category=DeprecationWarning)
logging.getLogger('uvicorn.access').setLevel(logging.ERROR)
logging.getLogger('uvicorn.error').setLevel(logging.ERROR)

# --- Database Setup (SQLAlchemy) ---
# Defines the database connection, session management, and the ORM model.
SQLALCHEMY_DATABASE_URL = "sqlite:///./brand_history.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False} # Required for SQLite
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ORM Model for storing brand generation history.
class History(Base):
    """Represents a single brand generation entry in the database."""
    __tablename__ = "history"
    id = Column(Integer, primary_key=True, index=True)
    description = Column(String, index=True) # The user's initial prompt
    analysis = Column(Text)                  # The JSON string of the AI's analysis
    logo_url = Column(String)                # URL to the generated logo
    language = Column(String)                # The language used for the request
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def to_dict(self):
        """Converts the SQLAlchemy model instance to a dictionary."""
        return {
            "id": self.id,
            "description": self.description,
            "analysis": self.analysis,
            "logo_url": self.logo_url,
            "language": self.language,
            "created_at": self.created_at.isoformat()
        }

# Create the database tables if they don't exist.
Base.metadata.create_all(bind=engine)

def get_db():
    """
    Dependency function to get a database session for each request.
    Ensures the session is closed after the request is finished.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Internationalization (i18n) ---
# A dictionary holding translations for the UI text in different languages.
translations = {
    "en": {"title": "PsyDesign AI - Brand Psychology Designer", "header_title": "PsyDesign AI", "header_subtitle": "Your brand's soul, designed by intelligence.", "input_placeholder": "e.g., 'A sustainable coffee brand for urban youth.'", "design_button": "Design My Brand", "history_title": "Design History", "new_design": "New Design"},
    "es": {"title": "PsyDesign AI - Diseñador de Psicología de Marca", "header_title": "PsyDesign AI", "header_subtitle": "El alma de tu marca, diseñada por inteligencia.", "input_placeholder": "Ej: 'Una marca de café sostenible para jóvenes urbanos.'", "design_button": "Diseñar Mi Marca", "history_title": "Historial de Diseños", "new_design": "Nuevo Diseño"},
    "fr": {"title": "PsyDesign AI - Concepteur en Psychologie de Marque", "header_title": "PsyDesign AI", "header_subtitle": "L'âme de votre marque, conçue par l'intelligence.", "input_placeholder": "Ex: 'Une marque de café durable pour les jeunes urbains.'", "design_button": "Concevoir Ma Marque", "history_title": "Historique des Conceptions", "new_design": "Nouveau Design"},
    "hi": {"title": "साइ-डिज़ाइन AI - ब्रांड मनोविज्ञान डिज़ाइनर", "header_title": "साइ-डिज़ाइन AI", "header_subtitle": "आपकी ब्रांड की आत्मा, बुद्धिमत्ता द्वारा डिज़ाइन की गई।", "input_placeholder": "उदा: 'शहरी युवाओं के लिए एक सस्टेनेबल कॉफ़ी ब्रांड।'", "design_button": "मेरा ब्रांड डिज़ाइन करें", "history_title": "डिज़ाइन इतिहास", "new_design": "नया डिज़ाइन"},
    "zh": {"title": "PsyDesign AI - 品牌心理学设计师", "header_title": "PsyDesign AI", "header_subtitle": "智能设计的品牌灵魂。", "input_placeholder": "例如：'一个为城市青年打造的可持续咖啡品牌。'", "design_button": "设计我的品牌", "history_title": "设计历史", "new_design": "新设计"},
    "ar": {"title": "PsyDesign AI - مصمم سيكولوجية العلامة التجارية", "header_title": "PsyDesign AI", "header_subtitle": "روح علامتك التجارية، مصممة بالذكاء.", "input_placeholder": "مثال: 'علامة تجارية مستدامة للقهوة لشباب المدن.'", "design_button": "صمم علامتي التجارية", "history_title": "سجل التصميمات", "new_design": "تصميم جديد"}
}

# ==============================================================================
# 2. FASTAPI APPLICATION INITIALIZATION
# ==============================================================================

app = FastAPI()

# Mount static files (CSS, JS, images) and define template directory.
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# --- Pydantic Models for Request Bodies ---
# These models validate the structure and types of incoming JSON data.

class BrandRequest(BaseModel):
    """Request model for generating a new brand identity."""
    description: str
    language: str = 'en'

class ChatRequest(BaseModel):
    """Request model for chatting with the brand persona."""
    analysis: str
    message: str
    language: str = 'en'
    
class TTSRequest(BaseModel):
    """Request model for the Text-to-Speech service."""
    text: str

# ==============================================================================
# 3. API ENDPOINTS
# ==============================================================================

# --- Frontend Serving Endpoint ---

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request, lang: str = 'en'):
    """
    Serves the main dashboard page.
    It passes the appropriate language translations to the Jinja2 template.
    """
    if lang not in translations:
        lang = 'en' # Default to English if the language is unsupported.
    return templates.TemplateResponse("dashboard.html", {
        "request": request,
        "lang": lang,
        "t": translations[lang]
    })

# --- Mock API Endpoints for Demo ---

@app.post("/api/generate-brand")
async def generate_brand_identity_mock(request: BrandRequest, db: Session = Depends(get_db)):
    """
    DEMO: Simulates the AI brand generation process.
    Instead of calling an AI model, it reads from a static JSON file
    and returns a local placeholder logo.
    """
    try:
        # Simulate network latency and AI processing time.
        time.sleep(3) 

        # Read pre-defined data from a mock file instead of calling GPT-4o.
        with open("mock_data.json", "r", encoding="utf-8") as f:
            analysis_data = json.load(f)
        
        analysis_result_json = json.dumps(analysis_data)
        logo_url = "/static/placeholder_logo.png" # Use a local placeholder logo.

        # Save the generated result to the history database.
        db_history = History(
            description=request.description,
            analysis=analysis_result_json,
            logo_url=logo_url,
            language=request.language
        )
        db.add(db_history)
        db.commit()
        db.refresh(db_history)

        return JSONResponse(content={"id": db_history.id, "analysis": analysis_data, "logo_url": logo_url})

    except Exception as e:
        # Proper error logging is important for debugging.
        print(f"AN ERROR OCCURRED IN DEMO /api/generate-brand: {e}")
        return JSONResponse(status_code=500, content={"error": "Failed to generate mock brand identity."})


@app.post("/api/chat-with-persona")
async def chat_with_persona_mock(request: ChatRequest):
    """DEMO: Simulates a chat response from the generated brand persona."""
    time.sleep(1) # Simulate processing delay.
    
    lang = request.language
    mock_replies = {
        "en": "Thank you for asking! As the persona for this brand, I believe our core value is innovation. (This is a simulated response).",
        "es": "¡Gracias por preguntar! Como la persona de esta marca, creo que nuestro valor principal es la innovación. (Esta es una respuesta simulada).",
        "fr": "Merci pour votre question ! En tant que persona de cette marque, je crois que notre valeur fondamentale est l'innovation. (Ceci est une réponse simulée).",
    }
    # Fallback to English if the language is not in our mock replies.
    reply = mock_replies.get(lang, mock_replies["en"])
    
    return JSONResponse(content={"reply": reply})


@app.post("/api/tts")
async def text_to_speech_mock(request: TTSRequest):
    """
    DEMO: This endpoint is a placeholder. In the full version, it would
    generate speech from text. Here, it returns an error to indicate
    that this is a feature of the production-ready version.
    """
    return JSONResponse(status_code=501, content={"error": "Text-to-Speech is a feature available in the full version."})


@app.get("/api/proxy-image")
async def proxy_image_mock(url: str):
    """
    DEMO: In the full version, this endpoint proxies remote DALL-E image URLs
    to prevent CORS issues and allow for direct download. Here, it serves the local
    placeholder file to enable the download feature in the demo.
    """
    if url == "/static/placeholder_logo.png":
        return FileResponse(path="static/placeholder_logo.png", media_type="image/png", filename="logo.png")
    else:
        raise HTTPException(status_code=404, detail="Image not found in demo assets.")

# --- History Endpoints ---

@app.get("/api/history")
async def get_history(db: Session = Depends(get_db)):
    """Retrieves the last 50 brand generation history items from the database."""
    history_items = db.query(History).order_by(History.created_at.desc()).limit(50).all()
    results = []
    for item in history_items:
        item_dict = item.to_dict()
        try:
            # The 'analysis' field is stored as a JSON string; parse it back to an object.
            item_dict['analysis'] = json.loads(item_dict['analysis'])
        except (json.JSONDecodeError, TypeError):
            # Handle cases where the JSON might be corrupted or invalid.
            item_dict['analysis'] = {"error": "Invalid analysis format"}
        results.append(item_dict)
    return JSONResponse(content=results)


@app.delete("/api/history/{item_id}")
async def delete_history_item(item_id: int, db: Session = Depends(get_db)):
    """Deletes a specific history item by its ID."""
    db_item = db.query(History).filter(History.id == item_id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="History item not found")
    db.delete(db_item)
    db.commit()
    return JSONResponse(content={"message": "Item deleted successfully"}, status_code=200)

# ==============================================================================
# 4. APPLICATION LAUNCHER
# ==============================================================================

if __name__ == "__main__":
    host = "127.0.0.1"
    port = 8000
    
    # --- Friendly startup message ---
    print("\n" + "="*60)
    print("🎨 PsyDesign AI (Demo Version) is Initializing...")
    print("   - AI model calls are simulated.")
    print("   - Local database ready.")
    print("\n✅ System is online and ready to connect.")
    print(f"   Navigate to: http://{host}:{port}")
    print("="*60 + "\n")
    
    # Run the FastAPI server using uvicorn.
    uvicorn.run("app:app", host=host, port=port, reload=False, log_level="error")