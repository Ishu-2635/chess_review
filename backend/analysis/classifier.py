from __future__ import annotations

import math
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


MATE_SCORE: int = 30_000

PIECE_VALUES: dict[str, int] = {
    "p": 100,
    "n": 305,
    "b": 333,
    "r": 563,
    "q": 950,
    "k": 0,
}


@dataclass(frozen=True)
class ClassifierConfig:
    wp_best:       float = 0.02
    wp_excellent:  float = 0.06
    wp_good:       float = 0.10
    wp_inaccuracy: float = 0.20
    wp_mistake:    float = 0.30
    # beyond wp_mistake -> Blunder
    great_min_wp_gap: float = 0.10

    brilliant_min_sacrifice: int = 150  # cp of real, SEE-confirmed danger

    wp_sigmoid_k: float = 0.00368208

    # Raw cp is uninformative once a mate is on the board: mate-in-1 and
    # mate-in-20 both encode to ~MATE_SCORE, so a naive sigmoid can't tell
    # a fast, precise mate from a needlessly slow one. Win probability for
    # a confirmed mate is instead a gentle function of mate distance
    # itself, floored so a slow-but-certain mate never reads as remotely
    # in doubt.
    mate_wp_decay_per_ply: float = 0.004
    mate_wp_floor:         float = 0.85

    mate_severity_high_cp: int = 999
    mate_severity_mid_cp:  int = 700

    accuracy_a: float = 103.1668100711649
    accuracy_k: float = 0.04354415386753951
    accuracy_b: float = -3.166924740191411
    accuracy_uncertainty_bonus: float = 1.0


DEFAULT_CONFIG = ClassifierConfig()


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


CLASSIFICATION_META: dict[MoveClassification, dict] = {
    MoveClassification.BRILLIANT:  {"symbol": "!!", "color": "#9B59B6"},
    MoveClassification.GREAT:      {"symbol": "!",  "color": "#27AE60"},
    MoveClassification.BEST:       {"symbol": "✦",  "color": "#2ECC71"},
    MoveClassification.EXCELLENT:  {"symbol": "✓✓", "color": "#3498DB"},
    MoveClassification.GOOD:       {"symbol": "✓",  "color": "#2980B9"},
    MoveClassification.BOOK:       {"symbol": "≡",  "color": "#3c2c2c"},
    MoveClassification.INACCURACY: {"symbol": "?!", "color": "#F39C12"},
    MoveClassification.MISTAKE:    {"symbol": "?",  "color": "#E67E22"},
    MoveClassification.BLUNDER:    {"symbol": "??", "color": "#E74C3C"},
    MoveClassification.MISS:       {"symbol": "⊘",  "color": "#C02B2B"},
}

POSITIVE_CLASSIFICATIONS = frozenset({
    MoveClassification.BRILLIANT,
    MoveClassification.GREAT,
    MoveClassification.BEST,
    MoveClassification.EXCELLENT,
    MoveClassification.GOOD,
    MoveClassification.BOOK,
})


@dataclass
class MoveContext:
    cp_loss:     int
    eval_before: int
    eval_after:  int

    is_book:         bool          = False
    material_gained: int           = 0   # material captured/promoted on this move
    sacrifice_cp:    int           = 0   # material of the mover's own left in real danger (SEE)
    engine_rank:     int           = 1
    mate_in_before:  Optional[int] = None
    mate_in_after:   Optional[int] = None

    runner_up_gap: float = 0.0 # To check cp gap between best and 2nd best move


