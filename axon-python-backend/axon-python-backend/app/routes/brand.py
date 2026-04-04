from fastapi import APIRouter
from pydantic import BaseModel
import os
from openai import OpenAI

router = APIRouter()

# GitHub-hosted OpenAI proxy endpoint
token = os.environ["GITHUB_TOKEN"]
endpoint = "https://models.github.ai/inference"
model_name = "openai/gpt-4o-mini"

client = OpenAI(
    base_url=endpoint,
    api_key=token,
)

class PromptRequest(BaseModel):
    prompt: str

@router.post("/resume")
async def generate_resume_bullets(req: PromptRequest):
    try:
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a senior technical resume writer."},
                {"role": "user", "content": req.prompt},
            ],
            temperature=0.7,
            top_p=1.0,
            max_tokens=1400,
            model=model_name,
        )

        content = response.choices[0].message.content

        # Parse bullet points: extract lines that start with "-", "•", or numbered points
        lines = content.strip().split("\n")
        bullets = [
            line.strip("-•*1234567890. ").strip()
            for line in lines
            if line.strip() and (line.lstrip().startswith(("-", "•")) or line.strip()[0].isdigit())
        ]

        return { "bullets": bullets }

    except Exception as e:
        return { "error": str(e) }