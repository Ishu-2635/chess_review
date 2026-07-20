from typing import Optional

import chess
import chess.polyglot

from analysis.classifier import (
    CLASSIFICATION_META,
    MoveClassification,
    MoveContext,
    classify_move,
    compute_material_gained,
    cp_to_win_probability,
    win_probability,
)
from analysis.exchange import find_new_hanging_material
from analysis.models import EngineInfo, MoveAnalysis
from config import BOOK_MAX_MOVE, CP_LOSS_DISPLAY_CAP, ENGINE_MULTIPV
from engine.stockfish_engine import StockfishEngine
from game.pgn_handler import PGNHandler


class Analyzer:
    def __init__(self, engine: StockfishEngine, book: Optional["chess.polyglot.MemoryMappedReader"] = None):
        self.engine = engine
        self._book  = book

    def _is_book_move(self, board: chess.Board, move: chess.Move) -> bool:
        if self._book is None:
            return False
        try:
            for entry in self._book.find_all(board):
                entry_move = entry.move() if callable(entry.move) else entry.move
                if entry_move == move:
                    return True
            return False
        except KeyError:
            return False

    def analyze_game(self, pgn_handler: PGNHandler) -> list[MoveAnalysis]:
        board       = pgn_handler.get_initial_board()
        analyses    = []
        move_number = 1
        last_eval   = 0     # mover-POV eval, carried forward through book moves

        for move in pgn_handler.get_moves():
            side        = "white" if board.turn == chess.WHITE else "black"
            mover_color = board.turn

            is_book = move_number <= BOOK_MAX_MOVE and self._is_book_move(board, move)

            if is_book:
                board.push(move)
                eval_white = last_eval if side == "white" else -last_eval
                wp         = round(cp_to_win_probability(last_eval), 4)
                meta       = CLASSIFICATION_META[MoveClassification.BOOK]

                analyses.append(MoveAnalysis(
                    move_number       = move_number,
                    side              = side,
                    played_move       = move.uci(),
                    best_move         = move.uci(),
                    eval_before       = last_eval,
                    eval_after        = last_eval,
                    eval_before_white = eval_white,
                    eval_after_white  = eval_white,
                    mate_before       = None,
                    mate_after        = None,
                    centipawn_loss    = 0,
                    sacrifice_cp      = 0,
                    classification    = MoveClassification.BOOK.value,
                    explanation       = "Opening theory — part of an established opening line.",
                    symbol            = meta["symbol"],
                    color             = meta["color"],
                    wp_before         = wp,
                    wp_after          = wp,
                    wp_delta          = 0.0,
                    engine_info       = EngineInfo(top_moves=[]),
                ))
                if side == "black":
                    move_number += 1
                continue

            pre             = self.engine.analyse_position(board, multipv=ENGINE_MULTIPV)
            best_eval_mover = pre.score_as_cp
            mate_in_before  = pre.mate_in

            captured_piece = None
            if board.is_capture(move):
                victim = board.piece_at(move.to_square)
                if victim:
                    captured_piece = victim.symbol().lower()

            material_gained = compute_material_gained(
                captured_piece = captured_piece,
                promoted_to    = chess.piece_symbol(move.promotion) if move.promotion else None,
                is_en_passant  = board.is_en_passant(move),
            )

            board_before = board.copy(stack=False)
            board.push(move)

            post              = self.engine.analyse_position(board, multipv=ENGINE_MULTIPV)
            played_eval_mover = -post.score_as_cp
            mate_in_after     = -post.mate_in if post.mate_in is not None else None

            cp_loss      = min(max(0, best_eval_mover - played_eval_mover), CP_LOSS_DISPLAY_CAP)
            sacrifice_cp = find_new_hanging_material(board_before, board, mover_color)

            top_move_ucis = [m["move"] for m in pre.top_moves]
            engine_rank   = top_move_ucis.index(move.uci()) + 1 if move.uci() in top_move_ucis else 99

            runner_up_gap = 0.0
            if len(pre.top_moves) >= 2:
                best_candidate_wp   = win_probability(pre.top_moves[0]["score_cp"], pre.top_moves[0]["mate_in"])
                runner_up_candidate = win_probability(pre.top_moves[1]["score_cp"], pre.top_moves[1]["mate_in"])
                runner_up_gap       = max(0.0, best_candidate_wp - runner_up_candidate)

            ctx = MoveContext(
                cp_loss         = cp_loss,
                eval_before     = best_eval_mover,
                eval_after      = played_eval_mover,
                is_book         = False,
                material_gained = material_gained,
                sacrifice_cp    = sacrifice_cp,
                engine_rank     = engine_rank,
                mate_in_before  = mate_in_before,
                mate_in_after   = mate_in_after,
                runner_up_gap   = runner_up_gap,
            )
            result    = classify_move(ctx)
            last_eval = played_eval_mover

            eval_before_white = best_eval_mover   if side == "white" else -best_eval_mover
            eval_after_white  = played_eval_mover if side == "white" else -played_eval_mover

            analyses.append(MoveAnalysis(
                move_number       = move_number,
                side              = side,
                played_move       = move.uci(),
                best_move         = pre.best_move,
                eval_before       = best_eval_mover,
                eval_after        = played_eval_mover,
                eval_before_white = eval_before_white,
                eval_after_white  = eval_after_white,
                mate_before       = mate_in_before,
                mate_after        = mate_in_after,
                centipawn_loss    = cp_loss,
                sacrifice_cp      = sacrifice_cp,
                engine_depth      = min(pre.depth_reached, post.depth_reached),
                classification    = result.classification.value,
                explanation       = result.explanation,
                symbol            = result.symbol,
                color             = result.color,
                wp_before         = result.wp_before,
                wp_after          = result.wp_after,
                wp_delta          = result.wp_delta,
                engine_info       = EngineInfo(top_moves=[m["move"] for m in pre.top_moves]),
            ))

            if side == "black":
                move_number += 1

        return analyses