@dataclass
class ClassificationResult:
    classification: MoveClassification
    symbol:         str
    color:          str
    cp_loss:        int
    eval_before:    int
    eval_after:     int
    wp_before:      float
    wp_after:       float
    wp_delta:       float
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
    counts: dict[str, int] = field(
        default_factory=lambda: {c.value: 0 for c in MoveClassification}
    )
    total_moves:   int   = 0
    total_cp_loss: int   = 0
    total_wp_loss: float = 0.0

    def record(self, classification: MoveClassification, cp_loss: int, wp_delta: float) -> None:
        self.counts[classification.value] += 1
        self.total_moves   += 1
        self.total_cp_loss += cp_loss
        self.total_wp_loss += max(0.0, -wp_delta)

    @property
    def avg_cp_loss(self) -> float:
        return self.total_cp_loss / self.total_moves if self.total_moves else 0.0

    @property
    def avg_wp_loss(self) -> float:
        return self.total_wp_loss / self.total_moves if self.total_moves else 0.0

    def to_dict(self) -> dict:
        return {
            "counts":      self.counts,
            "total_moves": self.total_moves,
            "avg_cp_loss": round(self.avg_cp_loss, 1),
            "avg_wp_loss": round(self.avg_wp_loss, 4),
        }


def cp_to_win_probability(cp: int, k: float = DEFAULT_CONFIG.wp_sigmoid_k) -> float:
    clamped = max(-MATE_SCORE, min(MATE_SCORE, cp))
    return 1.0 / (1.0 + math.exp(-k * clamped))


def mate_to_win_probability(mate_in: int, cfg: ClassifierConfig = DEFAULT_CONFIG) -> float:
    if mate_in == 0:
        return 1.0
    plies = min(abs(mate_in), 100)
    wp_for_winner = max(cfg.mate_wp_floor, 1.0 - cfg.mate_wp_decay_per_ply * plies)
    return wp_for_winner if mate_in > 0 else 1.0 - wp_for_winner


def win_probability(cp: int, mate_in: Optional[int], cfg: ClassifierConfig = DEFAULT_CONFIG) -> float:
    if mate_in is not None:
        return mate_to_win_probability(mate_in, cfg)
    return cp_to_win_probability(cp, cfg.wp_sigmoid_k)


def win_percent_white(
    eval_white: int,
    mate_white: Optional[int],
    cfg: ClassifierConfig = DEFAULT_CONFIG,
) -> float:
    """White-POV win percentage (0-100), mate-aware. Used to build the
    whole-game position-volatility sequence for compute_game_accuracy()."""
    return 100.0 * win_probability(eval_white, mate_white, cfg)


def _per_move_accuracy(wp_before_pct: float, wp_after_pct: float, cfg: ClassifierConfig) -> float:
    if wp_after_pct >= wp_before_pct:
        return 100.0
    win_diff = wp_before_pct - wp_after_pct
    raw = cfg.accuracy_a * math.exp(-cfg.accuracy_k * win_diff) + cfg.accuracy_b
    return max(0.0, min(100.0, raw + cfg.accuracy_uncertainty_bonus))


def _population_stdev(values: list[float]) -> float:
    if len(values) < 2:
        return 0.0
    mean = sum(values) / len(values)
    return math.sqrt(sum((v - mean) ** 2 for v in values) / len(values))


