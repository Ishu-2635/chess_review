from datetime import datetime, timezone
from typing import Optional

import httpx

from platforms.base import BasePlatformClient, GameSummary, parse_time_control

HEADERS   = {"User-Agent": "ChessReviewApp/1.0"}
BASE_URL  = "https://api.chess.com/pub"
PAGE_SIZE = 10

DRAW_REASONS = {
    "agreed":             "Draw — By Agreement",
    "repetition":         "Draw — Repetition",
    "stalemate":          "Draw — Stalemate",
    "insufficient":       "Draw — Insufficient Material",
    "timevsinsufficient": "Draw — Timeout vs Insufficient Material",
    "50move":             "Draw — 50 Move Rule",
}
WIN_REASONS = {
    "resigned":  "Win — Resignation",
    "checkmated":"Win — Checkmate",
    "timeout":   "Win — Timeout",
    "abandoned": "Win — Abandoned",
}
LOSS_REASONS = {
    "resigned":  "Loss — Resignation",
    "checkmated":"Loss — Checkmate",
    "timeout":   "Loss — Timeout",
    "abandoned": "Loss — Abandoned",
}


def _parse_result(game: dict, username: str) -> tuple[str, str]:
    is_white  = username.lower() == game["white"]["username"].lower()
    mover_res = game["white"].get("result", "") if is_white else game["black"].get("result", "")
    other_res = game["black"].get("result", "") if is_white else game["white"].get("result", "")

    if mover_res == "win":
        result, reasons, key = "Win",  WIN_REASONS,  other_res
    elif other_res == "win":
        result, reasons, key = "Loss", LOSS_REASONS, mover_res
    else:
        result, reasons, key = "Draw", DRAW_REASONS, mover_res

    return result, reasons.get(key, f"{result} — {key.title()}")


def _parse_date(ts: int) -> str:
    return datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%d %b %Y")


async def _fetch_archive_months(client: httpx.AsyncClient, username: str) -> list[str]:
    resp = await client.get(f"{BASE_URL}/player/{username}/games/archives", headers=HEADERS)
    if resp.status_code == 404:
        raise ValueError(f"Username '{username}' not found on Chess.com.")
    resp.raise_for_status()
    return list(reversed(resp.json().get("archives", [])))


async def _fetch_month_games(client: httpx.AsyncClient, archive_url: str) -> list[dict]:
    resp = await client.get(archive_url, headers=HEADERS)
    resp.raise_for_status()
    games = resp.json().get("games", [])
    return [g for g in games if g.get("rules", "chess") == "chess" and g.get("rated", False)]


class ChessComClient(BasePlatformClient):
    async def fetch_games(
        self,
        username: str,
        page: int = 1,
        result_filter: Optional[str] = None,
        speed_filter: Optional[str] = None,
    ) -> list[GameSummary]:
        async with httpx.AsyncClient(timeout=10) as client:
            archives = await _fetch_archive_months(client, username)
            if not archives:
                return []

            collected   = []
            skip        = (page - 1) * PAGE_SIZE
            skipped     = 0
            months_back = 0

            for archive_url in archives:
                if months_back >= 6:
                    break

                raw_games = list(reversed(await _fetch_month_games(client, archive_url)))

                for game in raw_games:
                    tc_readable, speed = parse_time_control(game.get("time_control", "-"))
                    result, detail     = _parse_result(game, username)

                    if result_filter and result.lower() != result_filter.lower():
                        continue
                    if speed_filter and speed != speed_filter.lower():
                        continue
                    if skipped < skip:
                        skipped += 1
                        continue

                    game_url = game.get("url", "")
                    game_id  = game_url.rstrip("/").split("/")[-1]

                    collected.append(GameSummary(
                        game_id       = game_id,
                        platform      = "chesscom",
                        white         = game["white"]["username"],
                        black         = game["black"]["username"],
                        result        = result,
                        result_detail = detail,
                        date          = _parse_date(game.get("end_time", 0)),
                        time_control  = tc_readable,
                        speed         = speed,
                        opening       = game.get("opening", {}).get("name") if isinstance(game.get("opening"), dict) else None,
                        source_url    = archive_url,
                    ))

                    if len(collected) == PAGE_SIZE:
                        return collected

                months_back += 1

            return collected

    async def fetch_pgn(self, source_url: str) -> str:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(f"{source_url}/pgn", headers=HEADERS)
            if resp.status_code == 404:
                raise ValueError("Game archive not found on Chess.com.")
            resp.raise_for_status()
            return resp.text