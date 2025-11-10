# file: main.py
import uvicorn
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
# Line 2 ke neeche add karein
from fastapi import HTTPException
import sys
# --- Yeh Imports Missing Hain ---
import requests
import bcrypt
import json
import os
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Any
from jose import JWTError, jwt
from dotenv import load_dotenv

# (Yeh ensure karein ki .env file load ho)
load_dotenv()

GOOGLE_SHEET_WEBHOOK = os.getenv("GOOGLE_SHEET_WEBHOOK")
JWT_SECRET = os.getenv("JWT_SECRET", "farozazeezsecret")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

# Assume rag_core is in the same directory
try:
    from rag_model import load_knowledge_base, get_feroze_response
except ImportError:
    print("Error: Could not import functions from rag_core.py.")
    print("Please ensure rag_core.py is in the same folder.")
    sys.exit(1)


# --- 1. FastAPI App Initialization ---
app = FastAPI()


# --- In-memory chat history storage ---
# (Yeh ek dictionary hai jo har user ke email ke saath unki chat list store karegi)
chat_histories: Dict[str, List[Dict[str, str]]] = {}
CHAT_HISTORY_LIMIT = 10 # Aakhiri 10 messages yaad rakhega



# --- 2. CORS (Cross-Origin Resource Sharing) Setup ---
# Yeh zaroori hai! Aapka frontend ek alag address par chalta hai 
# aur backend alag address par. CORS inhein aapas mein baat karne deta hai.
origins = [
    # Aapka React app jis address par chalta hai
    "http://localhost:8080",
    "http://localhost:3000", 
    "http://127.0.0.1:3000",
    # Agar aap Lovable ke preview URL se test kar rahe hain
    # (Agar aapka frontend kisi aur port par chalta hai to use bhi add karein)
 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    # --- THIS LINE IS THE FIX ---
    allow_headers=["*","Authorization"],
)

# --- 3. Knowledge Base Loading ---
# Server start hote hi knowledge base load karein
print("Loading Knowledge Base (FAISS, Embeddings)...")
try:
    retriever = load_knowledge_base()
    print("Knowledge Base Loaded Successfully. Groq API is ready.")
except Exception as e:
    print(f"FATAL ERROR loading KB: {e}")
    sys.exit(1)


# -------------------------------
# Models (Pydantic) - (Merged)
# -------------------------------
class RegisterRequest(BaseModel):
    Email: str
    Password: str
    Name: str

class LoginRequest(BaseModel):
    Email: str
    Password: str

# --- 4. Define Request Body ---
# Yeh batata hai ki frontend se kaisa data (JSON) aayega
class ChatRequest(BaseModel):
    question: str
    # Agar aapne personalization rakha hota toh yahaan ek 'user_name: str' bhi hota


# --- 5. Define Response Body (Simple Text Response) ---
# Front end ko kaisa data waapis bhejna hai
class ChatResponse(BaseModel):
    answer: str




# -------------------------------
# Utility Functions (Merged)
# -------------------------------

def normalize_email(email: str) -> str:
    """Standardize email formatting."""
    return (email or "").strip().lower()

# (Using File 1's version - it's better as it accepts `params`)
def get_sheet_data(sheet_name: str, params: Optional[Dict[str, str]] = None) -> List[Dict[str, str]]:
    """Fetch all rows from a specified Google Sheet via webhook."""
    try:
        url = f"{GOOGLE_SHEET_WEBHOOK}?sheet={sheet_name}"
        
        # Extra parameters (jaise session_id) add karne ke liye
        if params:
            url_params = "&".join([f"{k}={v}" for k, v in params.items()])
            url += "&" + url_params

        res = requests.get(url, timeout=10)
        res.raise_for_status()
        
        response_json = res.json()
        
        if response_json.get("status") == "success":
            return response_json.get("data", []) 
        else:
            raise Exception(response_json.get('message', 'Unknown Apps Script Error')) 
            
    except Exception as e:
        print(f"Error fetching {sheet_name}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch {sheet_name} data. Error: {str(e)}")

# (Using File 1's version - good logging)
def append_to_sheet(sheet_name: str, data: Dict[str, Any]):
    """
    Append or update data to a specific Google Sheet via Google Apps Script Webhook.
    """
    try:
        url = f"{GOOGLE_SHEET_WEBHOOK}?sheet={sheet_name}"
        headers = {"Content-Type": "application/json"}
        clean_data = {k: (v if v is not None else "") for k, v in data.items()}

        print("➡️ Sending data to Google Sheet...")
        print(f"📄 Sheet Name: {sheet_name}")
        print(f"📦 Data: {clean_data}")

        res = requests.post(url, json=clean_data, headers=headers, timeout=10)
        print(f"📨 Raw Response: {res.text}")
        res.raise_for_status()

        try:
            result = res.json()
        except Exception as parse_err:
            print("⚠️ Could not parse JSON:", parse_err)
            return {"status": "error", "message": res.text}

        if result.get("status") == "success":
            print(f"✅ Successfully appended data to '{sheet_name}'.")
        else:
            print(f"⚠️ Google Sheet responded with: {result}")
        return result

    except Exception as e:
        print(f"❌ Error appending to {sheet_name}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to append data to '{sheet_name}' sheet. {e}"
        )

# (From File 2)
def update_sheet_row(sheet_name: str, key_column: str, key_value: str, update_values: Dict[str, Any]):
    """
    Update an existing row in Google Sheet (using Apps Script webhook).
    """
    try:
        url = f"{GOOGLE_SHEET_WEBHOOK}?sheet={sheet_name}&mode=update"
        headers = {"Content-Type": "application/json"}
        payload = {
            "keyColumn": key_column,
            "key": key_value,
            "updateValues": update_values
        }
        print(f"➡️ Updating Google Sheet Row: {sheet_name}")
        res = requests.post(url, json={"data": json.dumps(payload)}, headers=headers, timeout=10)
        print(f"📨 Raw Response: {res.text}")
        res.raise_for_status()
        result = res.json()
        if result.get("status") == "success":
            print(f"✅ Successfully updated row in '{sheet_name}'.")
        else:
            print(f"⚠️ Google Sheet responded with: {result}")
        return result
    except Exception as e:
        print(f"❌ Error updating {sheet_name}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update row in '{sheet_name}' sheet. {e}"
        )

# --- Common Auth Functions ---
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False

def create_jwt(email: str) -> str:
    payload = {"email": email, "exp": datetime.utcnow() + timedelta(days=1)}
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token.decode("utf-8") if isinstance(token, bytes) else token

def find_user_by_email(email: str) -> Optional[Dict[str, str]]:
    email = normalize_email(email)
    users = get_sheet_data("users")
    for u in users:
        if normalize_email(u.get("Email") or "") == email:
            return u
    return None

def format_history_for_prompt(history: List[Dict[str, str]]) -> str:
    """Formats the chat history for the LLM prompt."""
    if not history:
        return "No previous conversation."
    
    formatted_lines = []
    # Aakhiri 'CHAT_HISTORY_LIMIT' messages ko lein
    for msg in history[-CHAT_HISTORY_LIMIT:]:
        role = "User" if msg.get("role") == "user" else "Feroze AI"
        formatted_lines.append(f"{role}: {msg.get('content')}")
    
    return "\n".join(formatted_lines)

# Dependency for checking token
from fastapi import Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

oauth2_scheme = HTTPBearer()

async def get_current_user(token: HTTPAuthorizationCredentials = Depends(oauth2_scheme)):
    """Validates the JWT token and returns the user's email."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token_str = token.credentials
        payload = jwt.decode(token_str, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        email: str = payload.get("email")
        if email is None:
            raise credentials_exception
        
        return email # User ka email (session key) return karein
        
    except JWTError:
        raise credentials_exception



@app.post("/register")
async def register_user(req: RegisterRequest):
    Email = normalize_email(req.Email)
    existing = find_user_by_email(Email)
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    hashed_pw = hash_password(req.Password)
    user_data = {
        "Name": req.Name,
        "Email": Email,
        "Password_Hash": hashed_pw,
        "Created_At": datetime.now().strftime("%Y-%m-%d %H:%M")
    }
    append_to_sheet("users", user_data)
    return {"message": "✅ Registration successful", "user": {"Name": req.Name, "Email": Email}}

@app.post("/login")
def login_user(req: LoginRequest):
    email = normalize_email(req.Email)
    user = find_user_by_email(email)
    if not user or not verify_password(req.Password, user.get("Password_Hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_jwt(email)
    return {
        "message": "✅ Login successful",
        "token": token,
        "user": {"Name": user.get("Name"), "Email": email}
    }


# --- 6. The API Endpoint ---
# Frontend iss address ko call karega: http://localhost:8000/api/chat
# --- 6. The API Endpoint ---
# (Is poore function ko replace karein)
@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(
    request: ChatRequest, 
    current_user: str = Depends(get_current_user) # <-- YEH HAI ZAROORI FIX
):
    """
    Handles the RAG process for the incoming user question.
    Only accessible by logged-in users.
    """
    user_question = request.question
    print(f"--> Received question from: {current_user}") # Ab 'current_user' defined hai

    # 1. User ki puraani history nikaalein
    # (Aapne 'current_user' ko as a key use kiya hai)
    user_history = chat_histories.get(current_user, [])
    
    # 2. History ko prompt ke liye format karein
    history_str = format_history_for_prompt(user_history)
    
    # 3. RAG function ko call karein (history ke saath)
    # (Ensure karein ki rag_model.py mein bhi function 3 arguments leta hai)
    response_text = get_feroze_response(user_question, retriever, history_str)

    # 4. Naye message ko history mein save karein
    user_history.append({"role": "user", "content": user_question})
    user_history.append({"role": "assistant", "content": response_text})
    
    # 5. History ko update karein (limit mein rakhein)
    chat_histories[current_user] = user_history[-CHAT_HISTORY_LIMIT:]
    
    print(f"<-- Sending answer: {response_text}")
    
    # Response JSON format mein waapis bhejein
    return ChatResponse(answer=response_text)

# --- 7. Main Runner (Server Start) ---
if __name__ == "__main__":
    # Server port 8000 par chalaayein
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)