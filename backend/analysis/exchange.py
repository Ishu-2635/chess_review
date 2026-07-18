from typing import Optional

import chess

SEE_PIECE_VALUES: dict[int, int] = {
    chess.PAWN:   100,
    chess.KNIGHT: 305,
    chess.BISHOP: 333,
    chess.ROOK:   563,
    chess.QUEEN:  950,
    chess.KING:   100_000,  # only ever used last in a swap sequence
}


def _least_valuable_attacker(
    board: chess.Board,
    square: chess.Square,
    color: chess.Color,
) -> Optional[chess.Square]:
    best_square = None
    best_value  = None
    for attacker_square in board.attackers(color, square):
        if square not in board.pin(color, attacker_square):
            continue  # pinned attacker cannot legally recapture here
        value = SEE_PIECE_VALUES[board.piece_at(attacker_square).piece_type]
        if best_value is None or value < best_value:
            best_value  = value
            best_square = attacker_square
    return best_square


def static_exchange_eval(board: chess.Board, square: chess.Square, attacker_color: chess.Color) -> int:
    occupant = board.piece_at(square)
    gains = [SEE_PIECE_VALUES[occupant.piece_type] if occupant else 0]

    scratch         = board.copy(stack=False)
    color           = attacker_color
    attacker_square = _least_valuable_attacker(scratch, square, color)

    while attacker_square is not None:
        attacker_piece = scratch.remove_piece_at(attacker_square)
        gains.append(SEE_PIECE_VALUES[attacker_piece.piece_type])
        scratch.set_piece_at(square, attacker_piece)

        color           = not color
        attacker_square = _least_valuable_attacker(scratch, square, color)

    value = 0
    for gain in reversed(gains):
        value = max(0, gain - value)
    return value


def find_hanging_material(board: chess.Board, color: chess.Color) -> int:
    opponent = not color
    worst    = 0
    for square, piece in board.piece_map().items():
        if piece.color != color or piece.piece_type == chess.KING:
            continue
        worst = max(worst, static_exchange_eval(board, square, opponent))
    return worst


def find_new_hanging_material(board_before: chess.Board, board_after: chess.Board, color: chess.Color) -> int:
    before = find_hanging_material(board_before, color)
    after  = find_hanging_material(board_after, color)
    return max(0, after - before)
