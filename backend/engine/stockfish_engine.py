import os
import threading
from typing import Optional

import chess
import chess.engine
from cachetools import LRUCache
from config import STOCKFISH_PATH, ENGINE_TIME_LIMIT, ENGINE_DEPTH
CACHE_SIZE       = int(os.environ.get("ENGINE_CACHE_SIZE", "256"))

MATE_SCORE = 30_000


class PositionResult:
    def __init__(
        self,
        best_move: str,
        score_as_cp: int,
        top_moves: list[dict],
    ):
        self.best_move   = best_move
        self.score_as_cp = score_as_cp  # centipawns, mover's POV. Mate encoded as ±MATE_SCORE.
        self.top_moves   = top_moves    # [{"move": uci_str, "score_cp": int}]


def _encode_score(score: chess.engine.PovScore) -> int:
    relative = score.relative
    mate_in  = relative.mate()
    if mate_in is not None:
        return (MATE_SCORE - abs(mate_in)) * (1 if mate_in > 0 else -1)
    return relative.score()


class StockfishEngine:
    def __init__(self):
        self._engine = chess.engine.SimpleEngine.popen_uci(STOCKFISH_PATH)
        self._lock   = threading.Lock()
        self._cache: LRUCache = LRUCache(maxsize=CACHE_SIZE)

    def analyse_position(self, board: chess.Board, multipv: int = 3) -> PositionResult:
        fen = board.fen()

        with self._lock:
            if fen in self._cache:
                return self._cache[fen]

            infos = self._engine.analyse(
                board,
                chess.engine.Limit(time=ENGINE_TIME_LIMIT, depth=ENGINE_DEPTH),
                multipv=multipv,
            )

            top_moves = []
            for info in infos:
                if "pv" not in info or not info["pv"]:
                    continue
                top_moves.append({
                    "move":     info["pv"][0].uci(),
                    "score_cp": _encode_score(info["score"]),
                })
            if not top_moves:
                result = PositionResult(
                    best_move   = "",
                    score_as_cp = 0,
                    top_moves   = [],
                )
            else:
                result = PositionResult(
                    best_move   = top_moves[0]["move"],
                    score_as_cp = top_moves[0]["score_cp"],
                    top_moves   = top_moves,
                    
                )
            self._cache[fen] = result
            return result

    def close(self):
        with self._lock:
            self._engine.quit()