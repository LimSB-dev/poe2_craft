/**
 * 엑잘티드 오브(Exalted Orb) 기준 사용자 제시 환율.
 *
 * **강화학습(RL)**: 액션별 비용·보상을 **엑잘 단위**로 맞출 때 이 모듈을 단일 출처로 쓴다.
 * `exaltedValueOfOneCurrencyUnit` / `amountInExaltedOrbs`로 행동 비용을 정규화하면
 * 서로 다른 화폐를 섞는 정책의 점수를 비교하기 쉽다.
 * Python `python/rl/crafting_env.py`와 `src/app/api/rl-train/route.ts`는 `getRlCraftingActionCostsExalt()`와
 * 동일한 숫자를 유지한다(파이썬은 주석으로 출처 표기).
 *
 * 표기 `A : B`는 **왼쪽 = 해당 화폐 개수**, **오른쪽 = 엑잘티드 오브 개수**로 통일해서 읽는다.
 *
 * - 진화 `355 : 1` → 진화 오브 355개 ≈ 엑잘 1개
 * - 카오스 `1 : 8` → 카오스 오브 **1개** ≈ 엑잘 **8개**
 * - 소멸 `1 : 22` → 소멸 오브 **1개** ≈ 엑잘 **22개**
 * - 디바인 `1 : 244` → 디바인 오브 **1개** ≈ 엑잘 **244개**
 *
 * 내부 상수 `CURRENCY_UNITS_PER_ONE_EXALTED_ORB`는 “엑잘 1개와 맞먹으려면 그 화폐가 몇 개 필요한가”이므로,
 * 위 세 종(카오스·소멸·디바인)은 **1/8, 1/22, 1/244**로 둔다.
 */
export type IBasicCurrencyExaltRateKeyType =
  | "orbOfTransmutation"
  | "orbOfAugmentation"
  | "regalOrb"
  | "orbOfAlchemy"
  | "chaosOrb"
  | "orbOfAnnulment"
  | "divineOrb";

/** 사용자가 적어 준 `화폐 개수 : 엑잘 개수` 그대로 (카오스·소멸·디바인). */
export const USER_ORB_TO_EXALT_RATIO: Readonly<
  Record<"chaosOrb" | "orbOfAnnulment" | "divineOrb", readonly [currencyCount: number, exaltedCount: number]>
> = {
  chaosOrb: [1, 8],
  orbOfAnnulment: [1, 22],
  divineOrb: [1, 244],
};

/** 해당 화폐 몇 개가 엑잘티드 오브 1개와 대략 동일한 가치인지. */
export const CURRENCY_UNITS_PER_ONE_EXALTED_ORB: Readonly<
  Record<IBasicCurrencyExaltRateKeyType, number>
> = {
  orbOfTransmutation: 355,
  orbOfAugmentation: 109,
  regalOrb: 123,
  orbOfAlchemy: 1.5,
  chaosOrb: 1 / 8,
  orbOfAnnulment: 1 / 22,
  divineOrb: 1 / 244,
};

/** 엑잘티드 오브 1개를 기준(1)으로 할 때, 화폐 1개의 상대 가치(엑잘 개수). */
export const exaltedValueOfOneCurrencyUnit = (
  currencyKey: IBasicCurrencyExaltRateKeyType
): number => {
  const units = CURRENCY_UNITS_PER_ONE_EXALTED_ORB[currencyKey];
  return 1 / units;
};

/** 화폐 `amount`개를 엑잘티드 오브 개수로 환산한 값. */
export const amountInExaltedOrbs = (
  currencyKey: IBasicCurrencyExaltRateKeyType,
  amount: number
): number => {
  return amount * exaltedValueOfOneCurrencyUnit(currencyKey);
};

/** 에센스 1회 = 카오스 몇 회 분인지(시세 미입력 시 레거시 RL 비율 유지). */
export const RL_ESSENCE_TO_CHAOS_COST_RATIO: number = 3;

/**
 * 강화학습 크래프팅 시뮬의 **행동당 엑잘 비용** (보상에서 `totalExaltSpent`를 빼는 데 사용).
 * 에센스는 별도 환율이 없어 `chaosOrb` 엑잘 가치 × {@link RL_ESSENCE_TO_CHAOS_COST_RATIO} 로 둔다.
 */
export const getRlCraftingActionCostsExalt = (): { chaosOrb: number; essence: number } => {
  const chaosOrb = exaltedValueOfOneCurrencyUnit("chaosOrb");
  return {
    chaosOrb,
    essence: chaosOrb * RL_ESSENCE_TO_CHAOS_COST_RATIO,
  };
};
