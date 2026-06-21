from game.pgn_handler import PGNHandler
from analysis.analyzer import Analyzer
from engine.stockfish_engine import StockfishEngine
from analysis.metrics import calculate_accuracy


class AnalysisService:
    def __init__(self):
        self.engine = StockfishEngine()
        self.analyzer = Analyzer(self.engine)

    def analyze_pgn_text(self, pgn_text: str):
        pgn = PGNHandler()
        pgn.load_pgn_from_string(pgn_text)

        analyses = self.analyzer.analyze_game(pgn)
        accuracy = calculate_accuracy(analyses)

        return {
            "total_moves": len(analyses),
            "accuracy": accuracy,
            "moves": [a.__dict__ for a in analyses],
        }

    def close(self):
        self.engine.close()