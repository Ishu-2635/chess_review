import logging
import os

import chess.polyglot

from analysis.analyzer import Analyzer
from analysis.classifier import GameStats, MoveClassification, compute_game_accuracy, win_percent_white
from config import BOOK_PATH, ENGINE_POOL_SIZE
from engine.stockfish_engine import EnginePool
from game.pgn_handler import PGNHandler

logger = logging.getLogger(__name__)


def _open_book():
    if not os.path.exists(BOOK_PATH):
        logger.warning("Opening book not found at %s - book-move tagging disabled.", BOOK_PATH)
        return None
    try:
        return chess.polyglot.open_reader(BOOK_PATH)
    except Exception:
        logger.exception("Failed to open opening book at %s - book-move tagging disabled.", BOOK_PATH)
        return None


class AnalysisService:
    def __init__(self):
        self.pool = EnginePool(ENGINE_POOL_SIZE)
        self.book = _open_book()

    def analyze_pgn_text(self, pgn_text: str) -> dict:
        pgn = PGNHandler()
        pgn.load_pgn_from_string(pgn_text)

        with self.pool.borrow() as engine:
            analyzer = Analyzer(engine, self.book)
            analyses = analyzer.analyze_game(pgn)

        white_stats = GameStats()
        black_stats = GameStats()
        moves_out   = []

        accuracy_inputs    = []
        white_pov_win_pcts = []
        if analyses:
            first = analyses[0]
            mate_before_white = first.mate_before if first.side == "white" else (
                -first.mate_before if first.mate_before is not None else None
            )
            white_pov_win_pcts.append(win_percent_white(first.eval_before_white, mate_before_white))

        for a in analyses:
            stats = white_stats if a.side == "white" else black_stats
            stats.record(MoveClassification(a.classification), a.centipawn_loss, a.wp_delta)

            mate_after_white = a.mate_after if a.side == "white" else (-a.mate_after if a.mate_after is not None else None)
            is_book = a.classification == "book"
            accuracy_inputs.append(None if is_book else (a.side, a.wp_before * 100.0, a.wp_after * 100.0))
            white_pov_win_pcts.append(win_percent_white(a.eval_after_white, mate_after_white))

            moves_out.append({
                "move_number":       a.move_number,
                "side":              a.side,
                "played_move":       a.played_move,
                "best_move":         a.best_move,
                "eval_before":       a.eval_before,
                "eval_after":        a.eval_after,
                "eval_before_white": a.eval_before_white,
                "eval_after_white":  a.eval_after_white,
                "mate_before":       a.mate_before,
                "mate_after":        a.mate_after,
                "centipawn_loss":    a.centipawn_loss,
                "sacrifice_cp":      a.sacrifice_cp,
                "classification":    a.classification,
                "explanation":       a.explanation,
                "symbol":            a.symbol,
                "color":             a.color,
                "wp_before":         a.wp_before,
                "wp_after":          a.wp_after,
                "wp_delta":          a.wp_delta,
                "top_moves":         a.engine_info.top_moves if a.engine_info else [],
            })

        accuracy = compute_game_accuracy(accuracy_inputs, white_pov_win_pcts)
        white_dict = white_stats.to_dict()
        black_dict = black_stats.to_dict()
        white_dict["accuracy"] = accuracy["white"]
        black_dict["accuracy"] = accuracy["black"]

        return {
            "total_moves": len(analyses),
            "white":       white_dict,
            "black":       black_dict,
            "moves":       moves_out,
        }

    def close(self):
        self.pool.close()
        if self.book:
            self.book.close()
