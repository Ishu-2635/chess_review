'''from abc import ABC, abstractmethod
from typing import Optional
from pydantic import BaseModel


class GameSummary(BaseModel):
    game_id:      str
    platform:     str
    white:        str
    black:        str
    result:       str
    result_detail: str
    date:         str
    time_control: str
    speed:        str
    opening:      Optional[str] = None


def parse_time_control(tc: str) -> tuple[str, str]:
    """
    Returns (human_readable, speed_category).
    speed_category: bullet | blitz | rapid | classical | daily | correspondence
    """
    if not tc or tc in ("-", "unlimited", "correspondence"):
        return "Correspondence", "correspondence"

    if "/" in tc:
        return "Daily", "daily"

    try:
        if "+" in tc:
            base, inc = tc.split("+")
            base, inc = int(base), int(inc)
        else:
            base, inc = int(tc), 0

        base_min = base // 60
        total    = base + 40 * inc

        if base_min == 0:
            readable = f"{base} sec"
        elif inc > 0:
            readable = f"{base_min} min | {inc} sec inc"
        else:
            readable = f"{base_min} min"

        if total < 179:
            speed = "bullet"
        elif total < 479:
            speed = "blitz"
        elif total < 1499:
            speed = "rapid"
        else:
            speed = "classical"

        return readable, speed

    except (ValueError, TypeError):
        return tc, "unknown"


def format_result(result: str, username: str, white: str) -> str:
    if result in ("1/2-1/2", "draw"):
        return "Draw"
    is_white = username.lower() == white.lower()
    if result == "1-0":
        return "Win" if is_white else "Loss"
    if result == "0-1":
        return "Loss" if is_white else "Win"
    return result


class BasePlatformClient(ABC):
    @abstractmethod
    async def fetch_games(
        self,
        username: str,
        page: int = 1,
        result_filter: Optional[str] = None,
        speed_filter: Optional[str] = None,
    ) -> list[GameSummary]:
        pass

    @abstractmethod
    async def fetch_pgn(self, game_id: str, username: str = "") -> str:
        pass'''
from abc import ABC, abstractmethod
from typing import Optional
from pydantic import BaseModel


class GameSummary(BaseModel):
    game_id:       str
    platform:      str
    white:         str
    black:         str
    result:        str
    result_detail: str
    date:          str
    time_control:  str
    speed:         str
    opening:       Optional[str] = None
    source_url:    str = ""


def parse_time_control(tc: str) -> tuple[str, str]:
    if not tc or tc in ("-", "unlimited", "correspondence"):
        return "Correspondence", "correspondence"

    if "/" in tc:
        return "Daily", "daily"

    try:
        if "+" in tc:
            base, inc = tc.split("+")
            base, inc = int(base), int(inc)
        else:
            base, inc = int(tc), 0

        base_min = base // 60
        total    = base + 40 * inc

        if base_min == 0:
            readable = f"{base} sec"
        elif inc > 0:
            readable = f"{base_min} min | {inc} sec inc"
        else:
            readable = f"{base_min} min"

        if total < 179:
            speed = "bullet"
        elif total < 479:
            speed = "blitz"
        elif total < 1499:
            speed = "rapid"
        else:
            speed = "classical"

        return readable, speed

    except (ValueError, TypeError):
        return tc, "unknown"


def format_result(result: str, username: str, white: str) -> str:
    if result in ("1/2-1/2", "draw"):
        return "Draw"
    is_white = username.lower() == white.lower()
    if result == "1-0":
        return "Win" if is_white else "Loss"
    if result == "0-1":
        return "Loss" if is_white else "Win"
    return result


class BasePlatformClient(ABC):
    @abstractmethod
    async def fetch_games(
        self,
        username: str,
        page: int = 1,
        result_filter: Optional[str] = None,
        speed_filter: Optional[str] = None,
    ) -> list[GameSummary]:
        pass

    @abstractmethod
    async def fetch_pgn(self, source_url: str) -> str:
        pass