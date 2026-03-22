from __future__ import annotations

from collections import defaultdict
import random
from typing import DefaultDict

from crafting_env import ACTION_CHAOS, ACTION_ESSENCE, ACTION_STOP, CraftingEnv
from currency_exalt_rates import (
    CHAOS_ORB_EXALT_PER_USE,
    ESSENCE_EXALT_PER_USE,
    RL_ESSENCE_TO_CHAOS_COST_RATIO,
)
from poe_currency_exchange import load_poe2_rl_exalt_rates_or_fallback


StateType = tuple[int, int, int, int, int]


def epsilon_greedy_action(
    q_table: DefaultDict[StateType, list[float]],
    state: StateType,
    epsilon: float,
) -> int:
    if random.random() < epsilon:
        return random.randint(0, 2)
    values = q_table[state]
    return int(max(range(3), key=lambda idx: values[idx]))


def train_q_learning(
    episodes: int = 5000,
    alpha: float = 0.1,
    gamma: float = 0.95,
    epsilon_start: float = 1.0,
    epsilon_end: float = 0.05,
    epsilon_decay: float = 0.999,
) -> tuple[DefaultDict[StateType, list[float]], list[float]]:
    rates = load_poe2_rl_exalt_rates_or_fallback(
        CHAOS_ORB_EXALT_PER_USE,
        ESSENCE_EXALT_PER_USE,
        RL_ESSENCE_TO_CHAOS_COST_RATIO,
    )
    env = CraftingEnv(
        budget=80,
        good_tier_max_inclusive=2,
        desired_good_mods=3,
        chaos_exalt_per_use=rates.chaos_exalt_per_use,
        essence_exalt_per_use=rates.essence_exalt_per_use,
        max_steps=100,
        seed=42,
    )
    q_table: DefaultDict[StateType, list[float]] = defaultdict(lambda: [0.0, 0.0, 0.0])
    episode_rewards: list[float] = []

    epsilon = epsilon_start
    for _ in range(episodes):
        state, _ = env.reset()
        done = False
        total_reward = 0.0

        while not done:
            action = epsilon_greedy_action(q_table, state, epsilon)
            next_state, reward, terminated, truncated, _ = env.step(action)
            done = terminated or truncated

            best_next_q = max(q_table[next_state])
            td_target = reward + (0.0 if done else gamma * best_next_q)
            td_error = td_target - q_table[state][action]
            q_table[state][action] += alpha * td_error

            state = next_state
            total_reward += reward

        episode_rewards.append(total_reward)
        epsilon = max(epsilon_end, epsilon * epsilon_decay)

    return q_table, episode_rewards, rates


def evaluate_policy(
    q_table: DefaultDict[StateType, list[float]],
    episodes: int = 500,
    chaos_exalt_per_use: float = CHAOS_ORB_EXALT_PER_USE,
    essence_exalt_per_use: float = ESSENCE_EXALT_PER_USE,
) -> dict[str, float]:
    env = CraftingEnv(
        budget=80,
        good_tier_max_inclusive=2,
        desired_good_mods=3,
        chaos_exalt_per_use=chaos_exalt_per_use,
        essence_exalt_per_use=essence_exalt_per_use,
        max_steps=100,
        seed=777,
    )
    action_counts = {
        ACTION_CHAOS: 0,
        ACTION_ESSENCE: 0,
        ACTION_STOP: 0,
    }
    rewards: list[float] = []

    for _ in range(episodes):
        state, _ = env.reset()
        done = False
        total_reward = 0.0

        while not done:
            action_values = q_table[state]
            action = int(max(range(3), key=lambda idx: action_values[idx]))
            action_counts[action] += 1
            state, reward, terminated, truncated, _ = env.step(action)
            done = terminated or truncated
            total_reward += reward

        rewards.append(total_reward)

    mean_reward = sum(rewards) / len(rewards)
    chaos_ratio = action_counts[ACTION_CHAOS] / max(1, sum(action_counts.values()))
    essence_ratio = action_counts[ACTION_ESSENCE] / max(1, sum(action_counts.values()))
    stop_ratio = action_counts[ACTION_STOP] / max(1, sum(action_counts.values()))

    return {
        "mean_reward": round(mean_reward, 4),
        "chaos_action_ratio": round(chaos_ratio, 4),
        "essence_action_ratio": round(essence_ratio, 4),
        "stop_action_ratio": round(stop_ratio, 4),
    }


if __name__ == "__main__":
    q_table, history, rates = train_q_learning()
    metrics = evaluate_policy(
        q_table,
        chaos_exalt_per_use=rates.chaos_exalt_per_use,
        essence_exalt_per_use=rates.essence_exalt_per_use,
    )

    print("=== RL Training Done ===")
    print(f"Exalt cost source: {rates.source} — {rates.detail}")
    if rates.market_id_used:
        print(f"Exchange row: {rates.market_id_used}, next_change_id={rates.next_change_id}")
    print(f"Episodes: {len(history)}")
    print(f"Last 10 average reward: {sum(history[-10:]) / 10:.4f}")
    print("Policy metrics:", metrics)
