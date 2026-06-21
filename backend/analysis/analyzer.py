#analysis\analyzer.py
'''from dataclasses import dataclass
import chess
from analysis.classifier import classify_move
from engine.stockfish_engine import StockfishEngine
from game.pgn_handler import PGNHandler


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
    top_moves: list


class Analyzer:
    def __init__(self, engine: StockfishEngine):
        self.engine = engine

    def analyze_game(self, pgn_handler: PGNHandler):
        board = chess.Board()
        analyses = []
        move_number = 1

        for move in pgn_handler.get_moves():
            side = "white" if board.turn == chess.WHITE else "black"

            # 🔥 SINGLE ENGINE CALL (IMPORTANT)
            #best_move, best_eval = self.engine.get_best_move(board)
            top_moves = self.engine.analyze_top_moves(board, multipv=3)

            best_move = top_moves[0]["move"]
            best_eval = top_moves[0]["score"]

            # Play user move
            board.push(move)

            played_eval = self.engine.evaluate_position(board)

            # ✅ Correct evaluation difference
            cp_loss = max(0, best_eval - played_eval)

            top_moves_serialized = [
                {
                    "move": m["move"].uci(),
                    "score": m["score"]
                }
                for m in top_moves
            ]

            analyses.append(
                MoveAnalysis(
                    move_number=move_number,
                    side=side,
                    played_move=move.uci(),
                    best_move=best_move.uci() if best_move else None,
                    eval_before=best_eval,
                    eval_after=played_eval,
                    centipawn_loss=cp_loss,
                    classification=classify_move(cp_loss, best_eval, played_eval),
                    top_moves=top_moves_serialized
                    
                )
            )

            if side == "black":
                move_number += 1

        return analyses'''
import chess
from analysis.classifier import classify_move
from engine.stockfish_engine import StockfishEngine
from game.pgn_handler import PGNHandler
from analysis.models import MoveAnalysis, EngineInfo


class Analyzer:
    def __init__(self, engine: StockfishEngine):
        self.engine = engine

    def analyze_game(self, pgn_handler: PGNHandler):
        board = chess.Board()
        analyses = []
        move_number = 1

        for move in pgn_handler.get_moves():

            side = "white" if board.turn == chess.WHITE else "black"

            # 1. Engine analysis on current position
            top_moves = self.engine.analyze_top_moves(board, multipv=3)

            best_move = top_moves[0]["move"]
            eval_before = top_moves[0]["score"]

            # 2. Play move
            board.push(move)

            # 3. Evaluate new position
            eval_after = self.engine.evaluate_position(board)

            # 4. CP loss (clean version)
            cp_loss = max(0, eval_before - eval_after)
            cp_loss = round(cp_loss / 5) * 5

            # 5. Classification
            classification = classify_move(cp_loss, eval_before, eval_after)


            # 6. Engine info (optional)
            engine_info = EngineInfo(
                top_moves=top_moves
            )

            # 7. Final object
            analyses.append(
                MoveAnalysis(
                    move_number=move_number,
                    side=side,
                    played_move=move.uci(),
                    best_move=best_move,
                    eval_before=eval_before,
                    eval_after=eval_after,
                    centipawn_loss=cp_loss,
                    classification=classification,
                    engine_info=engine_info
                )
            )

            if side == "black":
                move_number += 1

        return analyses