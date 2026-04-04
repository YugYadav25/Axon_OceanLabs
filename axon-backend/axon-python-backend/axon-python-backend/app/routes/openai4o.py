from fastapi import APIRouter
from pydantic import BaseModel
import os
from openai import OpenAI

router = APIRouter()

# Using GitHub AI Inference Endpoint
token = os.environ["GITHUB_TOKEN"]
endpoint = "https://models.github.ai/inference"
model_name = "openai/gpt-4o"

# OpenAI client setup with GitHub proxy
client = OpenAI(
    base_url=endpoint,
    api_key=token,
)

# Input schemas
class PromptRequest(BaseModel):
    prompt: str

# Existing endpoint
@router.post("/generate-architecture")
async def generate_architecture(req: PromptRequest):
    try:
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": req.prompt},
            ],
            temperature=1.0,
            top_p=1.0,
            max_tokens=1000,
            model=model_name,
        )
        return {"success": True, "response": response.choices[0].message.content}
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/onboard")
async def generate_summary(req: PromptRequest):
    try:
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a helpful assistant. Answer clearly and concisely."},
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
