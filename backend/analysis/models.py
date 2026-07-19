from typing import List, Optional
from pydantic import BaseModel


class EngineInfo(BaseModel):
    top_moves: List[str] = []


class MoveAnalysis(BaseModel):
    move_number:       int
    side:              str
    played_move:       str
    best_move:         str

    eval_before:       int   
    eval_after:        int  
    eval_before_white: int   
    eval_after_white:  int  

    mate_before: Optional[int] = None  
    mate_after:  Optional[int] = None 

    centipawn_loss: int
    sacrifice_cp:   int = 0
    engine_depth:   int = 0  # actual search depth reached; 

    classification: str
    explanation:    str
    symbol:         str
    color:          str

    wp_before: float
    wp_after:  float
    wp_delta:  float

    engine_info: Optional[EngineInfo] = None
