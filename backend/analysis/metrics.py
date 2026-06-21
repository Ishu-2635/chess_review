#analysis\metrics.py
def calculate_accuracy(analyses):
    if not analyses:
        return 100

    total_loss = sum(a.centipawn_loss for a in analyses)
    avg_loss = total_loss / len(analyses)

    # Convert to accuracy (approximation)
    accuracy = max(0, 100 - (avg_loss / 3))

    return round(accuracy, 2)