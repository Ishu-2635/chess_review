# Chess Game Review Backend

A Chess.com-style chess analysis backend built with **FastAPI**, **python-chess**, and **Stockfish**.

The system analyzes PGN games move-by-move, evaluates positions using Stockfish (with Multi-PV support), classifies move quality, and generates structured JSON output for frontend visualization.

---

## Features

* Upload and analyze PGN games
* PGN parsing using `python-chess`
* Stockfish engine integration
* Multi-PV (Multiple Principal Variations) analysis support
* Best move detection with alternative top engine moves
* Evaluation before and after each move
* Centipawn loss calculation
* Move classification system:

  * Brilliant
  * Best
  * Excellent
  * Good
  * Inaccuracy
  * Mistake
  * Blunder
* Overall game accuracy calculation
* Structured JSON API responses
* FastAPI-based REST API

---

## Project Structure

```text id="struct1"
CHESS_ENGINE/
│
├── api/
│   └── routes.py
│
├── analysis/
│   ├── analyzer.py
│   ├── classifier.py
│   ├── metrics.py
│   ├── service.py
│   └── models.py
│
├── engine/
│   └── stockfish.py
│
├── game/
│   ├── game_manager.py
│   └── pgn_handler.py
│
└── requirements.txt
```

---

## Stockfish Setup

Download Stockfish:

https://stockfishchess.org/download/

Then update the engine path in configuration:

```python id="stock1"
STOCKFISH_PATH = "/path/to/stockfish"
```

Windows example:

```python id="stock2"
STOCKFISH_PATH = r"C:\stockfish\stockfish.exe"
```

---

## Run the API

```bash id="run1"
uvicorn api.routes:app --reload
```

API docs:

```
http://localhost:8000/docs
```

---

## Analysis Pipeline

1. Upload PGN game
2. Parse moves into positions
3. Analyze each position using Stockfish
4. Retrieve top N moves using Multi-PV
5. Determine best move and strong alternatives
6. Compute evaluation before and after each move
7. Calculate centipawn loss
8. Classify move quality using engine comparisons
9. Compute overall game accuracy
10. Return structured JSON response

---

## Multi-PV Analysis

This project uses Stockfish **Multi-PV mode** to retrieve multiple candidate moves per position.

Instead of only returning the single best move, the engine returns the top N strongest moves.

### Example output:

```json id="mpvjson"
{
  "best_move": "Nf3",
  "alternatives": [
    {
      "move": "Nf3",
      "eval": 0.45
    },
    {
      "move": "Nc3",
      "eval": 0.44
    },
    {
      "move": "d4",
      "eval": 0.42
    }
  ]
}
```

### Why it matters

* Improves move classification accuracy
* Identifies multiple equally strong moves
* Reduces unfair penalties for near-optimal play
* Enables richer frontend explanations

---

## Example Response

```json id="resp1"
{
  "white_accuracy": 89.4,
  "black_accuracy": 84.7,
  "moves": [
    {
      "move": "e4",
      "best_move": "e4",
      "eval_before": 0.0,
      "eval_after": 0.2,
      "cp_loss": 0,
      "classification": "best"
    }
  ]
}
```

---

## Current Status

### Implemented

* PGN parsing
* Stockfish integration
* Multi-PV engine analysis
* Move-by-move evaluation
* Centipawn loss calculation
* Game accuracy calculation
* JSON API responses
* Basic move classification system

### Known Limitation

* Move classification is a **first version (heuristic-based)** and will be improved in future iterations with deeper engine signal usage.

---

## Planned Improvements

* Improved Multi-PV-aware classification logic
* Better brilliant move detection
* Engine pooling for performance
* Async/background analysis jobs
* Schema validation with Pydantic
* Automated test suite
* Performance optimizations
* Frontend analysis board (Chess.com-style)
* Enhanced visual explanations of moves

---

## Tech Stack

* FastAPI
* Python
* python-chess
* Stockfish
* Uvicorn
