from fastapi import APIRouter
from pydantic import BaseModel
from openai import OpenAI
import os

router = APIRouter()

# GitHub AI Inference Setup
token = os.environ["GITHUB_TOKEN"]
endpoint = "https://models.github.ai/inference"
model_name = "openai/gpt-4o-mini"

client = OpenAI(
    base_url=endpoint,
    api_key=token,
)

class AnalyzePrompt(BaseModel):
    prompt: str

@router.post("/analyze")
async def analyze(req: AnalyzePrompt):
    try:
        response = client.chat.completions.create(
            
            messages=[
                {"role": "system", "content": "You are a code analysis expert. Analyze the code and suggest improvements."},
                {"role": "user", "content": req.prompt}
            ],
            temperature=0.7,
            top_p=1.0,
            max_tokens=800,
            model=model_name,
        )

        content = ""
        if response.choices and response.choices[0].message and response.choices[0].message.content:
            content = response.choices[0].message.content.strip()

        return {
            "success": True,
            "suggestions": content or "No meaningful content returned."
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }