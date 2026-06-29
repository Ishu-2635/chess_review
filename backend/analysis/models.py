from typing import List, Optional
from pydantic import BaseModel


class EngineInfo(BaseModel):
    top_moves: List[str] = []


class MoveAnalysis(BaseModel):
    move_number:    int
    side:           str
    played_move:    str
    best_move:      str
    eval_before:    int
    eval_after:     int
    centipawn_loss: int
    classification: str
    engine_info:    Optional[EngineInfo] = None