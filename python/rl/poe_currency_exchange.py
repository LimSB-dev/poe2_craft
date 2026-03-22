"""
Path of Exile Currency Exchange API (official) — PoE2 realm.

Docs: https://www.pathofexile.com/developer/docs/reference#currency-exchange
Requires OAuth scope ``service:cxapi`` and a valid access token.

Uses hourly digests; responses are historical (not the current in-progress hour).
We walk the ``next_change_id`` chain from a recent hour until the stream end,
then parse ``chaos|exalted`` markets to estimate exalted value of one chaos orb.
"""

from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Any

API_HOST = "https://api.pathofexile.com"


@dataclass(frozen=True)
class ExchangeFetchResultType:
    chaos_exalt_per_use: float
    essence_exalt_per_use: float
    source: str
    detail: str
    next_change_id: int | None
    market_id_used: str | None


def _build_user_agent() -> str:
    full = os.environ.get("POE_API_USER_AGENT", "").strip()
    if full:
        return full
    client_id = os.environ.get("POE_OAUTH_CLIENT_ID", "").strip()
    version = os.environ.get("POE_APP_VERSION", "1.0.0").strip() or "1.0.0"
    contact = os.environ.get("POE_CONTACT_EMAIL", "").strip()
    if client_id and contact:
        return f"OAuth {client_id}/{version} (contact: {contact})"
    return "OAuth poe2_craft-rl/1.0.0 (contact: unknown@localhost)"


def _request_json(url: str, access_token: str, timeout_s: float = 30.0) -> dict[str, Any]:
    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json",
            "User-Agent": _build_user_agent(),
        },
        method="GET",
    )
    with urllib.request.urlopen(req, timeout=timeout_s) as resp:
        body = resp.read().decode("utf-8")
    return json.loads(body)


def _hour_floor_ts(ts: float) -> int:
    return int(ts // 3600) * 3600


def _mid_ratio(market: dict[str, Any], currency: str) -> float | None:
    lo_d = market.get("lowest_ratio") or {}
    hi_d = market.get("highest_ratio") or {}
    lo = lo_d.get(currency)
    hi = hi_d.get(currency)
    if lo is None or hi is None:
        return None
    return (float(lo) + float(hi)) / 2.0


def _volume_sum(market: dict[str, Any]) -> int:
    vt = market.get("volume_traded") or {}
    return int(sum(int(v) for v in vt.values()))


def _pick_best_chaos_exalted_market(markets: list[dict[str, Any]]) -> dict[str, Any] | None:
    want = {"chaos", "exalted"}
    candidates: list[dict[str, Any]] = []
    for m in markets:
        mid = m.get("market_id")
        if not isinstance(mid, str) or "|" not in mid:
            continue
        parts = [p.strip() for p in mid.split("|")]
        if len(parts) != 2:
            continue
        if set(parts) != want:
            continue
        candidates.append(m)
    if not candidates:
        return None
    return max(candidates, key=_volume_sum)


def _chaos_exalt_per_use_from_market(market: dict[str, Any]) -> float | None:
    """
    From a single ``chaos|exalted`` digest row, estimate **exalted orbs per 1 chaos orb**
    (same unit as ``total_exalt_spent`` in RL).

    ``lowest_ratio`` / ``highest_ratio`` are documented only as uint maps per currency;
    we use the midpoint of each side and take ``r_exalted / r_chaos`` so both legs
    of the pair contribute symmetrically. If the result is non-finite or non-positive,
    callers should fall back.
    """
    r_c = _mid_ratio(market, "chaos")
    r_e = _mid_ratio(market, "exalted")
    if r_c is None or r_e is None or r_c <= 0.0 or r_e <= 0.0:
        return None
    return r_e / r_c


def fetch_latest_poe2_currency_exchange_digest(access_token: str) -> dict[str, Any]:
    """
    Fetch the most recent **completed** hourly digest (not the in-progress hour).

    We try ``floor(now/3600)*3600 - 3600`` first, then step backward hour-by-hour until
    a 200 response (no full stream walk; see API note on historical digests).
    """
    now = time.time()
    hour = _hour_floor_ts(now)
    # Current hour has no digest yet; start at previous hour.
    cur_id = hour - 3600
    for _ in range(24 * 14):
        url = f"{API_HOST}/currency-exchange/poe2/{cur_id}"
        try:
            return _request_json(url, access_token)
        except urllib.error.HTTPError as e:
            if e.code == 404:
                cur_id -= 3600
                continue
            raise
    raise RuntimeError("currency-exchange: no digest found in the last 14 days (404).")


def load_poe2_rl_exalt_rates_from_api(
    access_token: str,
    essence_to_chaos_ratio: float,
) -> ExchangeFetchResultType:
    digest = fetch_latest_poe2_currency_exchange_digest(access_token)
    markets = digest.get("markets")
    if not isinstance(markets, list):
        raise ValueError("invalid API response: missing markets array")

    best = _pick_best_chaos_exalted_market(markets)
    if best is None:
        raise ValueError("no chaos|exalted market in digest")

    chaos_ex = _chaos_exalt_per_use_from_market(best)
    if chaos_ex is None:
        raise ValueError("could not compute ratio from chaos|exalted market")

    mid = best.get("market_id")
    essence_ex = chaos_ex * essence_to_chaos_ratio
    nid = digest.get("next_change_id")
    return ExchangeFetchResultType(
        chaos_exalt_per_use=float(chaos_ex),
        essence_exalt_per_use=float(essence_ex),
        source="api.pathofexile.com/currency-exchange/poe2",
        detail="chaos|exalted volume-weighted row, r_exalted/r_chaos mid-ratios",
        next_change_id=int(nid) if isinstance(nid, (int, float)) else None,
        market_id_used=str(mid) if mid is not None else None,
    )


def load_poe2_rl_exalt_rates_or_fallback(
    chaos_fallback: float,
    essence_fallback: float,
    essence_to_chaos_ratio: float,
) -> ExchangeFetchResultType:
    """
    If ``POE_API_ACCESS_TOKEN`` is set, fetch PoE2 exchange digest and compute rates.
    Otherwise return fallback constants.
    """
    token = os.environ.get("POE_API_ACCESS_TOKEN", "").strip()
    if not token:
        return ExchangeFetchResultType(
            chaos_exalt_per_use=chaos_fallback,
            essence_exalt_per_use=essence_fallback,
            source="fallback",
            detail="POE_API_ACCESS_TOKEN not set; using static rates",
            next_change_id=None,
            market_id_used=None,
        )
    try:
        return load_poe2_rl_exalt_rates_from_api(token, essence_to_chaos_ratio)
    except Exception as e:
        return ExchangeFetchResultType(
            chaos_exalt_per_use=chaos_fallback,
            essence_exalt_per_use=essence_fallback,
            source="fallback",
            detail=f"API error, using static rates: {e}",
            next_change_id=None,
            market_id_used=None,
        )


if __name__ == "__main__":
    import sys

    from currency_exalt_rates import (
        CHAOS_ORB_EXALT_PER_USE,
        ESSENCE_EXALT_PER_USE,
        RL_ESSENCE_TO_CHAOS_COST_RATIO,
    )

    r = load_poe2_rl_exalt_rates_or_fallback(
        CHAOS_ORB_EXALT_PER_USE,
        ESSENCE_EXALT_PER_USE,
        RL_ESSENCE_TO_CHAOS_COST_RATIO,
    )
    print(json.dumps(r.__dict__, indent=2))
    if r.source == "fallback" and "POE_API_ACCESS_TOKEN" not in os.environ:
        sys.exit(0)
    if r.source == "fallback":
        sys.exit(1)
