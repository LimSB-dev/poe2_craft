from __future__ import annotations

from dataclasses import dataclass
import random
from typing import Any

try:
    import gymnasium as gym
    from gymnasium import spaces
except ImportError:  # pragma: no cover - fallback when gymnasium is unavailable
    gym = None

    class _DiscreteSpace:
        def __init__(self, n: int) -> None:
            self.n = n

    class _MultiDiscreteSpace:
        def __init__(self, nvec: list[int]) -> None:
            self.nvec = nvec

    class _SpacesFallback:
        Discrete = _DiscreteSpace
        MultiDiscrete = _MultiDiscreteSpace

    spaces = _SpacesFallback()


ACTION_CHAOS: int = 0
ACTION_ESSENCE: int = 1
ACTION_STOP: int = 2


@dataclass
class ItemStateType:
    total_affixes: int
    good_mods: int
    average_tier: float
    chaos_used: int
    used_essence: int
    total_cost: float


class CraftingEnv:
    """
    Gym-style crafting environment.

    State = (good_mods, total_affixes, average_tier_bucket, budget_left, used_essence)
    Action = chaos / essence / stop
    Reward = item_quality - total_cost  (terminal reward)
    """

    def __init__(
        self,
        budget: int = 80,
        good_tier_max_inclusive: int = 2,
        chaos_cost: float = 1.0,
        essence_cost: float = 3.0,
        max_steps: int = 120,
        seed: int | None = None,
    ) -> None:
        if budget <= 0:
            raise ValueError("budget must be positive.")
        self.budget = budget
        self.good_tier_max_inclusive = good_tier_max_inclusive
        self.chaos_cost = chaos_cost
        self.essence_cost = essence_cost
        self.max_steps = max_steps
        self.rng = random.Random(seed)

        # 0: chaos, 1: essence, 2: stop
        self.action_space = spaces.Discrete(3)
        # [good_mods 0..6, total_affixes 0..6, avg_tier_bucket 0..4, budget_left 0..budget, essence_used 0..1]
        self.observation_space = spaces.MultiDiscrete([7, 7, 5, budget + 1, 2])

        self.step_count: int = 0
        self.item: ItemStateType = self._empty_item()

    def _empty_item(self) -> ItemStateType:
        return ItemStateType(
            total_affixes=0,
            good_mods=0,
            average_tier=5.0,
            chaos_used=0,
            used_essence=0,
            total_cost=0.0,
        )

    def _roll_random_tiers(self, n: int, force_one_essence_tier: bool) -> list[int]:
        tiers = [self.rng.randint(1, 5) for _ in range(n)]
        if force_one_essence_tier and n > 0:
            forced_idx = self.rng.randint(0, n - 1)
            tiers[forced_idx] = self.rng.randint(1, 3)
        return tiers

    def _roll_item(self, force_one_essence_tier: bool) -> ItemStateType:
        total_affixes = self.rng.randint(4, 6)
        tiers = self._roll_random_tiers(total_affixes, force_one_essence_tier)
        good_mods = sum(1 for tier in tiers if tier <= self.good_tier_max_inclusive)
        avg_tier = sum(tiers) / len(tiers)
        return ItemStateType(
            total_affixes=total_affixes,
            good_mods=good_mods,
            average_tier=avg_tier,
            chaos_used=self.item.chaos_used,
            used_essence=self.item.used_essence,
            total_cost=self.item.total_cost,
        )

    def _item_quality(self, item: ItemStateType) -> float:
        # Simple quality proxy:
        # - Good mods matter most
        # - More affixes helps
        # - Lower average tier is better
        tier_score = max(0.0, 6.0 - item.average_tier)
        return (2.2 * item.good_mods) + (0.4 * item.total_affixes) + (0.6 * tier_score)

    def _observation(self) -> tuple[int, int, int, int, int]:
        avg_tier_bucket = int(min(4, max(0, round(self.item.average_tier) - 1)))
        budget_left = max(0, self.budget - self.item.chaos_used)
        return (
            self.item.good_mods,
            self.item.total_affixes,
            avg_tier_bucket,
            budget_left,
            self.item.used_essence,
        )

    def reset(self, *, seed: int | None = None, options: dict[str, Any] | None = None) -> tuple[tuple[int, int, int, int, int], dict[str, Any]]:
        if seed is not None:
            self.rng.seed(seed)
        self.step_count = 0
        self.item = self._empty_item()
        return self._observation(), {"message": "episode_reset"}

    def _terminal_reward(self) -> float:
        return self._item_quality(self.item) - self.item.total_cost

    def step(self, action: int) -> tuple[tuple[int, int, int, int, int], float, bool, bool, dict[str, Any]]:
        if action not in (ACTION_CHAOS, ACTION_ESSENCE, ACTION_STOP):
            raise ValueError(f"Invalid action: {action}")

        self.step_count += 1
        terminated = False
        truncated = False
        reward = 0.0

        # If budget is already exhausted, force terminal.
        if self.item.chaos_used >= self.budget:
            terminated = True
            reward = self._terminal_reward()
            return self._observation(), reward, terminated, truncated, {"forced_stop": "budget_exhausted"}

        if action == ACTION_CHAOS:
            rolled = self._roll_item(force_one_essence_tier=False)
            rolled.chaos_used = self.item.chaos_used + 1
            rolled.total_cost = self.item.total_cost + self.chaos_cost
            rolled.used_essence = self.item.used_essence
            self.item = rolled
        elif action == ACTION_ESSENCE:
            rolled = self._roll_item(force_one_essence_tier=True)
            rolled.total_cost = self.item.total_cost + self.essence_cost
            rolled.chaos_used = self.item.chaos_used
            rolled.used_essence = 1
            self.item = rolled
        else:
            terminated = True

        if self.item.chaos_used >= self.budget:
            terminated = True

        if self.step_count >= self.max_steps:
            truncated = True

        if terminated or truncated:
            reward = self._terminal_reward()

        info: dict[str, Any] = {
            "quality": round(self._item_quality(self.item), 4),
            "cost": round(self.item.total_cost, 4),
            "chaos_used": self.item.chaos_used,
            "good_mods": self.item.good_mods,
            "total_affixes": self.item.total_affixes,
        }
        return self._observation(), reward, terminated, truncated, info
