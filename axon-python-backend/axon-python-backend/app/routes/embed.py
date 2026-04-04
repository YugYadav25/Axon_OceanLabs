import threading
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

_model = None
_model_lock = threading.Lock()


def _get_model():
    global _model
    if _model is None:
        with _model_lock:
            if _model is None:
                from sentence_transformers import SentenceTransformer

                _model = SentenceTransformer("paraphrase-MiniLM-L6-v2")
    return _model


class EmbedRequest(BaseModel):
    text: str


@router.post("/")
async def embed_text(req: EmbedRequest):
    if not req.text or req.text.strip() == "":
        raise HTTPException(status_code=400, detail="Text must be a non-empty string")
    try:
        embeddings = _get_model().encode(req.text)
        return {"embedding": embeddings.tolist()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding generation failed: {str(e)}")
