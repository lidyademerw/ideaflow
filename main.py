from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, HTTPException, status
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

import database


@asynccontextmanager
async def lifespan(app: FastAPI):
    database.init_db()
    yield


app = FastAPI(lifespan=lifespan)


class IdeaCreate(BaseModel):
    title: str
    description: str = ""
    start_date: str | None = None
    end_date: str | None = None


class StatusUpdate(BaseModel):
    status: str


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


app.mount("/", StaticFiles(directory="static", html=True), name="static")
