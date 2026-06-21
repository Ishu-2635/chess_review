'''from fastapi import FastAPI, UploadFile, File
from engine.evaluator import Evaluator
from engine.stockfish_engine import StockfishEngine
from game.pgn_handler import PGNHandler

app = FastAPI(title="Chess Game Review API")

# Persistent Stockfish instance
engine = StockfishEngine()
evaluator = Evaluator(engine)

@app.post("/analyze")
async def analyze_pgn(pgn_file: UploadFile = File(...)):
    """
    Upload PGN file and return move-by-move analysis
    """
    pgn_text = (await pgn_file.read()).decode()
    
    # Use PGNHandler to load from string
    pgn = PGNHandler()
    pgn.load_pgn_from_string(pgn_text)  # we will add this method

    analyses = evaluator.analyze_game(pgn)  # returns list of MoveAnalysis

    # Convert to JSON
    result = []
    for a in analyses:
        result.append({
            "move_number": a.move_number,
            "side": a.side,
            "played_move": a.played_move.uci(),
            "best_move": a.best_move.uci(),
            "eval_before": a.eval_before,
            "eval_after": a.eval_after,
            "centipawn_loss": a.centipawn_loss,
            "classification": a.classification
        })
    return {"moves": result}

@app.on_event("shutdown")
def shutdown_event():
    engine.close()'''
#api\routes
'''
from fastapi.responses import RedirectResponse
from fastapi import FastAPI, UploadFile, File
from engine.stockfish_engine import StockfishEngine
from game.pgn_handler import PGNHandler
from analysis.analyzer import Analyzer
from analysis.metrics import calculate_accuracy
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI(title="Chess Game Review API")




app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = StockfishEngine()
analyzer = Analyzer(engine)



@app.get("/")
def home():
    return RedirectResponse(url="/docs")

@app.get("/health")
def health_check():
    return{
        'status': 'ok'
    } 
    
@app.post("/analyze")
async def analyze_pgn(pgn_file: UploadFile = File(...)):
    try:
        pgn_text = (await pgn_file.read()).decode()

        pgn = PGNHandler()
        pgn.load_pgn_from_string(pgn_text)

        analyses = analyzer.analyze_game(pgn)
        accuracy = calculate_accuracy(analyses)
        return {
            "status": "success",
            "total_moves": len(analyses),
            "accuracy": accuracy,
            "moves": [a.__dict__ for a in analyses]
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }


@app.on_event("shutdown")
def shutdown_event():
    engine.close()'''
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from analysis.service import AnalysisService


# -----------------------------
# Lifespan (startup + shutdown)
# -----------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup
    service = AnalysisService()
    app.state.service = service

    yield

    # shutdown
    service.close()


app = FastAPI(
    title="Chess Game Review API",
    lifespan=lifespan
)


# -----------------------------
# Middleware
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# Routes
# -----------------------------
@app.get("/")
def home():
    return RedirectResponse(url="/docs")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze")
async def analyze_pgn(pgn_file: UploadFile = File(...)):
    pgn_text = (await pgn_file.read()).decode()

    service: AnalysisService = app.state.service
    return {
        "status": "success",
        **service.analyze_pgn_text(pgn_text)
    }