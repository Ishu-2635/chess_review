'''from datetime import datetime, timezone
from typing import Optional

import httpx

from platforms.base import BasePlatformClient, GameSummary, parse_time_control, format_result

BASE_URL  = "https://lichess.org"
PAGE_SIZE = 10
HEADERS   = {
    "Accept": "application/x-ndjson",
}

TERMINATION_MAP = {
    "mate":              "{result} — Checkmate",
    "resign":            "{result} — Resignation",
    "outoftime":         "{result} — Timeout",
    "stalemate":         "Draw — Stalemate",
    "draw":              "Draw — By Agreement",
    "repetition":        "Draw — Repetition",
    "insufficientMaterial": "Draw — Insufficient Material",
    "fiftyMoves":        "Draw — 50 Move Rule",
    "unknownFinish":     "{result}",
    "noStart":           "{result} — No Start",
    "cheat":             "{result} — Cheat Detected",
    "variantEnd":        "{result}",
}


def _parse_result(game: dict, username: str) -> tuple[str, str]:
    winner    = game.get("winner")
    players   = game.get("players", {})
    status    = game.get("status", "unknown")
    is_white  = players.get("white", {}).get("user", {}).get("name", "").lower() == username.lower()

    if winner is None:
        result = "Draw"
    elif (winner == "white" and is_white) or (winner == "black" and not is_white):
        result = "Win"
    else:
        result = "Loss"

    template = TERMINATION_MAP.get(status, "{result}")
    detail   = template.replace("{result}", result)
    return result, detail


def _parse_date(ts_ms: int) -> str:
    return datetime.fromtimestamp(ts_ms / 1000, tz=timezone.utc).strftime("%d %b %Y")


class LichessClient(BasePlatformClient):
    async def fetch_games(
        self,
        username: str,
        page: int = 1,
        result_filter: Optional[str] = None,
        speed_filter: Optional[str] = None,
    ) -> list[GameSummary]:
        params = {
            "max":        PAGE_SIZE * page + 50,
            "rated":      "true",
            "opening":    "true",
            "clocks":     "false",
            "evals":      "false",
            "pgnInJson":  "false",
        }

        if speed_filter:
            params["perfType"] = speed_filter

        url = f"{BASE_URL}/api/user/{username}/game"

        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url, headers=HEADERS, params=params)
            if resp.status_code == 404:
                raise ValueError(f"Username '{username}' not found on Lichess.")
            resp.raise_for_status()

            lines = [l.strip() for l in resp.text.strip().split("\n") if l.strip()]

        if not lines:
            return []

        import json

        skip      = (page - 1) * PAGE_SIZE
        skipped   = 0
        collected = []

        for line in lines:
            try:
                game = json.loads(line)
            except json.JSONDecodeError:
                continue

            players  = game.get("players", {})
            white    = players.get("white", {}).get("user", {}).get("name", "?")
            black    = players.get("black", {}).get("user", {}).get("name", "?")
            result, detail = _parse_result(game, username)

            if result_filter and result.lower() != result_filter.lower():
                continue

            tc_str              = game.get("clock", {}) or {}
            initial             = tc_str.get("initial", 0)
            increment           = tc_str.get("increment", 0)
            tc_string           = f"{initial}+{increment}" if increment else str(initial)
            tc_readable, speed  = parse_time_control(tc_string)

            if skipped < skip:
                skipped += 1
                continue

            opening = game.get("opening", {})

            collected.append(GameSummary(
                game_id      = game["id"],
                platform     = "lichess",
                white        = white,
                black        = black,
                result       = result,
                result_detail= detail,
                date         = _parse_date(game.get("createdAt", 0)),
                time_control = tc_readable,
                speed        = speed,
                opening      = opening.get("name") if opening else None,
            ))

            if len(collected) == PAGE_SIZE:
                break

        return collected

    async def fetch_pgn(self, game_id: str, username: str = "") -> str:
        url = f"{BASE_URL}/game/export/{game_id}"
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url, headers={"Accept": "application/x-chess-pgn"})
            if resp.status_code == 404:
                raise ValueError(f"Game '{game_id}' not found on Lichess.")
            resp.raise_for_status()
            return resp.text'''
