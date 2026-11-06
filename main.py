import os
from contextlib import asynccontextmanager
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, status
from fastapi.staticfiles import StaticFiles
from google import genai
from pydantic import BaseModel, Field

import database

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    database.init_db()
    yield


app = FastAPI(lifespan=lifespan)


class IdeaCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=60)
    description: str = Field("", max_length=500)
    start_date: str | None = None
    end_date: str | None = None


class StatusUpdate(BaseModel):
    status: str


class FixRequest(BaseModel):
    text: str


@app.get("/api/ideas")
def get_ideas() -> list[dict[str, Any]]:
    return database.get_all_ideas()


@app.post("/api/ideas", status_code=status.HTTP_201_CREATED)
def create_new_idea(idea: IdeaCreate) -> dict[str, Any]:
    return database.create_idea(
        idea.title,
        idea.description,
        idea.start_date,
        idea.end_date,
    )


@app.patch("/api/ideas/{idea_id}")
def update_status(idea_id: int, update: StatusUpdate) -> dict[str, Any]:
    updated_idea = database.update_idea_status(idea_id, update.status)
    if not updated_idea:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Idea not found",
        )
    return updated_idea


@app.delete("/api/ideas/{idea_id}")
def delete_existing_idea(idea_id: int) -> dict[str, str]:
    deleted = database.delete_idea(idea_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Idea not found",
        )
    return {"message": "Idea deleted successfully"}


@app.post("/api/ai/fix")
def fix_text(payload: FixRequest) -> dict[str, str]:
    if not payload.text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text cannot be empty",
        )

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GEMINI_API_KEY is not configured",
        )

    try:
        client = genai.Client(api_key=api_key)
        prompt = (
            "You are an expert editor. Fix all spelling, grammatical, punctuation, "
            "and phrasing errors in the provided text. Keep the original voice, tone, "
            "and formatting intact. Return ONLY the corrected text. Do NOT add preamble or explanations.\n\n"
            f"Text:\n{payload.text}"
        )
        response = client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=prompt,
        )
        fixed = response.text.strip() if response.text else payload.text
        return {"fixed_text": fixed}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gemini API error: {str(e)}",
        )


app.mount("/", StaticFiles(directory="static", html=True), name="static")
