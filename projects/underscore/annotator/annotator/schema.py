from typing import Literal

from pydantic import BaseModel, Field

Mood = Literal[
    "joyful",
    "melancholy",
    "tense",
    "anxious",
    "triumphant",
    "wistful",
    "dread",
    "serene",
    "ironic",
    "ambivalent",
]

Genre = Literal[
    "literary",
    "thriller",
    "romance",
    "mystery",
    "fantasy",
    "scifi",
    "horror",
]

Pace = Literal["slow", "moderate", "brisk", "frenetic"]


class PassageAnnotation(BaseModel):
    mood: Mood
    secondary_mood: Mood | None = Field(
        default=None,
        description="Set only if a clear secondary emotion sits alongside the primary one.",
    )
    tension: int = Field(ge=1, le=10, description="1 = calm, 10 = peak conflict")
    genre: Genre
    pace: Pace
