from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

router = APIRouter()

# Load model once
model = SentenceTransformer('paraphrase-MiniLM-L6-v2')

class EmbedRequest(BaseModel):
    text: str

@router.post("/")
async def embed_text(req: EmbedRequest):
    if not req.text or req.text.strip() == "":
        raise HTTPException(status_code=400, detail="Text must be a non-empty string")
    try:
        embeddings = model.encode(req.text)
        return {"embedding": embeddings.tolist()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding generation failed: {str(e)}")
