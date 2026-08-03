import chess
import chess.engine
import logging
from engine.stockfish_engine import StockfishEngine

logger = logging.getLogger(__name__)

# Valid UCI_Elo range Stockfish supports
MIN_ELO = 1320
MAX_ELO = 3190

LEVEL_ELO = {
    800:  1320,
    1200: 1320,
    1600: 1600,
    2000: 2000,
    2400: 2400,
    2800: 3190,
}


class GameService:
    """
    Handles move generation for play-vs-engine mode.
    Spins up its own dedicated StockfishEngine instance so it
    never contends with the analysis EnginePool.
    """

    def __init__(self):
        self._engine = StockfishEngine()

    def get_engine_move(self, fen: str, elo: int, hint_only: bool = False) -> dict:
        try:
            board = chess.Board(fen)
        except ValueError:
            raise ValueError(f"Invalid FEN: {fen}")

        if board.is_game_over():
            raise ValueError("Game is already over.")

        clamped_elo = max(MIN_ELO, min(MAX_ELO, LEVEL_ELO.get(elo, elo)))

        with self._engine._lock:
            self._engine._engine.configure({
                "UCI_LimitStrength": True,
                "UCI_Elo": clamped_elo,
            })

            result = self._engine._engine.play(
                board,
                chess.engine.Limit(time=5.0),
            )

            # Reset to full strength so the shared engine config isn't polluted
            self._engine._engine.configure({
                "UCI_LimitStrength": False,
            })

        move = result.move
        if move is None:
            raise RuntimeError("Engine returned no move.")

        return {
            "move":      move.uci(),
            "from":      move.uci()[:2],
            "to":        move.uci()[2:4],
            "promotion": move.uci()[4] if len(move.uci()) > 4 else None,
        }

    def close(self):
        self._engine.close()