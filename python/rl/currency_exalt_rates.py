"""
Mirror of ``src/lib/poe2-item-simulator/currency/currencyExaltExchangeRates.ts`` for RL.

Keep numbers in sync when editing TypeScript.

**Live rates:** ``poe_currency_exchange.py`` can pull PoE2 Currency Exchange digests
(``service:cxapi``) and set chaos/essence exalt costs for training; see that module
and ``python/README.md``.
"""

# exaltedValueOfOneCurrencyUnit("chaosOrb") — user ratio 1 chaos : 8 exalted
CHAOS_ORB_EXALT_PER_USE: float = 8.0

# Essence has no separate table entry; legacy RL used chaos:essence = 1:3 in abstract units.
RL_ESSENCE_TO_CHAOS_COST_RATIO: float = 3.0
ESSENCE_EXALT_PER_USE: float = CHAOS_ORB_EXALT_PER_USE * RL_ESSENCE_TO_CHAOS_COST_RATIO
