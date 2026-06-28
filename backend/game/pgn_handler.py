# game/pgn_handler.py
import chess
import io
import chess.pgn
from typing import List, Tuple, Generator


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

   
    def get_headers(self) -> dict:
        if not self.game:
            raise RuntimeError("PGN not loaded")

        return dict(self.game.headers)

    

    def get_moves(self) -> List[chess.Move]:
        if not self.game:
            raise RuntimeError("PGN not loaded")

        return list(self.game.mainline_moves())

    
    def replay_game(
        self,
    ) -> Generator[Tuple[chess.Board, chess.Move], None, None]:
        """
        Generator that yields (board_state, move) for each move
        Board is the position AFTER the move is applied
        """
        if not self.game:
            raise RuntimeError("PGN not loaded")

        board = self.game.board()

        for move in self.game.mainline_moves():
            board.push(move)
            yield board.copy(), move

   
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
    def load_pgn_from_string(self, pgn_text: str):   
        self.game = chess.pgn.read_game(io.StringIO(pgn_text))
        if self.game is None:
            raise ValueError("Invalid or empty PGN. Make sure it is a valid PGN string.")
        if not list(self.game.mainline_moves()):
            raise ValueError("PGN loaded but contains no moves.")
        return self.game