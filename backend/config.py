import os
import shutil


def _autodetect_stockfish() -> str:
    found = shutil.which("stockfish-windows-x86-64-avx2.exe")
    if found:
        return found
    for candidate in (
        "/usr/games/stockfish",
        "/usr/bin/stockfish",
        "/usr/local/bin/stockfish",
        "/opt/homebrew/bin/stockfish",
        r"D:\Lab\projects\stockfish\stockfish-windows-x86-64-avx2.exe",
    ):
        if os.path.exists(candidate):
            return candidate
    return ""


STOCKFISH_PATH = os.environ.get("STOCKFISH_PATH") or _autodetect_stockfish()

BOOK_PATH = os.path.join(os.path.dirname(__file__), "data", "gm2001.bin")


BOOK_MAX_MOVE = int(os.environ.get("BOOK_MAX_MOVE", "15"))


ENGINE_DEPTH         = int(os.environ.get("ENGINE_DEPTH", "18"))
ENGINE_TIME_CEILING  = float(os.environ.get("ENGINE_TIME_CEILING", "30"))

ENGINE_THREADS  = int(os.environ.get("ENGINE_THREADS", str(min(4, os.cpu_count() or 2))))
ENGINE_HASH_MB  = int(os.environ.get("ENGINE_HASH_MB", "128"))
ENGINE_MULTIPV  = int(os.environ.get("ENGINE_MULTIPV", "3"))


ENGINE_POOL_SIZE = int(os.environ.get("ENGINE_POOL_SIZE", "3"))

ENGINE_CACHE_SIZE = int(os.environ.get("ENGINE_CACHE_SIZE", "256"))

CP_LOSS_DISPLAY_CAP = int(os.environ.get("CP_LOSS_DISPLAY_CAP", "1000"))
