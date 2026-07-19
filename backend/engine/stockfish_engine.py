import logging
import queue
import threading
from contextlib import contextmanager
from typing import Optional

import chess
import chess.engine
from cachetools import LRUCache

from config import (
    STOCKFISH_PATH,
    ENGINE_DEPTH,
    ENGINE_TIME_CEILING,
    ENGINE_THREADS,
    ENGINE_HASH_MB,
    ENGINE_MULTIPV,
    ENGINE_POOL_SIZE,
    ENGINE_CACHE_SIZE,
)

logger = logging.getLogger(__name__)

MATE_SCORE = 30_000


class PositionResult:
    def __init__(
        self,
        best_move: str,
        score_as_cp: int,
        mate_in: Optional[int],
        top_moves: list[dict],
        depth_reached: int = 0,
    ):
        self.best_move     = best_move
        self.score_as_cp   = score_as_cp  
        self.mate_in       = mate_in     
        self.top_moves     = top_moves  
        self.depth_reached = depth_reached 


def _decode_score(score: chess.engine.PovScore) -> tuple[int, Optional[int]]:
    relative = score.relative
    mate_in  = relative.mate()
    if mate_in is not None:
        cp = (MATE_SCORE - abs(mate_in)) * (1 if mate_in > 0 else -1)
        return cp, mate_in
    return relative.score(), None


def _terminal_result(board: chess.Board) -> PositionResult:
    if board.is_check():
        return PositionResult(best_move="", score_as_cp=-MATE_SCORE, mate_in=0, top_moves=[], depth_reached=ENGINE_DEPTH)
    return PositionResult(best_move="", score_as_cp=0, mate_in=None, top_moves=[], depth_reached=ENGINE_DEPTH)


class StockfishEngine:
    def __init__(self):
        if not STOCKFISH_PATH:
            raise RuntimeError(
                "Stockfish binary not found. Set the STOCKFISH_PATH environment "
                "variable to the engine executable, or install stockfish so it "
                "is available on PATH."
            )
        self._engine = chess.engine.SimpleEngine.popen_uci(STOCKFISH_PATH)
        self._engine.configure({"Threads": ENGINE_THREADS, "Hash": ENGINE_HASH_MB})
        self._lock  = threading.Lock()
        self._cache: LRUCache = LRUCache(maxsize=ENGINE_CACHE_SIZE)

    def analyse_position(self, board: chess.Board, multipv: int = ENGINE_MULTIPV) -> PositionResult:
        if not board.legal_moves:
            return _terminal_result(board)

        cache_key = (board.fen(), multipv)

        with self._lock:
            cached = self._cache.get(cache_key)
            if cached is not None:
                return cached

            limit = chess.engine.Limit(depth=ENGINE_DEPTH, time=ENGINE_TIME_CEILING)
            infos = self._engine.analyse(board, limit, multipv=multipv)

            top_moves = []
            depth_reached = 0
            for info in infos:
                if "pv" not in info or not info["pv"] or "score" not in info:
                    continue
                cp, mate_in = _decode_score(info["score"])
                top_moves.append({
                    "move":     info["pv"][0].uci(),
                    "score_cp": cp,
                    "mate_in":  mate_in,
                })
                depth_reached = max(depth_reached, info.get("depth", 0))

            if depth_reached and depth_reached < ENGINE_DEPTH:
                logger.warning(
                    "Search stopped at depth %d (target %d) for %s - the time "
                    "ceiling (ENGINE_TIME_CEILING) cut it short. Every cp_loss/"
                    "accuracy figure derived from this position is shallower "
                    "than intended; raise ENGINE_TIME_CEILING if this recurs.",
                    depth_reached, ENGINE_DEPTH, board.fen(),
                )

            if not top_moves:
                result = PositionResult(best_move="", score_as_cp=0, mate_in=None, top_moves=[], depth_reached=depth_reached)
            else:
                result = PositionResult(
                    best_move     = top_moves[0]["move"],
                    score_as_cp   = top_moves[0]["score_cp"],
                    mate_in       = top_moves[0]["mate_in"],
                    top_moves     = top_moves,
                    depth_reached = depth_reached,
                )
            self._cache[cache_key] = result
            return result

    def close(self):
        with self._lock:
            self._engine.quit()


class EnginePool:
    """
    A small set of warm Stockfish processes handed out to concurrent
    analysis requests, so one long game analysis doesn't block every
    other user behind a single engine and a single lock.
    """

    def __init__(self, size: int = ENGINE_POOL_SIZE):
        if size < 1:
            raise ValueError("Engine pool size must be at least 1.")
        self._engines = [StockfishEngine() for _ in range(size)]
        self._available: "queue.Queue[StockfishEngine]" = queue.Queue()
        for engine in self._engines:
            self._available.put(engine)

    @contextmanager
    def borrow(self):
        engine = self._available.get()
        try:
            yield engine
        finally:
            self._available.put(engine)

    def close(self):
        for engine in self._engines:
            engine.close()
