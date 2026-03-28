/**
 * `scripts/extract-poe2wiki-item-mod-tiers.ts` 출력 및 런타임 `poe2wiki-item-mod-tiers.json` 스키마.
 * PoE2DB 모디파이어 상세(패밀리·도메인·스탯 min/max·지역·스폰 가중·제작 태그)와 같은 정보 밀도를 목표로 한다.
 */

/** `mod_stats` 한 줄. PoE2DB의 Stat 열(내부 id, min, max, 지역). */
export type WikiModStatRangeRowType = {
  statId: string;
  min: number;
  max: number;
  /**
   * 지역(local) 수치 여부. Cargo에 플래그가 없으면 `statId`(`local_` 접두 등)로 추론한다.
   * 구버전 JSON에는 없을 수 있음.
   */
  isLocal?: boolean;
};

/** `mod_spawn_weights` — PoE2DB Spawn Tags 열과 대응. */
export type WikiModSpawnWeightRowType = {
  ordinal: number;
  tag: string;
  value: number;
};

/**
 * Cargo `mods` 한 행 + 조인된 stats/spawn — PoE2DB 티어 테이블 한 줄에 대응.
 */
export type WikiExtractedModTierRowType = {
  wikiModId: string;
  /**
   * 위키 모디파이어 문서 제목과 동일 — `Modifier:${wikiModId}`.
   * Cargo `mod_spawn_weights` 조회·검증 시 사용한다.
   */
  wikiModifierPageName?: string;
  /** Family — `mods.mod_groups` */
  modGroups: string;
  /** 접두어=1, 접미어=2 — `mods.generation_type` */
  generationType: 1 | 2;
  /** Req. level — `mods.required_level` */
  requiredLevel: number;
  /**
   * Effective level — PoE2DB "Effective: n". 위키 Cargo에 컬럼이 없으면 `null`.
   * `schemaVersion` 이전 JSON에는 필드가 없을 수 있음 → 런타임은 옵션으로 취급.
   */
  effectiveLevel?: number | null;
  /** Domains — 아이템 모드 = 1. */
  modDomain?: number;
  /** Gold price — 원본에 없으면 `null`. */
  goldPrice?: number | null;
  /** Craft tags — PoE2DB 제작 태그; 미수집 시 `[]`. */
  craftTags?: readonly string[];
  tierText: string | null;
  statText: string | null;
  /** 롤 접두/접미 이름 — PoE2DB 이름 열. */
  name: string | null;
  /**
   * PoE2DB 등 외부 참고로 보정한 **지능 요구치**(Cargo `mods`에 없을 수 있음).
   * 추출 후처리 `applyPoe2dbWikiSpawnPostCorrections`에서만 채운다.
   */
  requiredIntelligence?: number | null;
  statRanges: WikiModStatRangeRowType[];
  spawnWeights: WikiModSpawnWeightRowType[];
  /**
   * 동일 (modGroups + generationType) 내에서 `requiredLevel` 내림차순 정렬 시 부여하는 티어.
   * 시뮬 `IModTierType` 규칙과 맞춤: **1 = 최상(일반적으로 높은 요구 레벨)**.
   */
  simulatorTierWithinGroup: number;
};

/**
 * 저장 파일 봉투. `schemaVersion`은 PoE2DB 열 세트와 맞출 때 올린다.
 * @see `Poe2DbStyleModTierFileMetaType` — 동일 루트 필드
 */
export type WikiItemModTiersFileType = {
  /** 예: `poe2db-style@1` — `effectiveLevel`/`craftTags` 등이 채워지면 올림 */
  schemaVersion?: string;
  source: string;
  fetchedAtIso: string;
  filter?: {
    domain: number;
    /** JSON·Cargo에서 읽을 때 `[1,2]` 튜플이 아닌 `number[]`로 올 수 있음. */
    generationTypes: readonly number[];
  };
  rowCount: number;
  uniqueModGroupKeys?: number;
  rows: WikiExtractedModTierRowType[];
};
