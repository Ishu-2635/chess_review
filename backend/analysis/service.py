import logging
from dataclasses import asdict

from game.pgn_handler import PGNHandler
from analysis.analyzer import Analyzer
from analysis.classifier import GameStats, ClassificationResult, MoveClassification
from engine.stockfish_engine import StockfishEngine

logger = logging.getLogger(__name__)


class AnalysisService:
    def __init__(self):
        self.engine = StockfishEngine()
        self.analyzer = Analyzer(self.engine)

    def analyze_pgn_text(self, pgn_text: str) -> dict:
        pgn = PGNHandler()
        pgn.load_pgn_from_string(pgn_text)

        analyses = self.analyzer.analyze_game(pgn)

        white_stats = GameStats()
        black_stats = GameStats()

        moves_out = []
        for a in analyses:
            from analysis.classifier import (
                cp_to_win_probability,
                CLASSIFICATION_META,
            )
            cat = MoveClassification(a.classification)
            meta = CLASSIFICATION_META[cat]
            wp_before = cp_to_win_probability(a.eval_before)
            wp_after  = cp_to_win_probability(a.eval_after)

            cr = ClassificationResult(
                classification=cat,
                symbol=meta["symbol"],
                color=meta["color"],
                cp_loss=a.centipawn_loss,
                eval_before=a.eval_before,
                eval_after=a.eval_after,
                wp_before=wp_before,
                wp_after=wp_after,
                wp_delta=wp_after - wp_before,
                explanation="",
            )

            if a.side == "white":
                white_stats.record(cr)
            else:
                black_stats.record(cr)

            move_dict = {
                "move_number":    a.move_number,
                "side":           a.side,
                "played_move":    a.played_move,
                "best_move":      a.best_move,
                "eval_before":    a.eval_before,
                "eval_after":     a.eval_after,
                "centipawn_loss": a.centipawn_loss,
                "classification": a.classification,
                "symbol":         meta["symbol"],
                "color":          meta["color"],
                "wp_before":      round(wp_before, 4),
                "wp_after":       round(wp_after, 4),
                "wp_delta":       round(wp_after - wp_before, 4),
                "top_moves":      a.engine_info.top_moves if a.engine_info else [],
            }

            moves_out.append(move_dict)

        return {
            "total_moves": len(analyses),
            "white":       white_stats.to_dict(),
            "black":       black_stats.to_dict(),
            "moves":       moves_out,
        }

    def close(self):
        self.engine.close()