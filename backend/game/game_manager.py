# game/game_manager.py

import chess

class GameManager:
    def __init__(self):
        self.board = chess.Board()

    def make_move(self, uci_move):
        move = chess.Move.from_uci(uci_move)
        if move in self.board.legal_moves:
            self.board.push(move)
            return True
        return False

    def is_game_over(self):
        return self.board.is_game_over()

    def get_board(self):
        return self.board
