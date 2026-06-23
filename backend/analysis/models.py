from dataclasses import dataclass
from typing import List, Dict, Optional


@dataclass
class EngineInfo:
    """
    Optional engine debug data 
    """
    top_moves: Optional[List[Dict]] = None


@dataclass
class MoveAnalysis:
   
    move_number: int
    side: str

    played_move: str
    best_move: str

    eval_before: int
    eval_after: int

    centipawn_loss: int
    classification: str

    engine_info: Optional[EngineInfo] = None