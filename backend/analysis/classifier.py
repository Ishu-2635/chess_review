#analysis\classifier.py
'''def classify_move(cp_loss: int, eval_before: int, eval_after: int) -> str:
    if cp_loss <= 20 and eval_after > eval_before + 50:
        return "brilliant"
    if cp_loss <= 10:
        return "best"
    elif cp_loss <= 30:
        return "excellent"
    elif cp_loss <= 60:
        return "good"
    elif cp_loss <= 100:
        return "inaccuracy"
    elif cp_loss <= 300:
        return "mistake"
    else:
        return "blunder"'''
def classify_move(cp_loss: int, eval_before: int, eval_after: int) -> str:
    """
    Production-style simplified classifier (Chess.com-inspired logic)
    """

    # 1. Mate situations (very important)
    if abs(eval_before) >= 9000:
        return "brilliant"  # forced mate / extreme tactical clarity

    # 2. Brilliant condition (rare, strict)
    if cp_loss == 0 and eval_after >= eval_before:
        return "brilliant"

    # 3. Best moves (very accurate play)
    if cp_loss <= 10:
        return "best"

    # 4. Excellent
    if cp_loss <= 25:
        return "excellent"

    # 5. Good
    if cp_loss <= 60:
        return "good"

    # 6. Inaccuracy
    if cp_loss <= 120:
        return "inaccuracy"

    # 7. Mistake
    if cp_loss <= 300:
        return "mistake"

    # 8. Blunder
    return "blunder"