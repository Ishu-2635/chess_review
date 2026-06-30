#analysis/classifier.py

from __future__ import annotations

import math
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional



# Constants

# Any abs(score) >= MATE_SCORE is treated as a mate situation.
MATE_SCORE: int = 30_000

# Standard piece values in centipawns (used for material_delta helpers)
PIECE_VALUES: dict[str, int] = {
    "p": 100,   # pawn
    "n": 305,   # knight
    "b": 333,   # bishop
    "r": 563,   # rook
    "q": 950,   # queen
    "k": 0,     # king (infinite; omitted from material sums)
}



@dataclass(frozen=True)
class ClassifierConfig:
    # Centipawn-loss thresholds
    cp_best:       int   = 5      # 0–5   → BEST
    cp_great:      int   = 10     # 6–10  → GREAT
    cp_excellent:  int   = 25     # 11–25 → EXCELLENT
    cp_good:       int   = 60     # 26–60 → GOOD
    cp_inaccuracy: int   = 120    # 61–120→ INACCURACY
    cp_mistake:    int   = 300    # 121–300→ MISTAKE
    # > cp_mistake                → BLUNDER

    # Brilliant detection
    # Move must be near-perfect AND involve a material sacrifice.
    brilliant_max_cp_loss:   int = 5    # must be within 5 cp of best
    brilliant_min_sacrifice: int = 150  # must give up ≥ 1.5 pawns (net)

    # "Miss" detection
    # Player was in a clearly good position but squandered a chunk of it.
    miss_min_eval_before: int   = 150   # must have had a real advantage (cp)
    miss_min_wp_drop:     float = 0.10  # must have dropped ≥ 10 win-probability points

    # Win-probability sigmoid 
    wp_sigmoid_k: float = 0.00368208


DEFAULT_CONFIG = ClassifierConfig()



# Classification types


class MoveClassification(str, Enum):
    BRILLIANT  = "brilliant"
    GREAT      = "great"
    BEST       = "best"
    EXCELLENT  = "excellent"
    GOOD       = "good"
    BOOK       = "book"
    INACCURACY = "inaccuracy"
    MISTAKE    = "mistake"
    BLUNDER    = "blunder"
    MISS       = "miss"


# Presentation metadata keyed by classification
CLASSIFICATION_META: dict[MoveClassification, dict] = {
    MoveClassification.BRILLIANT:  {"symbol": "!!", "color": "#9B59B6"},
    MoveClassification.GREAT:      {"symbol": "!",  "color": "#27AE60"},
    MoveClassification.BEST:       {"symbol": "✓",  "color": "#2ECC71"},
    MoveClassification.EXCELLENT:  {"symbol": "",   "color": "#3498DB"},
    MoveClassification.GOOD:       {"symbol": "",   "color": "#2980B9"},
    MoveClassification.BOOK:       {"symbol": "≡",  "color": "#95A5A6"},
    MoveClassification.INACCURACY: {"symbol": "?!", "color": "#F39C12"},
    MoveClassification.MISTAKE:    {"symbol": "?",  "color": "#E67E22"},
    MoveClassification.BLUNDER:    {"symbol": "??", "color": "#E74C3C"},
    MoveClassification.MISS:       {"symbol": "⊘",  "color": "#C0392B"},
}

POSITIVE_CLASSIFICATIONS = frozenset({
    MoveClassification.BRILLIANT,
    MoveClassification.GREAT,
    MoveClassification.BEST,
    MoveClassification.EXCELLENT,
    MoveClassification.GOOD,
    MoveClassification.BOOK,
})



# Input / Output dataclasses


@dataclass
class MoveContext:
    """
    All the engine data the classifier needs for a single move.
    """
    cp_loss:     int
    eval_before: int
    eval_after:  int

    is_book:        bool           = False
    material_delta: int            = 0
    engine_rank:    int            = 1
    mate_in_before: Optional[int]  = None
    mate_in_after:  Optional[int]  = None


@dataclass
class ClassificationResult:
    classification: MoveClassification
    symbol:         str
    color:          str
    cp_loss:        int
    eval_before:    int
    eval_after:     int
    wp_before:      float   # win probability before  move (0–1)
    wp_after:       float   # win probability after   move (0–1)
    wp_delta:       float   # wp_after − wp_before  (negative = worse)
    explanation:    str

    @property
    def is_positive(self) -> bool:
        return self.classification in POSITIVE_CLASSIFICATIONS

    def to_dict(self) -> dict:
        return {
            "classification": self.classification.value,
            "symbol":         self.symbol,
            "color":          self.color,
            "cp_loss":        self.cp_loss,
            "eval_before":    self.eval_before,
            "eval_after":     self.eval_after,
            "wp_before":      round(self.wp_before, 4),
            "wp_after":       round(self.wp_after,  4),
            "wp_delta":       round(self.wp_delta,  4),
            "explanation":    self.explanation,
            "is_positive":    self.is_positive,
        }


