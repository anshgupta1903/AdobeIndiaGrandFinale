import os
import json
import time
import shutil
import fitz
import uuid
import asyncio
import random
from typing import List, Dict, Any
from fastapi.staticfiles import StaticFiles
import httpx
from dotenv import load_dotenv
from pydantic import BaseModel
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
import logging
import google.auth
import google.auth.transport.requests

# --- Load Environment Variables ---
load_dotenv()

# --- Local Imports ---
from redis_client import get_redis_client
from session_manager import (
    create_session,
    get_session,
    add_message_to_history,
    get_all_sessions_metadata_for_user,
    update_session,
    create_user,
    get_user,
    authenticate_user
)
from auth import get_password_hash

# --- TTS Library Imports ---
import azure.cognitiveservices.speech as speechsdk
import pyttsx3

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Pydantic Models ---
class ChatRequest(BaseModel):
    sessionId: str
    query: str

class PodcastRequest(BaseModel):
    analysis_data: Dict[str, Any]
    language: str = "en"

class TranslateInsightsRequest(BaseModel):
    sessionId: str

class SelectionInsightsRequest(BaseModel):
    text: str

class UserCreate(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

# --- Initialize FastAPI App ---
app = FastAPI(
    title="PDF Intelligence API",
    description="API for persona-driven PDF analysis, chat, and multi-language audio summaries, powered by Gemini 2.5 Flash.",
    version="3.3.0"
)
SESSION_FILES_DIR = "session_files"
os.makedirs(SESSION_FILES_DIR, exist_ok=True)

# --- Add CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8080"], # Allow both dev and prod ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Global Variables & Constants ---
SUPPORTED_LANGUAGES = { "en": "English", "hi": "Hindi" }
AZURE_VOICE_MAP = { "en": "en-US-JennyNeural", "hi": "hi-IN-SwaraNeural" }
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")

# --- App Startup Event ---
@app.on_event("startup")
async def startup_event():
    get_redis_client()
    if not GOOGLE_API_KEY:
        print("CRITICAL WARNING: GOOGLE_API_KEY environment variable is not set!")
    print("Application startup complete.")

# ==============================================================================
# Authentication Dependency
# ==============================================================================
async def get_current_user(authorization: str = Header(...)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    user_email = authorization
    user = get_user(user_email)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    return user

# ==============================================================================
# Centralized Gemini API Caller
# ==============================================================================
async def call_gemini_api(payload: dict, timeout: float = 120.0) -> dict:
    model = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")
    api_key = os.environ.get("GOOGLE_API_KEY")

    if api_key:
        api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
    else:
        # Fallback to service account credentials if API key is not present
        creds, _ = google.auth.load_credentials_from_file(
            os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"),
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )
        auth_req = google.auth.transport.requests.Request()
        creds.refresh(auth_req)
        token = creds.token
        api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    max_retries = 5
    base_wait_time = 1
    for attempt in range(max_retries):
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.post(api_url, headers=headers, json=payload)
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as e:
            if e.response.status_code in (429, 503):
                wait_time = (base_wait_time * (2 ** attempt)) + random.uniform(0, 1)
                logger.warning(f"Gemini error {e.response.status_code}. Retrying in {wait_time:.2f}s...")
                await asyncio.sleep(wait_time)
                continue
            raise HTTPException(status_code=e.response.status_code, detail=f"Gemini API error: {e}")
        except (httpx.ReadTimeout, httpx.RequestError) as e:
            if attempt < max_retries - 1:
                await asyncio.sleep(1)
                continue
            raise HTTPException(status_code=504, detail=f"Gemini request failed: {e}")
    raise HTTPException(status_code=503, detail="Gemini API unavailable after retries.")

# ==============================================================================
# Core Analysis Function
# ==============================================================================
async def generate_connected_analysis(full_text_context: str, persona: str, job_to_be_done: str) -> Dict[str, Any]:
    json_schema = {
        "type": "OBJECT",
        "properties": {
            "top_sections": {
                "type": "ARRAY",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "importance_rank": {"type": "INTEGER"},
                        "document": {"type": "STRING"},
                        "page_number": {"type": "INTEGER"},
                        "section_title": {"type": "STRING"},
                        "subsection_analysis": {"type": "STRING", "description": "A relevant snippet from the section."},
                        "reasoning": {"type": "STRING"}
                    }, "required": ["importance_rank", "document", "page_number", "section_title", "subsection_analysis", "reasoning"]
                }
            },
            "llm_insights": {
                "type": "OBJECT",
                "properties": {
                    "key_insights": {"type": "ARRAY", "items": {"type": "STRING"}},
                    "did_you_know": {"type": "ARRAY", "items": {"type": "STRING"}},
                    "cross_document_connections": {"type": "ARRAY", "items": {"type": "STRING"}}
                }, "required": ["key_insights", "did_you_know", "cross_document_connections"]
            }
        }, "required": ["top_sections", "llm_insights"]
    }
    prompt = f"""
    You are an expert research assistant acting as a '{persona}' whose goal is to '{job_to_be_done}'.
    Analyze the provided context, which contains the full text from one or more documents.
    *Your Reasoning Process:*
    1. *Assess Relevance:* First, review the user's goal: '{job_to_be_done}'. Now, read through all the provided document texts. Decide which documents are relevant to this goal and which are not.
    2. *Extract Initial Insights:* From the documents you identified as RELEVANT, extract the top 5 most important sections that directly address the user's goal. These will populate the 'top_sections' of the JSON response.Also , for each section, provide:subsections as it is from the pdf. When you extract a section, also include the page number.
The page number is indicated in the provided context between markers like:
--- START OF PAGE 3 in MyDoc.pdf --- ... --- END OF PAGE 3 in MyDoc.pdf ---.
Always copy this page number into the "page_number" field in the JSON..
    3. *Synthesize Connected Insights:* Now, consider all the RELEVANT documents together. Generate the deeper insights for the 'llm_insights' section.
        - *cross_document_connections*: This is the most critical part. Find connections, patterns, or contradictions between all the relevant materials. Explicitly state which documents you used and which you ignored (and why). For example: "I have ignored Lunch.pdf as it was not relevant to the goal of creating a dinner menu."
    *Provided Context:*
    {full_text_context}
    *Instructions:*
    Respond ONLY with a single JSON object that strictly adheres to the specified schema. Your response must be based on fulfilling the user's goal using only the relevant documents from the context.
    """
    payload = {"contents": [{"parts": [{"text": prompt}]}],"generationConfig": {"responseMimeType": "application/json", "responseSchema": json_schema}}
    try:
        response_json = await call_gemini_api(payload)
        return json.loads(response_json['candidates'][0]['content']['parts'][0]['text'])
    except Exception as e:
        logger.error(f"Failed to generate connected analysis: {e}")
        return {"top_sections": [],"llm_insights": {"key_insights": [f"Error during analysis: {e}"],"did_you_know": [],"cross_document_connections": ["Could not establish connections due to an error."]}}

