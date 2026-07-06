import logging
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware

from analysis.service import AnalysisService
from platforms.chesscom import ChessComClient
from platforms.lichess import LichessClient

logger = logging.getLogger(__name__)


def _extract_game_pgn(bulk_pgn: str, game_id: str) -> Optional[str]:
    games = bulk_pgn.strip().split("\n\n\n")
    for game in games:
        if game_id in game:
            return game.strip()
    return None


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.service  = AnalysisService()
    app.state.chesscom = ChessComClient()
    app.state.lichess  = LichessClient()
    yield
    app.state.service.close()


app = FastAPI(title="Chess Game Review API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return RedirectResponse(url="/docs")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze")
async def analyze_pgn(pgn_file: UploadFile = File(...)):
    try:
        pgn_text = (await pgn_file.read()).decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="PGN file must be UTF-8 encoded.")
    try:
        result = app.state.service.analyze_pgn_text(pgn_text)
        return {"status": "success", **result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        logger.exception("Analysis failed")
        raise HTTPException(status_code=500, detail="Analysis failed. Check server logs.")


@app.get("/games/chesscom/{username}")
async def get_chesscom_games(
    username: str,
    page:   int            = Query(1, ge=1),
    result: Optional[str]  = Query(None, pattern="^(win|loss|draw)$"),
    speed:  Optional[str]  = Query(None, pattern="^(bullet|blitz|rapid|classical|daily|correspondence)$"),
):
    try:
        games = await app.state.chesscom.fetch_games(username, page=page, result_filter=result, speed_filter=speed)
        if not games:
            return {"status": "success", "games": [], "message": "No games found."}
        return {"status": "success", "page": page, "games": [g.model_dump() for g in games]}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception:
        logger.exception("Chess.com fetch failed")
        raise HTTPException(status_code=500, detail="Failed to fetch games from Chess.com.")


@app.get("/games/lichess/{username}")
async def get_lichess_games(
    username: str,
    page:   int            = Query(1, ge=1),
    result: Optional[str]  = Query(None, pattern="^(win|loss|draw)$"),
    speed:  Optional[str]  = Query(None, pattern="^(bullet|blitz|rapid|classical|daily|correspondence)$"),
):
    try:
        games = await app.state.lichess.fetch_games(username, page=page, result_filter=result, speed_filter=speed)
        if not games:
            return {"status": "success", "games": [], "message": "No games found."}
        return {"status": "success", "page": page, "games": [g.model_dump() for g in games]}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception:
        logger.exception("Lichess fetch failed")
        raise HTTPException(status_code=500, detail="Failed to fetch games from Lichess.")


@app.post("/analyze/chesscom")
async def analyze_chesscom_game(payload: dict):
    game_id    = payload.get("game_id")
    source_url = payload.get("source_url")
    if not game_id or not source_url:
        raise HTTPException(status_code=400, detail="game_id and source_url are required.")
    try:
        bulk_pgn = await app.state.chesscom.fetch_pgn(source_url)
        pgn_text = _extract_game_pgn(bulk_pgn, game_id)
        if not pgn_text:
            raise ValueError(f"Game '{game_id}' not found in archive.")
        result = app.state.service.analyze_pgn_text(pgn_text)
        return {"status": "success", **result}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception:
        logger.exception("Chess.com analysis failed")
        raise HTTPException(status_code=500, detail="Analysis failed. Check server logs.")


@app.post("/analyze/lichess")
async def analyze_lichess_game(payload: dict):
    source_url = payload.get("source_url")
    if not source_url:
        raise HTTPException(status_code=400, detail="source_url is required.")
    try:
        pgn_text = await app.state.lichess.fetch_pgn(source_url)
        result   = app.state.service.analyze_pgn_text(pgn_text)
        return {"status": "success", **result}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception:
        logger.exception("Lichess analysis failed")
        raise HTTPException(status_code=500, detail="Analysis failed. Check server logs.")