@dataclass
class GameStats:
    """
    Accumulates classification statistics across all moves in a game.
    Instantiate one per player and call
    `record()` after each move is classified.
    """
    counts: dict[str, int] = field(
        default_factory=lambda: {c.value: 0 for c in MoveClassification}
    )
    total_moves:   int   = 0
    total_cp_loss: int   = 0
    total_wp_loss: float = 0.0   # sum of win-probability *drops* only

    def record(self, result: ClassificationResult) -> None:
        """Register one classified move."""
        self.counts[result.classification.value] += 1
        self.total_moves   += 1
        self.total_cp_loss += result.cp_loss
        # Only accumulate when the move *worsened* the win probability
        self.total_wp_loss += max(0.0, -result.wp_delta)

    @property
    def avg_cp_loss(self) -> float:
        return self.total_cp_loss / self.total_moves if self.total_moves else 0.0

    @property
    def avg_wp_loss(self) -> float:
        return self.total_wp_loss / self.total_moves if self.total_moves else 0.0

    @property
    def accuracy(self) -> float:
        """
        Overall accuracy in percent (0–100).

        Uses a sigmoid-shaped formula that maps average win-probability loss
        to a human-readable accuracy score (similar to major platforms).
          - ~100 % for flawless play (avg_wp_loss ≈ 0)
          - ~ 50 % for avg_wp_loss ≈ 0.15
          - ~  0 % for avg_wp_loss ≥ 0.50
        """
        if self.total_moves == 0:
            return 100.0
        raw = 103.1668 * math.exp(-0.04354 * (self.avg_wp_loss * 100)) - 3.1668
        return round(max(0.0, min(100.0, raw)), 1)

    def to_dict(self) -> dict:
        return {
            "counts":      self.counts,
            "total_moves": self.total_moves,
            "avg_cp_loss": round(self.avg_cp_loss, 1),
            "avg_wp_loss": round(self.avg_wp_loss, 4),
            "accuracy":    self.accuracy,
        }



# Helper utilities

def cp_to_win_probability(
    cp: int,
    k: float = DEFAULT_CONFIG.wp_sigmoid_k,
) -> float:
    clamped = max(-MATE_SCORE, min(MATE_SCORE, cp))
    return 1.0 / (1.0 + math.exp(-k * clamped))


def normalize_stockfish_eval(
    sf_eval: dict,
    is_after_move: bool = False,
) -> int:
    if sf_eval["type"] == "mate":
        n = sf_eval["value"]
        # Stockfish: positive mate = current side wins, negative = current side loses
        score = (MATE_SCORE - abs(n)) * (1 if n > 0 else -1)
    else:
        score = sf_eval["value"]

    return -score if is_after_move else score


def compute_material_delta(
    captured_piece: Optional[str] = None,
    promoted_to:    Optional[str] = None,
    is_en_passant:  bool          = False,
) -> int:
    
    delta = 0
    if captured_piece:
        delta += PIECE_VALUES.get(captured_piece.lower(), 0)
    if is_en_passant:
        delta += PIECE_VALUES["p"]
    if promoted_to:
        # Promotion gain = new piece value minus the original pawn value
        delta += PIECE_VALUES.get(promoted_to.lower(), 0) - PIECE_VALUES["p"]
    return delta



# Core classifier