def compute_game_accuracy(
    moves: list[Optional[tuple[str, float, float]]],
    white_pov_win_percents: list[float],
    cfg: ClassifierConfig = DEFAULT_CONFIG,
) -> dict[str, float]:
    n = len(moves)
    if n == 0:
        return {"white": 100.0, "black": 100.0}

    window_size = max(2, min(8, n // 10))
    total_positions = len(white_pov_win_percents)
    effective = min(window_size, total_positions)

    windows = [white_pov_win_percents[:window_size]] * max(0, effective - 2)
    span = max(0, total_positions - window_size + 1)
    windows += [white_pov_win_percents[i:i + window_size] for i in range(span)]

    weights = [max(0.5, min(12.0, _population_stdev(w))) for w in windows]
    if len(weights) < n:
        weights += [weights[-1] if weights else 1.0] * (n - len(weights))
    elif len(weights) > n:
        weights = weights[:n]

    per_side: dict[str, list[tuple[float, float]]] = {"white": [], "black": []}
    for entry, weight in zip(moves, weights):
        if entry is None:
            continue
        side, wp_before, wp_after = entry
        per_side[side].append((_per_move_accuracy(wp_before, wp_after, cfg), weight))

    def _side_accuracy(pairs: list[tuple[float, float]]) -> float:
        if not pairs:
            return 100.0
        total_weight = sum(w for _, w in pairs)
        weighted_mean = (
            sum(a * w for a, w in pairs) / total_weight
            if total_weight > 0 else sum(a for a, _ in pairs) / len(pairs)
        )
        harmonic_mean = len(pairs) / sum(1.0 / max(a, 0.01) for a, _ in pairs)
        return round((weighted_mean + harmonic_mean) / 2.0, 1)

    return {
        "white": _side_accuracy(per_side["white"]),
        "black": _side_accuracy(per_side["black"]),
    }


def compute_material_gained(
    captured_piece: Optional[str] = None,
    promoted_to:    Optional[str] = None,
    is_en_passant:  bool          = False,
) -> int:
    """Material (cp) captured or gained by this move alone. Always >= 0."""
    gained = 0
    if captured_piece:
        gained += PIECE_VALUES.get(captured_piece.lower(), 0)
    if is_en_passant:
        gained += PIECE_VALUES["p"]
    if promoted_to:
        gained += PIECE_VALUES.get(promoted_to.lower(), 0) - PIECE_VALUES["p"]
    return gained


def classify_move(
    ctx: MoveContext,
    cfg: ClassifierConfig = DEFAULT_CONFIG,
) -> ClassificationResult:
    wp_before = win_probability(ctx.eval_before, ctx.mate_in_before, cfg)
    wp_after  = win_probability(ctx.eval_after,  ctx.mate_in_after,  cfg)
    wp_delta  = wp_after - wp_before
    wp_drop   = max(0.0, -wp_delta)

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

    if ctx.is_book:
        return _result(
            MoveClassification.BOOK,
            "Opening theory — part of an established opening line.",
        )

    is_sacrifice = ctx.sacrifice_cp >= cfg.brilliant_min_sacrifice and wp_drop <= cfg.wp_best
    is_critical  = ctx.runner_up_gap >= cfg.great_min_wp_gap
    had_forced_mate_for_mover = ctx.mate_in_before is not None and ctx.mate_in_before > 0
    already_lost_by_force     = ctx.mate_in_before is not None and ctx.mate_in_before < 0

    # Mate delivered on this exact move - the objective best possible result.
    if ctx.mate_in_after == 0:
        if is_sacrifice:
            return _result(MoveClassification.BRILLIANT, "Brilliant sacrifice — forces checkmate on the spot!")
        if is_critical:
            return _result(MoveClassification.GREAT, "Checkmate — and the only move that finished the game here.")
        return _result(MoveClassification.BEST, "Checkmate — the strongest and final move of the game.")

    if ctx.mate_in_after is not None and ctx.mate_in_after < 0:
        if not already_lost_by_force:
            if ctx.eval_before < -cfg.mate_severity_high_cp:
                return _result(
                    MoveClassification.INACCURACY,
                    "The position was already very difficult; this makes the loss forced, "
                    "but little was realistically left to save.",
                )
            if ctx.eval_before < -cfg.mate_severity_mid_cp:
                return _result(
                    MoveClassification.MISTAKE,
                    "The position was already troubled, and this makes the opponent's "
                    "checkmate forced from here.",
                )
            return _result(
                MoveClassification.BLUNDER,
                f"Blunder — this move allows the opponent to force checkmate in {abs(ctx.mate_in_after)}.",
            )
        # The mate was already forced against the mover before this move -
        # it didn't cause this, so grade the defense on its own merit
        # rather than treating any pace as a fresh mistake. Continuing to
        # be mated, at any pace, was never actually in doubt either way.
        best_possible_defense = ctx.mate_in_before + 1
        if ctx.mate_in_after <= best_possible_defense:
            if is_critical:
                return _result(
                    MoveClassification.GREAT,
                    "The only move that holds out this long in an already lost position.",
                )
            return _result(
                MoveClassification.BEST,
                f"Defends as well as possible in an already lost position "
                f"(forced checkmate in {abs(ctx.mate_in_after)} regardless).",
            )
        return _result(
            MoveClassification.GOOD,
            "The position was already lost by force; the outcome here was never in doubt.",
        )

    if ctx.mate_in_after is not None and ctx.mate_in_after > 0:
        # A forced mate exists after this move. Reward Great/Brilliant for
        # a brand new mate, or for being the one move that keeps an
        # existing one alive when alternatives would have lost it. Simply
        # continuing an existing mate at a slower pace is never treated as
        # a mistake - the outcome was never actually in doubt either way.
        kept_pace = (not had_forced_mate_for_mover) or (ctx.mate_in_after == ctx.mate_in_before - 1)
        if kept_pace:
            if is_sacrifice:
                return _result(
                    MoveClassification.BRILLIANT,
                    f"Brilliant sacrifice leading to forced checkmate in {ctx.mate_in_after}!",
                )
            if not had_forced_mate_for_mover:
                return _result(MoveClassification.GREAT, f"Found a forced checkmate in {ctx.mate_in_after}!")
            if is_critical:
                return _result(
                    MoveClassification.GREAT,
                    f"The only move that keeps the forced checkmate in {ctx.mate_in_after} alive.",
                )
            return _result(
                MoveClassification.BEST,
                f"Correctly continues the forced checkmate at full pace (mate in {ctx.mate_in_after}).",
            )
        return _result(
            MoveClassification.GOOD,
            f"Still completely winning (mate in {ctx.mate_in_after}) - not the fastest path, "
            "but the win was never in doubt.",
        )

    # A forced mate existed before this move but is gone entirely now.

    if had_forced_mate_for_mover:
        if ctx.eval_after > cfg.mate_severity_high_cp:
            return _result(
                MoveClassification.MISS,
                f"Missed a forced mate in {ctx.mate_in_before}, but the position is still crushing.",
            )
        if ctx.eval_after > cfg.mate_severity_mid_cp:
            return _result(
                MoveClassification.MISTAKE,
                f"Missed a forced mate in {ctx.mate_in_before}; the advantage is smaller now.",
            )
        return _result(
            MoveClassification.BLUNDER,
            f"Missed a forced mate in {ctx.mate_in_before}! The opponent now has a real chance to escape.",
        )

    # Brilliant: engine-best move that puts real material in danger for
    # compensation, and doesn't leave the mover losing.
    if is_sacrifice and ctx.eval_after >= -50:
        return _result(
            MoveClassification.BRILLIANT,
            "Brilliant! The engine's top choice involves giving up material "
            "for decisive positional or tactical compensation.",
        )

    if wp_drop <= cfg.wp_best or ctx.engine_rank == 1:
        if is_critical:
            return _result(
                MoveClassification.GREAT,
                "The only move here that didn't let the position get worse - everything "
                "else would have given up real ground.",
            )
        return _result(
            MoveClassification.BEST,
            "Engine's top choice — the strongest available move.",
        )

    pct = wp_drop * 100

    if wp_drop <= cfg.wp_excellent:
        return _result(
            MoveClassification.EXCELLENT,
            f"Very accurate move — win probability fell only {pct:.1f}%.",
        )
    if wp_drop <= cfg.wp_good:
        return _result(
            MoveClassification.GOOD,
            f"Good, solid move — win probability fell {pct:.1f}%, an acceptable trade-off.",
        )
    if wp_drop <= cfg.wp_inaccuracy:
        return _result(
            MoveClassification.INACCURACY,
            f"Slight inaccuracy — win probability fell {pct:.1f}%; a better option was available, "
            "but the position remains playable.",
        )
    if wp_drop <= cfg.wp_mistake:
        return _result(
            MoveClassification.MISTAKE,
            f"Mistake — win probability fell {pct:.1f}%. Look for what was missed.",
        )

    return _result(
        MoveClassification.BLUNDER,
        f"Blunder — win probability fell {pct:.1f}%, a serious error that likely "
        "changes the game's outcome.",
    )
