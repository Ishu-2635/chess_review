import io
from typing import Generator, List, Optional, Tuple
import chess
import chess.pgn


class PGNHandler:
    def __init__(self, pgn_path: str = None):
        self.pgn_path = pgn_path
        self.game = None

    def load_pgn(self, pgn_path: str = None) -> chess.pgn.Game:
        path = pgn_path or self.pgn_path
        if not path:
            raise ValueError("PGN path not provided")

        with open(path, "r", encoding="utf-8") as f:
            self.game = chess.pgn.read_game(f)

        if self.game is None:
            raise ValueError("Invalid or empty PGN file")

        return self.game

    def load_pgn_from_string(self, pgn_text: str) -> chess.pgn.Game:
        self.game = chess.pgn.read_game(io.StringIO(pgn_text))
        if self.game is None:
            raise ValueError("Invalid or empty PGN. Make sure it is a valid PGN string.")
        if not list(self.game.mainline_moves()):
            raise ValueError("PGN loaded but contains no moves.")
        return self.game

    def get_headers(self) -> dict:
        if not self.game:
            raise RuntimeError("PGN not loaded")
        return dict(self.game.headers)

    def get_initial_board(self) -> chess.Board:
        """
        Starting position for this game, honouring SetUp/FEN/Variant
        headers. Always use this instead of a bare chess.Board() so
        custom-start and Chess960 games replay from the right square.
        """
        if not self.game:
            raise RuntimeError("PGN not loaded")
        return self.game.board()

    def get_moves(self) -> List[chess.Move]:
        if not self.game:
            raise RuntimeError("PGN not loaded")
        return list(self.game.mainline_moves())

    def replay_game(self) -> Generator[Tuple[chess.Board, chess.Move], None, None]:
        """Yields (board_after_move, move) for each move in the mainline."""
        if not self.game:
            raise RuntimeError("PGN not loaded")

        board = self.get_initial_board()
        for move in self.game.mainline_moves():
            board.push(move)
            yield board.copy(), move

    @staticmethod
    def extract_single_game(bulk_pgn_text: str, identifier: str) -> Optional[str]:
        stream = io.StringIO(bulk_pgn_text)
        exporter = chess.pgn.StringExporter(headers=True, variations=False, comments=False)

        while True:
            game = chess.pgn.read_game(stream)
            if game is None:
                return None
            if any(identifier in str(value) for value in game.headers.values()):
                return game.accept(exporter)

    @staticmethod
    def save_game(
        board: chess.Board,
        moves: List[chess.Move],
        headers: dict,
        output_path: str,
    ):
        game = chess.pgn.Game()
        game.headers.update(headers)

        node = game
        for move in moves:
            node = node.add_variation(move)

        with open(output_path, "w", encoding="utf-8") as f:
            exporter = chess.pgn.StringExporter(
                headers=True,
                variations=False,
                comments=False,
            )
            f.write(game.accept(exporter))