import json
from datetime import datetime, timezone
from typing import Optional

import httpx

from platforms.base import BasePlatformClient, GameSummary, parse_time_control

BASE_URL  = "https://lichess.org"
PAGE_SIZE = 10
HEADERS   = {"Accept": "application/x-ndjson"}

TERMINATION_MAP = {
    "mate":                 "{result} — Checkmate",
    "resign":               "{result} — Resignation",
    "outoftime":            "{result} — Timeout",
    "stalemate":            "Draw — Stalemate",
    "draw":                 "Draw — By Agreement",
    "repetition":           "Draw — Repetition",
    "insufficientMaterial": "Draw — Insufficient Material",
    "fiftyMoves":           "Draw — 50 Move Rule",
    "unknownFinish":        "{result}",
    "noStart":              "{result} — No Start",
    "cheat":                "{result} — Cheat Detected",
    "variantEnd":           "{result}",
}


def _parse_result(game: dict, username: str) -> tuple[str, str]:
    winner   = game.get("winner")
    players  = game.get("players", {})
    status   = game.get("status", "unknown")
    is_white = players.get("white", {}).get("user", {}).get("name", "").lower() == username.lower()

    if winner is None:
        result = "Draw"
    elif (winner == "white" and is_white) or (winner == "black" and not is_white):
        result = "Win"
    else:
        result = "Loss"

    detail = TERMINATION_MAP.get(status, "{result}").replace("{result}", result)
    return result, detail


def _parse_date(ts_ms: int) -> str:
    return datetime.fromtimestamp(ts_ms / 1000, tz=timezone.utc).strftime("%d %b %Y")


class LichessClient(BasePlatformClient):
    async def fetch_games(
        self,
        username: str,
        page: int = 1,
        result_filter: Optional[str] = None,
        speed_filter: Optional[str] = None,
    ) -> list[GameSummary]:
        params: dict = {
            "max":       PAGE_SIZE * page + 50,
            "rated":     "true",
            "opening":   "true",
            "clocks":    "false",
            "evals":     "false",
            "pgnInJson": "false",
        }
        if speed_filter:
            params["perfType"] = speed_filter

        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"{BASE_URL}/api/user/{username}/game",
                headers=HEADERS,
                params=params,
            )
            if resp.status_code == 404:
                raise ValueError(f"Username '{username}' not found on Lichess.")
            resp.raise_for_status()
            lines = [l.strip() for l in resp.text.strip().split("\n") if l.strip()]

        if not lines:
            return []

        skip      = (page - 1) * PAGE_SIZE
        skipped   = 0
        collected = []

        for line in lines:
            try:
                game = json.loads(line)
            except json.JSONDecodeError:
                continue

            players        = game.get("players", {})
            white          = players.get("white", {}).get("user", {}).get("name", "?")
            black          = players.get("black", {}).get("user", {}).get("name", "?")
            result, detail = _parse_result(game, username)

            if result_filter and result.lower() != result_filter.lower():
                continue

            clock     = game.get("clock") or {}
            initial   = clock.get("initial", 0)
            increment = clock.get("increment", 0)
            tc_string = f"{initial}+{increment}" if increment else str(initial)
            tc_readable, speed = parse_time_control(tc_string)

            if skipped < skip:
                skipped += 1
                continue

            game_id = game["id"]
            opening = game.get("opening") or {}

            collected.append(GameSummary(
                game_id       = game_id,
                platform      = "lichess",
                white         = white,
                black         = black,
                result        = result,
                result_detail = detail,
                date          = _parse_date(game.get("createdAt", 0)),
                time_control  = tc_readable,
                speed         = speed,
                opening       = opening.get("name"),
                source_url    = f"{BASE_URL}/game/export/{game_id}",
            ))

            if len(collected) == PAGE_SIZE:
                break

        return collected

    async def fetch_pgn(self, source_url: str) -> str:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(source_url, headers={"Accept": "application/x-chess-pgn"})
            if resp.status_code == 404:
                raise ValueError("Game not found on Lichess.")
            resp.raise_for_status()
            return resp.text