from dataclasses import dataclass
from typing import List, Dict, Optional


@dataclass
class EngineInfo:
    """
    Optional engine debug data (NOT required for frontend UI)
    """
    top_moves: Optional[List[Dict]] = None


@dataclass
class MoveAnalysis:
    """
    Final cleaned analysis output for each move.
    This is your API contract.
    """

    move_number: int
    side: str

    played_move: str
    best_move: str

    eval_before: int
    eval_after: int

    centipawn_loss: int
    classification: str

    engine_info: Optional[EngineInfo] = None