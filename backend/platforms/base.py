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

        if total < 180:
            speed = "bullet"
        elif total < 480:
            speed = "blitz"
        elif total < 1500:
            speed = "rapid"
        else:
            speed = "classical"

        return readable, speed

    except (ValueError, TypeError):
        return tc, "unknown"


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