# ==============================================================================
# API Endpoints
# ==============================================================================
@app.post("/register")
async def register_user(user: UserCreate):
    db_user = get_user(user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = get_password_hash(user.password)
    create_user(user.email, hashed_password, user.name)
    return {"message": "User created successfully"}

@app.post("/login")
async def login_for_access_token(user: UserLogin):
    authenticated_user = authenticate_user(user.email, user.password)
    if not authenticated_user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    return {"access_token": user.email, "token_type": "bearer", "user_name": authenticated_user['name']}

@app.post("/analyze/")
async def analyze_documents(files: List[UploadFile] = File(...), persona: str = Form(...), job_to_be_done: str = Form(...), sessionId: str = Form(None), current_user: dict = Depends(get_current_user)):
    user_email = current_user['email']
    if not get_redis_client():
        raise HTTPException(status_code=503, detail="Database service is unavailable.")
    user_files_dir = os.path.join(SESSION_FILES_DIR, user_email)
    os.makedirs(user_files_dir, exist_ok=True)
    context_parts = []
    processed_filenames = set()
    for file in files:
        if file.filename in processed_filenames:
            continue
        try:
            file_bytes = await file.read()
            file_location = os.path.join(user_files_dir, file.filename)
            with open(file_location, "wb+") as file_object:
                file_object.write(file_bytes)
            with fitz.open(stream=file_bytes, filetype="pdf") as doc:
                for page_num, page in enumerate(doc, start=1):
                    text = page.get_text()
                    context_parts.append(f"--- START OF PAGE {page_num} in {file.filename} ---\n{text}\n--- END OF PAGE {page_num} in {file.filename} ---\n")
            processed_filenames.add(file.filename)
        except Exception as e:
            logger.error(f"Error reading new file {file.filename}: {e}")
            raise HTTPException(status_code=400, detail=f"Could not process file: {file.filename}")
    for existing_filename in os.listdir(user_files_dir):
        if existing_filename in processed_filenames:
            continue
        try:
            file_path = os.path.join(user_files_dir, existing_filename)
            with fitz.open(file_path) as doc:
                text = "".join(page.get_text() for page in doc)
                context_parts.append(f"--- START OF FULL TEXT for {existing_filename} ---\n{text}\n--- END OF FULL TEXT for {existing_filename} ---\n")
                processed_filenames.add(existing_filename)
        except Exception as e:
            logger.error(f"Error reading existing file {existing_filename}: {e}")
            continue
    if not context_parts:
        raise HTTPException(status_code=400, detail="No content available for analysis (new or existing).")
    full_text_context = "\n".join(context_parts)
    analysis_result = await generate_connected_analysis(full_text_context, persona, job_to_be_done)
    file_path_map = {filename: f"/session_files/{user_email}/{filename}" for filename in processed_filenames}
    analysis_result["metadata"] = {"input_documents": list(processed_filenames),"persona": persona,"job_to_be_done": job_to_be_done,"processing_timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),"file_path_map": file_path_map,"user_id": user_email}
    if sessionId:
        update_session(sessionId, analysis_result)
        current_session_id = sessionId
    else:
        current_session_id = create_session(analysis_result, user_email)
        if not current_session_id:
            raise HTTPException(status_code=500, detail="Failed to create a new session.")
    return JSONResponse(content={"sessionId": current_session_id, "analysis": analysis_result})

@app.post("/chat/")
async def chat_with_documents(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    session_data = get_session(request.sessionId)
    if not session_data:
        raise HTTPException(status_code=404, detail="Chat session not found.")
    add_message_to_history(request.sessionId, {"role": "user", "content": request.query})
    updated_session_data = get_session(request.sessionId)
    prompt = f"You are a helpful assistant. Based on the initial analysis context and the conversation history, answer the user's last query. Do not give the results from outside the documents uploaded.\n\nContext: {json.dumps(updated_session_data['analysis'])}\n\nHistory: {updated_session_data['chat_history']}\n\nUser Query: {request.query}"
    payload = {"contents": [{"parts": [{"text": prompt}]}]}
    response_json = await call_gemini_api(payload)
    bot_response_content = response_json['candidates'][0]['content']['parts'][0]['text']
    bot_message = {"role": "bot", "content": bot_response_content}
    add_message_to_history(request.sessionId, bot_message)
    return JSONResponse(content=bot_message)

@app.post("/insights-on-selection")
async def get_insights_on_selection(request: SelectionInsightsRequest, current_user: dict = Depends(get_current_user)):
    prompt = f"""
    You are an expert research assistant. Your task is to analyze the provided text and deliver a structured analysis.
    *Instructions:*
    1. *Provide a Cohesive Summary:* Synthesize the information from the text into a concise summary.
    2. *Extract Key Takeaways:* List the most important points or conclusions.
    3. *Formulate Potential Questions:* Based on the text, what are some logical follow-up questions a user might have?
    *Text for Analysis:*
    ---
    {request.text}
    ---
    Respond ONLY with a single JSON object with the keys "summary", "key_takeaways" (as an array of strings), and "potential_questions" (as an array of strings). Do not include any other text or markdown.
    """
    json_schema = {"type": "OBJECT","properties": {"summary": {"type": "STRING"},"key_takeaways": {"type": "ARRAY", "items": {"type": "STRING"}},"potential_questions": {"type": "ARRAY", "items": {"type": "STRING"}}},"required": ["summary", "key_takeaways", "potential_questions"]}
    payload = {"contents": [{"parts": [{"text": prompt}]}],"generationConfig": {"responseMimeType": "application/json", "responseSchema": json_schema}}
    try:
        response_json = await call_gemini_api(payload)
        insights = json.loads(response_json['candidates'][0]['content']['parts'][0]['text'])
        return JSONResponse(content=insights)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate insights: {e}")

@app.get("/sessions/")
async def get_sessions_list(current_user: dict = Depends(get_current_user)):
    user_email = current_user['email']
    metadata = get_all_sessions_metadata_for_user(user_email)
    return JSONResponse(content=metadata)

@app.get("/sessions/{session_id}")
async def get_session_details(session_id: str, current_user: dict = Depends(get_current_user)):
    session_data = get_session(session_id)
    if not session_data:
        raise HTTPException(status_code=404, detail="Session not found.")
    if session_data['analysis']['metadata'].get('user_id') != current_user['email']:
        raise HTTPException(status_code=403, detail="Not authorized to access this session")
    return JSONResponse(content=session_data)

@app.post("/translate-insights/")
async def translate_insights_endpoint(request: TranslateInsightsRequest, current_user: dict = Depends(get_current_user)):
    session_data = get_session(request.sessionId)
    if not session_data or "analysis" not in session_data:
        raise HTTPException(status_code=404, detail="Session or analysis data not found.")
    llm_insights = session_data["analysis"].get("llm_insights")
    if not llm_insights:
        raise HTTPException(status_code=400, detail="No insights found in this session to translate.")
    keys_to_translate = ['key_insights', 'did_you_know', 'cross_document_connections']
    insights_for_translation = {key: llm_insights.get(key, []) for key in keys_to_translate if llm_insights.get(key)}
    if not insights_for_translation:
        return JSONResponse(content={"message": "No text found in insights to translate."})
    async def translate_batch_gemini(texts_dict, target_lang):
        translated_dict = {}
        for key, texts in texts_dict.items():
            translated_texts = [await translate_text_gemini(text, target_lang) for text in texts]
            translated_dict[key] = translated_texts
        return translated_dict
    translated_insights = await translate_batch_gemini(insights_for_translation, "hi")
    if "error" in translated_insights:
        raise HTTPException(status_code=500, detail=translated_insights["error"])
    return JSONResponse(content={"translated_insights": translated_insights})

async def generate_podcast_summary_script(analysis_data: dict) -> str:
    metadata = analysis_data.get("metadata", {})
    llm_insights = analysis_data.get("llm_insights", {})
    if not llm_insights: return "No insights were generated for this analysis."
    prompt = f"You are a podcast host. Create an engaging, narrative-style podcast script of 400-500 words based on the provided JSON data. The target audience is a '{metadata.get('persona', 'professional')}' who wants to '{metadata.get('job_to_be_done', 'understand key topics')}'. Structure your script with an introduction, a body that weaves the insights into a cohesive story, and a conclusion. Respond ONLY with the text of the podcast script.\n\nData: {json.dumps(llm_insights, indent=2)}"
    payload = {"contents": [{"parts": [{"text": prompt}]}]}
    response_json = await call_gemini_api(payload)
    return response_json['candidates'][0]['content']['parts'][0]['text']

async def translate_text_gemini(text: str, target_language: str) -> str:
    language_name = SUPPORTED_LANGUAGES.get(target_language)
    if not language_name: return "Error: Unsupported language."
    prompt = f"Translate the following text into {language_name}. Provide only the translated text.\n\n---\n\n{text}"
    payload = {"contents": [{"parts": [{"text": prompt}]}]}
    response_json = await call_gemini_api(payload)
    return response_json['candidates'][0]['content']['parts'][0]['text']

@app.post("/generate-podcast/")
async def generate_podcast_endpoint(request: PodcastRequest, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    lang = request.language
    if lang not in SUPPORTED_LANGUAGES:
        raise HTTPException(status_code=400, detail=f"Unsupported language '{lang}'.")
    script = await generate_podcast_summary_script(request.analysis_data)
    if "Error:" in script or not script:
        raise HTTPException(status_code=500, detail=script or "Failed to generate podcast script.")
    final_script = script
    if lang != "en":
        translated_script = await translate_text_gemini(script, lang)
        if "Error:" in translated_script or not translated_script:
            raise HTTPException(status_code=500, detail=translated_script or "Failed to translate script.")
        final_script = translated_script
    output_filename = f"temp_{uuid.uuid4()}.mp3"
    tts_provider = os.environ.get("TTS_PROVIDER", "offline")
    success = text_to_speech_azure(final_script, output_filename, language=lang) if tts_provider == 'azure' else text_to_speech_offline(final_script, output_filename)
    if not success:
        if os.path.exists(output_filename): os.remove(output_filename)
        raise HTTPException(status_code=500, detail="Failed to synthesize audio.")
    background_tasks.add_task(os.remove, output_filename)
    return FileResponse(path=output_filename, media_type='audio/mpeg', filename=f"podcast_summary_{lang}.mp3")

# --- TTS Functions ---
def text_to_speech_azure(text: str, output_filename: str, language: str = "en"):
    speech_key = os.environ.get("AZURE_TTS_KEY")
    service_region_endpoint = os.environ.get("AZURE_TTS_ENDPOINT")
    if not speech_key or not service_region_endpoint: return False
    try:
        region = service_region_endpoint.split('.')[0].replace('https://', '')
        voice_name = AZURE_VOICE_MAP.get(language, AZURE_VOICE_MAP["en"])
        speech_config = speechsdk.SpeechConfig(subscription=speech_key, region=region)
        speech_config.speech_synthesis_voice_name = voice_name
        audio_config = speechsdk.audio.AudioOutputConfig(filename=output_filename)
        synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config, audio_config=audio_config)
        result = synthesizer.speak_text_async(text).get()
        return result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted
    except Exception as e:
        print(f"❌ Error with Azure TTS: {e}")
        return False

def text_to_speech_offline(text: str, output_filename: str):
    try:
        engine = pyttsx3.init()
        engine.save_to_file(text, output_filename)
        engine.runAndWait()
        return True
    except Exception as e:
        print(f"❌ Error with offline TTS: {e}")
        return False

# ==============================================================================
# React Static Files & Catch-all Route (MUST BE LAST)
# ==============================================================================
# This serves the static files for the React frontend
app.mount("/static", StaticFiles(directory="../Frontend/build/static"), name="static")

# This serves the user-uploaded session files (PDFs)
app.mount("/session_files", StaticFiles(directory=SESSION_FILES_DIR), name="session_files")


@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    """
    Serves the React app. Catches all paths not matched by API routes.
    """
    build_dir = os.path.join("frontend", "build")
    file_path = os.path.join(build_dir, full_path)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    index_path = os.path.join(build_dir, "index.html")
    return FileResponse(index_path)

@app.get("/")
def read_root():
    # This will now be handled by the catch-all route, but it's good practice
    # to have a root endpoint for API health checks.
    index_path = os.path.join("frontend", "build", "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"status": "ok", "version": app.version}