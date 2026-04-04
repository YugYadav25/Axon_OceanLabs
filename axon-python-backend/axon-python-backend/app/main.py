import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "../../../.env"))

from fastapi import FastAPI
from app.routes import commit
from app.routes import embed
from app.routes import openai4o
from app.routes import hotspot
from app.routes import brand

app = FastAPI()


@app.get("/health")
def health():
    return {"status": "ok"}


# Include embed router
app.include_router(brand.router)
app.include_router(hotspot.router)
app.include_router(commit.router)
app.include_router(embed.router, prefix="/embed")
app.include_router(openai4o.router)


