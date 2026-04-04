from fastapi import APIRouter
from pydantic import BaseModel
import os
from openai import OpenAI

router = APIRouter()

# Read secrets from environment variables
token = os.environ["GITHUB_TOKEN"]

endpoint = "https://models.github.ai/inference"
model_name = "openai/gpt-4o-mini"

# OpenAI client setup with GitHub proxy
client = OpenAI(
    base_url=endpoint,
    api_key=token,
)

class PromptRequest(BaseModel):
    prompt: str

@router.post("/summarize")
async def summarize(req: PromptRequest):
    
    if not token:
        return {"success": False, "error": "GITHUB_TOKEN not set"}
    
    try:
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": req.prompt},
            ],
            temperature=0.7,
            top_p=1.0,
            max_tokens=800,
            model=model_name,
        )
        return {"success": True, "summary": response.choices[0].message.content}
    except Exception as e:
        return {"success": False, "error": str(e)}