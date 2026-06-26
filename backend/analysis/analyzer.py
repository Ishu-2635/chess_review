import os
import chess
import chess.polyglot

from analysis.classifier import (
    classify_move,
    compute_material_delta,
    MoveContext,
)
from analysis.models import MoveAnalysis, EngineInfo
from engine.stockfish_engine import StockfishEngine
from game.pgn_handler import PGNHandler

BOOK_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "openings.bin")


class Analyzer:
    def __init__(self, engine: StockfishEngine):
        self.engine = engine
        self._book  = None
        if os.path.exists(BOOK_PATH):
            self._book = chess.polyglot.open_reader(BOOK_PATH)

    def _is_book_move(self, board: chess.Board, move: chess.Move) -> bool:
        if self._book is None:
            return False
        try:
            return any(entry.move == move for entry in self._book.find_all(board))
        except KeyError:
            return False

    def analyze_game(self, pgn_handler: PGNHandler) -> list[MoveAnalysis]:
        board       = chess.Board()
        analyses    = []
        move_number = 1

        for move in pgn_handler.get_moves():
            side    = "white" if board.turn == chess.WHITE else "black"
            is_book = self._is_book_move(board, move)

            if is_book:
                # Skip engine calls entirely for book moves.
                board.push(move)
                analyses.append(MoveAnalysis(
                    move_number    = move_number,
                    side           = side,
                    played_move    = move.uci(),
                    best_move      = move.uci(),  # book move IS the best move
                    eval_before    = 0,
                    eval_after     = 0,
                    centipawn_loss = 0,
                    classification = "book",
                    engine_info    = EngineInfo(top_moves=[]),
                ))
            else:
                pre             = self.engine.analyse_position(board, multipv=3)
                best_eval_mover = pre.score_as_cp

                # Step 2: material delta BEFORE pushing 
                captured_piece = None
                if board.is_capture(move):
                    victim = board.piece_at(move.to_square)
                    if victim:
                        captured_piece = victim.symbol().lower()

                material_delta = compute_material_delta(
                    captured_piece = captured_piece,
                    promoted_to    = chess.piece_symbol(move.promotion) if move.promotion else None,
                    is_en_passant  = board.is_en_passant(move),
                )

                # Step 3: push the played move 
                board.push(move)

                #  Step 4: analyse position AFTER the move 
                post              = self.engine.analyse_position(board, multipv=3)
                played_eval_mover = -post.score_as_cp

                #  Step 5: cp_loss 
                cp_loss = max(0, best_eval_mover - played_eval_mover)

                #  Step 6: classify 
                ctx = MoveContext(
                    cp_loss        = cp_loss,
                    eval_before    = best_eval_mover,
                    eval_after     = played_eval_mover,
                    material_delta = material_delta,
                    is_book        = False,
                )
                result = classify_move(ctx)

                analyses.append(MoveAnalysis(
                    move_number    = move_number,
                    side           = side,
                    played_move    = move.uci(),
                    best_move      = pre.best_move,
                    eval_before    = best_eval_mover,
                    eval_after     = played_eval_mover,
                    centipawn_loss = cp_loss,
                    classification = result.classification.value,
                    engine_info    = EngineInfo(top_moves=pre.top_moves),
                ))

            if side == "black":
                move_number += 1

        return analyses

    def close(self):
        if self._book:
            self._book.close()