def classify_move(
    ctx: MoveContext,
    cfg: ClassifierConfig = DEFAULT_CONFIG,
) -> ClassificationResult:
    """

    Parameters
    ----------
    ctx : MoveContext
        Move data from the engine (see MoveContext docstring).
    cfg : ClassifierConfig
        Threshold configuration; uses sensible defaults if omitted.

    Returns
    -------
    ClassificationResult
        Fully decorated result including symbol, color, win probabilities,
        and a human-readable explanation.
    """

    wp_before = cp_to_win_probability(ctx.eval_before, cfg.wp_sigmoid_k)
    wp_after  = cp_to_win_probability(ctx.eval_after,  cfg.wp_sigmoid_k)
    wp_delta  = wp_after - wp_before

    def _result(cat: MoveClassification, explanation: str) -> ClassificationResult:
        meta = CLASSIFICATION_META[cat]
        return ClassificationResult(
            classification=cat,
            symbol=meta["symbol"],
            color=meta["color"],
            cp_loss=ctx.cp_loss,
            eval_before=ctx.eval_before,
            eval_after=ctx.eval_after,
            wp_before=round(wp_before, 4),
            wp_after=round(wp_after,  4),
            wp_delta=round(wp_delta,  4),
            explanation=explanation,
        )

    # 1. Book move 
    if ctx.is_book:
        return _result(
            MoveClassification.BOOK,
            "Opening theory — part of an established opening line.",
        )

    # 2. Forced-mate scenarios 

    # 2a. This move delivers a forced mate to the opponent
    if ctx.mate_in_after is not None and ctx.mate_in_after > 0:
        if ctx.material_delta <= -cfg.brilliant_min_sacrifice:
            return _result(
                MoveClassification.BRILLIANT,
                f"Brilliant sacrifice leading to forced checkmate "
                f"in {ctx.mate_in_after}!",
            )
        return _result(
            MoveClassification.GREAT,
            f"Found a forced checkmate in {ctx.mate_in_after}!",
        )

    # 2b. This move allows the opponent to force mate
    if ctx.mate_in_after is not None and ctx.mate_in_after < 0:
        return _result(
            MoveClassification.BLUNDER,
            f"Blunder — this move allows the opponent to force checkmate "
            f"in {abs(ctx.mate_in_after)}.",
        )

    # 2c. A forced mate existed before this move but was not used
    if (
        ctx.mate_in_before is not None
        and ctx.mate_in_before > 0
        and (ctx.mate_in_after is None or ctx.mate_in_after <= 0)
    ):
        if ctx.cp_loss > cfg.cp_mistake:
            return _result(
                MoveClassification.BLUNDER,
                f"Missed forced mate in {ctx.mate_in_before}! "
                "The opponent now has a chance to escape.",
            )
        return _result(
            MoveClassification.MISS,
            f"Missed a forced mate in {ctx.mate_in_before}. "
            "The position is still strong, but the fastest win was overlooked.",
        )

    # 3. Brilliant: engine-best + meaningful material sacrifice
    #
    # Three conditions must all be true:
    #   a) The move is virtually the engine's best (cp_loss ≤ threshold)
    #   b) The player gave up significant material (sacrifice)
    #   c) The resulting position is not losing (eval_after ≥ −50)
   
    if (
        ctx.cp_loss          <= cfg.brilliant_max_cp_loss
        and ctx.material_delta <= -cfg.brilliant_min_sacrifice
        and ctx.eval_after     >= -50
    ):
        return _result(
            MoveClassification.BRILLIANT,
            "Brilliant! The engine's top choice involves giving up material "
            "for decisive positional or tactical compensation.",
        )

    # 4. Miss: meaningful win-probability drop from a strong position─
    #
    # The player was clearly better but played a move that threw away a
    # significant portion of the advantage, even if not a full blunder.
    if (
        ctx.eval_before >= cfg.miss_min_eval_before
        and wp_delta    <= -cfg.miss_min_wp_drop
    ):
        pct = abs(wp_delta) * 100
        return _result(
            MoveClassification.MISS,
            f"Missed opportunity — win probability fell {pct:.1f}% "
            f"from an advantageous position ({ctx.eval_before:+d} cp).",
        )

    # 5. Standard centipawn-loss classification
    cp = ctx.cp_loss

    if cp <= cfg.cp_best or ctx.engine_rank==1:
        return _result(
            MoveClassification.BEST,
            "Engine's top choice — the strongest available move.",
        )
    if cp <= cfg.cp_great:
        return _result(
            MoveClassification.GREAT,
            "Excellent move — virtually optimal, very close to the engine's best.",
        )
    if cp <= cfg.cp_excellent:
        return _result(
            MoveClassification.EXCELLENT,
            f"Very accurate move (−{cp} cp) — minimal concession to the engine.",
        )
    if cp <= cfg.cp_good:
        return _result(
            MoveClassification.GOOD,
            f"Good, solid move (−{cp} cp) — reasonable play with an "
            "acceptable trade-off.",
        )
    if cp <= cfg.cp_inaccuracy:
        return _result(
            MoveClassification.INACCURACY,
            f"Slight inaccuracy (−{cp} cp) — a better option was available, "
            "but the position remains playable.",
        )
    if cp <= cfg.cp_mistake:
        return _result(
            MoveClassification.MISTAKE,
            f"Mistake (−{cp} cp) — significantly weakens your position. "
            "Look for what was missed.",
        )

    return _result(
        MoveClassification.BLUNDER,
        f"Blunder (−{cp} cp) — a serious error that likely changes the "
        "game's outcome.",
    )
