# engine/stockfish_engine.py

import chess.engine
from config import STOCKFISH_PATH, ENGINE_TIME_LIMIT

class StockfishEngine:
    def __init__(self):
        self.cache = {}
        self.engine = chess.engine.SimpleEngine.popen_uci(
            [STOCKFISH_PATH]
        )

    def get_best_move(self, board):

        info = self.engine.analyse(
            board,
            chess.engine.Limit(time=ENGINE_TIME_LIMIT)
        )

        best_move = info["pv"][0]
        score = info["score"].relative.score(mate_score=10000)

        return best_move, score

    def evaluate_position(self, board):
        info = self.engine.analyse(
            board,
            chess.engine.Limit(time=ENGINE_TIME_LIMIT)
        )
        score = info["score"].white().score(mate_score=10000)
        return score

    def close(self):
        self.engine.quit()
    def analyze_top_moves(self, board, multipv=3):
        fen = board.fen()
        if fen in self.cache:
            print("cache hit")#testing purpose
            return self.cache[fen]
        info = self.engine.analyse(
            board,
            chess.engine.Limit(time=ENGINE_TIME_LIMIT),
            multipv=multipv
        )

        moves = []
        for entry in info:
            move = entry["pv"][0]
            score = entry["score"].white().score(mate_score=10000)
            moves.append({
                "move": move.uci(),
                "score": score
            })
        self.cache[fen] = moves
        return moves    
