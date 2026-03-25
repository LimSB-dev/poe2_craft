"use client";

import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from "react";

import { CraftingLabOrbPreviewPanel } from "@/components/organisms/CraftingLabOrbPreviewPanel";
import { CraftingLabOrbSlotButton } from "@/components/organisms/CraftingLabOrbSlotButton";
import { LocaleSwitcher } from "@/components/organisms/LocaleSwitcher";
import { ReservedStatusRegion } from "@/components/atoms/ReservedStatusRegion";
import { SimulatorModTemplateText } from "@/components/organisms/SimulatorModTemplateText";
import { ItemSimulatorBaseItemFilterCollapsible } from "@/components/organisms/ItemSimulatorBaseItemFilterCollapsible";
import { ItemSimulatorBaseItemSearchBlock } from "@/components/organisms/ItemSimulatorBaseItemSearchBlock";
import { ItemSimulatorBaseItemTooltipCard } from "@/components/organisms/ItemSimulatorBaseItemTooltipCard";
import { useItemSimulatorBaseItemPanelState } from "@/components/organisms/useItemSimulatorBaseItemPanelState";
import {
  buildHinekoraLockedDraftTable,
  getCachedHinekoraLockedDraftTable,
} from "@/lib/crafting-lab/buildHinekoraLockedDraftTable";
import { getCraftingLabCurrencyIconUrl } from "@/lib/crafting-lab/craftingLabCurrencyIconUrls";
import {
  CRAFT_LAB_CURRENCY_MISC_GRID_ROWS,
  getCraftLabOrbSlotIdsGrouped,
  getOrbSlotTierRoman,
  normalizeCraftingCurrencyEventId,
  orbSlotIdToFamilyKind,
  type CraftingCurrencyIdType,
  type CraftingLabOrbSlotIdType,
  type CraftingOrbFamilyIdType,
} from "@/lib/crafting-lab/craftingLabCurrencyIds";
import {
  buildCraftLabOrbPreview,
  type CraftLabOrbPreviewResultType,
} from "@/lib/crafting-lab/craftLabOrbPreview";
import { isCraftLabOrbSlotApplicable } from "@/lib/crafting-lab/isCraftLabOrbFamilyApplicable";
import type { IModRollBaseFiltersType } from "@/lib/poe2-item-simulator/roller";
import {
  aggregateUsageCounts,
  readCraftingLabUsage,
  writeCraftingLabUsage,
} from "@/lib/crafting-lab/craftingLabUsageStorage";
import { Link } from "@/lib/i18n/navigation";
import {
  applyPreservedBone,
  applySoulWellRevealChoice,
  canApplyPreservedBone,
  CRAFT_LAB_ABYSS_BONE_CRANIUM_ID,
  CRAFT_LAB_ABYSS_BONE_GRID,
  CRAFT_LAB_ABYSS_BONE_IDS,
  CRAFT_LAB_ABYSS_OMEN_IDS,
  getBoneDefinition,
  isCraftLabBoneId,
  isUnrevealedDesecratedMod,
  rollSoulWellRevealCandidates,
  type CraftLabAbyssBoneIdType,
} from "@/lib/poe2-item-simulator/abyss/abyssCrafting";
import {
  resolveStagedAbyssOmenForPreservedBone,
  type CraftLabStagedOmenIdType,
} from "@/lib/poe2-item-simulator/craftLabStagedOmen";
import {
  applyChaosOrb,
  applyChaosOrbWithWhittling,
  applyExaltedOrb,
  applyFracturingOrb,
  applyOrbOfAlchemy,
  applyOrbOfAnnulment,
  applyOrbOfAnnulmentDesecratedOnly,
  applyOrbOfAugmentation,
  applyOrbOfTransmutation,
  applyRegalOrb,
  canApplyOrbOfAnnulmentDesecratedOnly,
  enforceAtMostOneFracturedMod,
} from "@/lib/poe2-item-simulator/currency";
import {
  CRAFT_LAB_RITUAL_OMEN_IDS,
} from "@/lib/poe2-item-simulator/ritual/ritualCrafting";
import {
  applyHinekorasLock,
  canApplyHinekorasLock,
  stripHinekoraLock,
} from "@/lib/poe2-item-simulator/currency/hinekorasLock";
import {
  applyEssence,
  buildEssenceGuaranteedModPreviewRoll,
  canApplyEssence,
  CRAFT_LAB_ESSENCE_DEFINITIONS,
} from "@/lib/poe2-item-simulator/essence/essence";

type CraftLabModeType = "random" | "simulation";

type CraftLabStashTabIdType = "currency" | "essence" | "abyss" | "ritual";

type SoulWellRevealStateType = {
  affixKind: "prefix" | "suffix";
  slotIndex: number;
  candidates: IModDefinition[];
};

const getCraftLabOmenPreviewNoteKey = (
  omenId: CraftLabStagedOmenIdType,
): string => {
  return `omenPreview_${omenId.replace(/^omen_/, "")}`;
};

const CRAFT_LAB_STASH_TABS: readonly CraftLabStashTabIdType[] = [
  "currency",
  "essence",
  "abyss",
  "ritual",
] as const;

const HINEKORA_SKIP_CURRENCY_IDS = new Set<CraftingCurrencyIdType>([
  "orb_divine",
  "orb_vaal",
  "orb_mirror",
  "orb_chance",
  "omen_placeholder",
  ...CRAFT_LAB_ABYSS_BONE_IDS,
  ...CRAFT_LAB_ABYSS_OMEN_IDS,
  ...CRAFT_LAB_RITUAL_OMEN_IDS,
]);

const CRAFT_LAB_STASH_TAB_LABEL_KEYS: Record<CraftLabStashTabIdType, string> = {
  currency: "stashTabCurrency",
  essence: "stashTabEssence",
  abyss: "stashTabAbyss",
  ritual: "stashTabRitual",
};

const EMPTY_NORMAL_ROLL: IItemRoll = {
  rarity: "normal",
  prefixes: [],
  suffixes: [],
};

/** 되돌리기 스택이 과도하게 커지지 않도록 상한. */
const MAX_CRAFT_UNDO_DEPTH: number = 100;
const MAX_ACTIVE_STAGED_OMEN_COUNT: number = 3;

const cloneItemRoll = (roll: IItemRoll): IItemRoll => {
  const base: IItemRoll = {
    rarity: roll.rarity,
    prefixes: roll.prefixes.map((m) => {
      return { ...m };
    }),
    suffixes: roll.suffixes.map((m) => {
      return { ...m };
    }),
  };
  if (roll.hinekoraLockActive === true) {
    base.hinekoraLockActive = true;
  }
  if (roll.isCorrupted === true) {
    base.isCorrupted = true;
  }
  return base;
};

type CraftLabHistorySnapshotType = {
  itemRoll: IItemRoll;
  usageEvents: CraftingCurrencyIdType[];
  activeStagedOmenIds: CraftLabStagedOmenIdType[];
};

const makeHistorySnapshot = (
  roll: IItemRoll,
  events: CraftingCurrencyIdType[],
  activeStagedOmenIds: CraftLabStagedOmenIdType[],
): CraftLabHistorySnapshotType => {
  return {
    itemRoll: cloneItemRoll(roll),
    usageEvents: [...events],
    activeStagedOmenIds: [...activeStagedOmenIds],
  };
};

const readStagedOmensFromSnapshot = (
  snap: CraftLabHistorySnapshotType,
): CraftLabStagedOmenIdType[] => {
  const row = snap as Record<string, unknown>;
  if ("activeStagedOmenIds" in row) {
    const raw = row.activeStagedOmenIds;
    if (Array.isArray(raw)) {
      return raw.filter((value): value is CraftLabStagedOmenIdType => {
        return typeof value === "string";
      });
    }
    return [];
  }
  if ("activeStagedOmenId" in row) {
    const legacyId = row.activeStagedOmenId;
    if (typeof legacyId === "string") {
      return [legacyId as CraftLabStagedOmenIdType];
    }
    return [];
  }
  const legacyAbyssOmenId = row.activeAbyssOmenId;
  if (typeof legacyAbyssOmenId === "string") {
    return [legacyAbyssOmenId as CraftLabStagedOmenIdType];
  }
  return [];
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

const getCraftLabDisabledCurrencyRowTooltip = (
  id: CraftingCurrencyIdType,
  tCraft: (key: string) => string,
): string => {
  switch (id) {
    case "orb_divine": {
      return tCraft("craftLab.divineDisabledHint");
    }
    case "orb_vaal": {
      return tCraft("craftLab.vaalOrbDisabledHint");
    }
    case "orb_mirror": {
      return tCraft("craftLab.mirrorDisabledHint");
    }
    case "orb_chance": {
      return tCraft("craftLab.chanceDisabledHint");
    }
    default: {
      return tCraft("craftLab.currencyTabDisabledGeneric");
    }
  }
};

const CRAFT_LAB_ORB_APPLY: Record<
  CraftingOrbFamilyIdType,
  (roll: IItemRoll, filters: IModRollBaseFiltersType | undefined) => IItemRoll
> = {
  orb_transmutation: (roll, filters) => applyOrbOfTransmutation(roll, filters),
  orb_augmentation: (roll, filters) => applyOrbOfAugmentation(roll, filters),
  orb_regal: (roll, filters) => applyRegalOrb(roll, filters),
  orb_alchemy: (roll, filters) => applyOrbOfAlchemy(roll, filters),
  orb_exalted: (roll, filters) => applyExaltedOrb(roll, filters),
  orb_fracturing: (roll) => applyFracturingOrb(roll),
  orb_chaos: (roll, filters) => applyChaosOrb(roll, filters),
  orb_annulment: (roll) => applyOrbOfAnnulment(roll),
};

export const CraftingLabWorkspace = (): ReactElement => {
  const t = useTranslations("simulator");

  const {
    selectedBaseItemRecord,
    selectedBaseItem,
    filteredBaseItemRecords,
    effectiveSelectedBaseItemKey,
    setSelectedBaseItemKey,
    isFilterOpen,
    setIsFilterOpen,
    equipmentTypeFilter,
    handleEquipmentTypeChange,
    normalizedSubTypeFilter,
    setSubTypeFilter,
    availableSubTypes,
    rangeFieldsProps,
  } = useItemSimulatorBaseItemPanelState();

  const modRollFilters = useMemo((): IModRollBaseFiltersType | undefined => {
    if (selectedBaseItemRecord === undefined) {
      return undefined;
    }
    return {
      baseItemSubType: selectedBaseItemRecord.subType,
      itemStatTags: selectedBaseItemRecord.statTags,
    };
  }, [selectedBaseItemRecord]);

  const [itemRoll, setItemRoll] = useState<IItemRoll>(EMPTY_NORMAL_ROLL);
  const [usageEvents, setUsageEvents] = useState<CraftingCurrencyIdType[]>([]);
  const [completionSnapshot, setCompletionSnapshot] = useState<
    CraftingCurrencyIdType[] | null
  >(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [stashValidationMessage, setStashValidationMessage] = useState<
    string | null
  >(null);
  const [undoStack, setUndoStack] = useState<CraftLabHistorySnapshotType[]>([]);
  const [redoStack, setRedoStack] = useState<CraftLabHistorySnapshotType[]>([]);
  const [craftLabMode, setCraftLabMode] = useState<CraftLabModeType>("random");
  const [simPreview, setSimPreview] =
    useState<CraftLabOrbPreviewResultType | null>(null);
  const [simPreviewLabel, setSimPreviewLabel] = useState<string>("");
  const [stashTab, setStashTab] = useState<CraftLabStashTabIdType>("currency");
  const [hinekoraHoverPreview, setHinekoraHoverPreview] =
    useState<IItemRoll | null>(null);
  const [essenceHoverPreview, setEssenceHoverPreview] =
    useState<IItemRoll | null>(null);
  const [activeStagedOmenIds, setActiveStagedOmenIds] = useState<
    CraftLabStagedOmenIdType[]
  >([]);
  const hasStagedLightOmen = activeStagedOmenIds.includes("omen_light");
  const hasStagedWhittlingOmen = activeStagedOmenIds.includes("omen_whittling");
  const stagedAbyssOmenForBone = useMemo(() => {
    return resolveStagedAbyssOmenForPreservedBone(activeStagedOmenIds);
  }, [activeStagedOmenIds]);
  const [soulWellReveal, setSoulWellReveal] =
    useState<SoulWellRevealStateType | null>(null);

  const hinekoraLockSessionKey = useMemo(() => {
    if (itemRoll.hinekoraLockActive !== true) {
      return null;
    }
    if (selectedBaseItemRecord === undefined) {
      return null;
    }
    const stripped = stripHinekoraLock(itemRoll);
    return JSON.stringify({
      baseItemKey: effectiveSelectedBaseItemKey,
      rarity: stripped.rarity,
      prefixes: stripped.prefixes,
      suffixes: stripped.suffixes,
      filters: modRollFilters,
    });
  }, [
    effectiveSelectedBaseItemKey,
    itemRoll,
    modRollFilters,
    selectedBaseItemRecord,
  ]);

  const hinekoraLockedDraftTable = useMemo(() => {
    return getCachedHinekoraLockedDraftTable(
      hinekoraLockSessionKey,
      modRollFilters,
      () => {
        const stripped = stripHinekoraLock(itemRoll);
        return buildHinekoraLockedDraftTable(
          stripped,
          itemRoll,
          modRollFilters,
          cloneItemRoll,
        );
      },
    );
  }, [hinekoraLockSessionKey, itemRoll, modRollFilters]);

  const resolveHinekoraHoverDraft = useCallback(
    (id: CraftingCurrencyIdType): IItemRoll | null => {
      if (
        itemRoll.hinekoraLockActive !== true ||
        craftLabMode !== "random" ||
        effectiveSelectedBaseItemKey.length === 0 ||
        selectedBaseItemRecord === undefined
      ) {
        return null;
      }
      if (id === "orb_hinekoras_lock") {
        return null;
      }
      if (HINEKORA_SKIP_CURRENCY_IDS.has(id)) {
        return null;
      }
      if (
        orbSlotIdToFamilyKind(id as CraftingLabOrbSlotIdType) === "orb_chaos" &&
        hasStagedWhittlingOmen
      ) {
        return null;
      }
      return hinekoraLockedDraftTable?.[id] ?? null;
    },
    [
      craftLabMode,
      effectiveSelectedBaseItemKey.length,
      hasStagedWhittlingOmen,
      hinekoraLockedDraftTable,
      itemRoll.hinekoraLockActive,
      selectedBaseItemRecord,
    ],
  );

  useEffect(() => {
    // 히네코라·에센스 호버 미리보기는 이전 롤·탭과 불일치하면 무효
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 동기 초기화만 수행
    setHinekoraHoverPreview(null);
    setEssenceHoverPreview(null);
  }, [craftLabMode, effectiveSelectedBaseItemKey, itemRoll, stashTab]);

  useEffect(() => {
    if (craftLabMode !== "random") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 모드 전환 시 패널만 닫음
      setSoulWellReveal(null);
    }
  }, [craftLabMode]);

  useEffect(() => {
    // 베이스가 바뀌면 롤·완료 스냅샷 초기화, 로컬에 동일 베이스 기록이 있으면 복원 후 저장
    // eslint-disable-next-line react-hooks/set-state-in-effect -- effective 베이스 변경 시 동기화
    setItemRoll(EMPTY_NORMAL_ROLL);
    setLastError(null);
    setCompletionSnapshot(null);
    setUndoStack([]);
    setRedoStack([]);
    setSimPreview(null);
    setSimPreviewLabel("");
    setStashValidationMessage(null);
    setSoulWellReveal(null);
    if (effectiveSelectedBaseItemKey.length === 0) {
      setUsageEvents([]);
      return;
    }
    const stored = readCraftingLabUsage();
    const restored: CraftingCurrencyIdType[] =
      stored !== null && stored.baseItemKey === effectiveSelectedBaseItemKey
        ? (stored.events.map(
            normalizeCraftingCurrencyEventId,
          ) as CraftingCurrencyIdType[])
        : [];
    setUsageEvents(restored);
    writeCraftingLabUsage({
      baseItemKey: effectiveSelectedBaseItemKey,
      events: restored,
    });
  }, [effectiveSelectedBaseItemKey]);

  const handleResetCraft = (): void => {
    if (
      effectiveSelectedBaseItemKey.length === 0 ||
      selectedBaseItemRecord === undefined
    ) {
      return;
    }
    setItemRoll(EMPTY_NORMAL_ROLL);
    setLastError(null);
    setUsageEvents([]);
    setCompletionSnapshot(null);
    setUndoStack([]);
    setRedoStack([]);
    setSimPreview(null);
    setSimPreviewLabel("");
    setStashValidationMessage(null);
    setActiveStagedOmenIds([]);
    setSoulWellReveal(null);
    writeCraftingLabUsage({
      baseItemKey: effectiveSelectedBaseItemKey,
      events: [],
    });
  };

  const handleUndoCraft = (): void => {
    if (effectiveSelectedBaseItemKey.length === 0 || undoStack.length === 0) {
      return;
    }
    const prev = undoStack[undoStack.length - 1];
    if (prev === undefined) {
      return;
    }
    setUndoStack((stack) => {
      return stack.slice(0, -1);
    });
    setRedoStack((stack) => {
      return [
        ...stack,
        makeHistorySnapshot(itemRoll, usageEvents, activeStagedOmenIds),
      ];
    });
    setItemRoll(enforceAtMostOneFracturedMod(prev.itemRoll));
    setUsageEvents(prev.usageEvents);
    setActiveStagedOmenIds(readStagedOmensFromSnapshot(prev));
    writeCraftingLabUsage({
      baseItemKey: effectiveSelectedBaseItemKey,
      events: prev.usageEvents,
    });
    setCompletionSnapshot(null);
    setLastError(null);
    setStashValidationMessage(null);
    setSoulWellReveal(null);
  };

  const handleRedoCraft = (): void => {
    if (effectiveSelectedBaseItemKey.length === 0 || redoStack.length === 0) {
      return;
    }
    const nextSnap = redoStack[redoStack.length - 1];
    if (nextSnap === undefined) {
      return;
    }
    setRedoStack((stack) => {
      return stack.slice(0, -1);
    });
    setUndoStack((stack) => {
      const appended = [
        ...stack,
        makeHistorySnapshot(itemRoll, usageEvents, activeStagedOmenIds),
      ];
      if (appended.length > MAX_CRAFT_UNDO_DEPTH) {
        return appended.slice(-MAX_CRAFT_UNDO_DEPTH);
      }
      return appended;
    });
    setItemRoll(enforceAtMostOneFracturedMod(nextSnap.itemRoll));
    setUsageEvents(nextSnap.usageEvents);
    setActiveStagedOmenIds(readStagedOmensFromSnapshot(nextSnap));
    writeCraftingLabUsage({
      baseItemKey: effectiveSelectedBaseItemKey,
      events: nextSnap.usageEvents,
    });
    setCompletionSnapshot(null);
    setLastError(null);
    setStashValidationMessage(null);
    setSoulWellReveal(null);
  };

  type CommitCraftLabOptionsType = {
    clearActiveStagedOmenId?: CraftLabStagedOmenIdType;
  };

  const commitCraftingResult = (
    nextRoll: IItemRoll,
    id: CraftingCurrencyIdType,
    options?: CommitCraftLabOptionsType,
  ): void => {
    const nextEvents = [...usageEvents, id];
    setUndoStack((stack) => {
      const appended = [
        ...stack,
        makeHistorySnapshot(itemRoll, usageEvents, activeStagedOmenIds),
      ];
      if (appended.length > MAX_CRAFT_UNDO_DEPTH) {
        return appended.slice(-MAX_CRAFT_UNDO_DEPTH);
      }
      return appended;
    });
    setRedoStack([]);
    setItemRoll(enforceAtMostOneFracturedMod(nextRoll));
    setUsageEvents(nextEvents);
    if (options?.clearActiveStagedOmenId !== undefined) {
      setActiveStagedOmenIds((prev) => {
        return prev.filter((id) => {
          return id !== options.clearActiveStagedOmenId;
        });
      });
    }
    writeCraftingLabUsage({
      baseItemKey: effectiveSelectedBaseItemKey,
      events: nextEvents,
    });
    setLastError(null);
    setStashValidationMessage(null);
    setCompletionSnapshot(null);
    setSimPreview(null);
    setSimPreviewLabel("");
    setSoulWellReveal(null);
  };

  const tryApply = (
    id: CraftingCurrencyIdType,
    apply: (
      roll: IItemRoll,
      filters: IModRollBaseFiltersType | undefined,
    ) => IItemRoll,
    options?: CommitCraftLabOptionsType,
  ): void => {
    if (
      effectiveSelectedBaseItemKey.length === 0 ||
      selectedBaseItemRecord === undefined
    ) {
      setLastError(t("itemSimulatorWorkspace.baseFilter.noResults"));
      return;
    }
    if (id === "orb_hinekoras_lock") {
      try {
        const nextRoll = applyHinekorasLock(itemRoll);
        commitCraftingResult(nextRoll, id, options);
      } catch (error: unknown) {
        setLastError(getErrorMessage(error));
      }
      return;
    }
    if (
      itemRoll.hinekoraLockActive === true &&
      craftLabMode === "random" &&
      !isCraftLabBoneId(id)
    ) {
      const draft = hinekoraLockedDraftTable?.[id];
      if (draft === undefined) {
        setLastError(t("craftLab.hinekoraDraftTableMissing"));
        return;
      }
      commitCraftingResult(draft, id, options);
      return;
    }
    try {
      const nextRoll = apply(stripHinekoraLock(itemRoll), modRollFilters);
      commitCraftingResult(nextRoll, id, options);
    } catch (error: unknown) {
      setLastError(getErrorMessage(error));
      setStashValidationMessage(null);
    }
  };

  const tryApplyPreservedBone = (boneId: CraftLabAbyssBoneIdType): void => {
    if (
      effectiveSelectedBaseItemKey.length === 0 ||
      selectedBaseItemRecord === undefined
    ) {
      setLastError(t("itemSimulatorWorkspace.baseFilter.noResults"));
      return;
    }
    const boneDef = getBoneDefinition(boneId);
    if (boneDef === undefined) {
      return;
    }
    if (craftLabMode === "simulation") {
      setSimPreview({
        status: "ok",
        noteKeys: ["boneSimulationNote"],
        sections: [],
      });
      setSimPreviewLabel(t(`currency.${boneId}`));
      setLastError(null);
      return;
    }
    const stagedForBone = stagedAbyssOmenForBone;
    tryApply(
      boneId,
      (roll, filters) => {
        return applyPreservedBone(roll, boneDef, filters, stagedForBone);
      },
      {
        clearActiveStagedOmenId: stagedForBone ?? undefined,
      },
    );
  };

  const isOrbApplicableForLab = useCallback(
    (id: CraftingLabOrbSlotIdType, roll: IItemRoll): boolean => {
      const family = orbSlotIdToFamilyKind(id);
      if (family === "orb_annulment" && hasStagedLightOmen) {
        return canApplyOrbOfAnnulmentDesecratedOnly(roll);
      }
      return isCraftLabOrbSlotApplicable(id, roll);
    },
    [hasStagedLightOmen],
  );

  const hasBaseForCraft = selectedBaseItemRecord !== undefined;
  const activeStagedOmenSlotIds = useMemo(() => {
    return activeStagedOmenIds.slice(0, MAX_ACTIVE_STAGED_OMEN_COUNT);
  }, [activeStagedOmenIds]);

  const toggleStagedOmen = useCallback(
    (omenId: CraftLabStagedOmenIdType): void => {
      setActiveStagedOmenIds((prev) => {
        if (prev.includes(omenId)) {
          return prev.filter((id) => {
            return id !== omenId;
          });
        }
        if (prev.length >= MAX_ACTIVE_STAGED_OMEN_COUNT) {
          return [...prev.slice(1), omenId];
        }
        return [...prev, omenId];
      });
    },
    [],
  );

  const handleUnrevealedDesecratedModClick = useCallback(
    (payload: { affixKind: "prefix" | "suffix"; slotIndex: number }) => {
      if (craftLabMode !== "random" || selectedBaseItemRecord === undefined) {
        return;
      }
      const list =
        payload.affixKind === "prefix" ? itemRoll.prefixes : itemRoll.suffixes;
      const mod = list[payload.slotIndex];
      if (!isUnrevealedDesecratedMod(mod)) {
        return;
      }
      try {
        const candidates = rollSoulWellRevealCandidates(
          itemRoll,
          payload.affixKind,
          modRollFilters,
        );
        setSoulWellReveal({
          affixKind: payload.affixKind,
          slotIndex: payload.slotIndex,
          candidates,
        });
        setLastError(null);
      } catch (error: unknown) {
        setLastError(getErrorMessage(error));
        setSoulWellReveal(null);
      }
    },
    [craftLabMode, itemRoll, modRollFilters, selectedBaseItemRecord],
  );

  const handleSoulWellConfirmChoice = (chosen: IModDefinition): void => {
    if (soulWellReveal === null) {
      return;
    }
    try {
      const nextRoll = applySoulWellRevealChoice(
        itemRoll,
        soulWellReveal.affixKind,
        soulWellReveal.slotIndex,
        chosen,
      );
      commitCraftingResult(nextRoll, "soul_well_reveal");
    } catch (error: unknown) {
      setLastError(getErrorMessage(error));
    }
  };

  const usageTotalsLine = useMemo(() => {
    if (completionSnapshot === null || completionSnapshot.length === 0) {
      return "";
    }
    const counts = aggregateUsageCounts(completionSnapshot);
    const seen = new Set<string>();
    const order: CraftingCurrencyIdType[] = [];
    for (const id of completionSnapshot) {
      if (!seen.has(id)) {
        seen.add(id);
        order.push(id);
      }
    }
    return order
      .map((id) => {
        return `${t(`currency.${id}`)} ×${String(counts.get(id) ?? 0)}`;
      })
      .join(", ");
  }, [completionSnapshot, t]);

  const renderCraftLabOrbSlot = (
    id: CraftingLabOrbSlotIdType,
  ): ReactElement => {
    const applicable = isOrbApplicableForLab(id, itemRoll);
    const family = orbSlotIdToFamilyKind(id);
    const applyOrb =
      family === "orb_annulment" && hasStagedLightOmen
        ? (roll: IItemRoll, filters: IModRollBaseFiltersType | undefined) => {
            void filters;
            return applyOrbOfAnnulmentDesecratedOnly(roll);
          }
        : family === "orb_chaos" && hasStagedWhittlingOmen
          ? (roll: IItemRoll, filters: IModRollBaseFiltersType | undefined) => {
              return applyChaosOrbWithWhittling(roll, filters);
            }
          : CRAFT_LAB_ORB_APPLY[family];
    const orbCommitOpts =
      family === "orb_annulment" && hasStagedLightOmen
        ? { clearActiveStagedOmenId: "omen_light" as const }
        : family === "orb_chaos" && hasStagedWhittlingOmen
          ? { clearActiveStagedOmenId: "omen_whittling" as const }
          : undefined;
    const name = t(`currency.${id}`);
    const hoverHint = t(`currencyHoverHint.${id}`);
    const orbBlockedReason = applicable ? undefined : t("craftLab.orbDisabledTooltip");
    const iconSrc = getCraftingLabCurrencyIconUrl(id);
    const tierRoman = getOrbSlotTierRoman(id);
    return (
      <CraftingLabOrbSlotButton
        key={id}
        iconSrc={iconSrc}
        applicable={applicable}
        currencyName={name}
        hoverHint={hoverHint}
        disabledReason={orbBlockedReason}
        onBlockedClick={() => {
          if (orbBlockedReason !== undefined) {
            setStashValidationMessage(orbBlockedReason);
          }
        }}
        onUse={() => {
          if (craftLabMode === "simulation") {
            if (!applicable) {
              return;
            }
            const prev = buildCraftLabOrbPreview(
              family,
              stripHinekoraLock(itemRoll),
              modRollFilters,
            );
            setSimPreview(prev);
            setSimPreviewLabel(name);
            setLastError(null);
            setStashValidationMessage(null);
            return;
          }
          tryApply(id, applyOrb, orbCommitOpts);
        }}
        onHoverChange={(hovered) => {
          if (!hovered) {
            setHinekoraHoverPreview(null);
            return;
          }
          setEssenceHoverPreview(null);
          setHinekoraHoverPreview(resolveHinekoraHoverDraft(id));
        }}
        tierRoman={tierRoman}
        ariaLabel={
          applicable
            ? craftLabMode === "simulation"
              ? t("craftLab.orbSimulateAria", { name })
              : name
            : t("craftLab.orbDisabledAria", { name })
        }
        showQuantityBadge={applicable}
        quantityLabel={t("craftLab.stashOrbQuantityUnlimited")}
        strongDisabled={id === "orb_fracturing" && !applicable}
      />
    );
  };

  const renderCraftLabMiscGridCell = (
    id: CraftingCurrencyIdType,
  ): ReactElement => {
    if (
      id === "orb_alchemy" ||
      id === "orb_annulment" ||
      id === "orb_fracturing"
    ) {
      return renderCraftLabOrbSlot(id);
    }

    const iconSrc = getCraftingLabCurrencyIconUrl(id);
    const name = t(`currency.${id}`);
    const hoverHint = t(`currencyHoverHint.${id}`);

    if (id === "orb_hinekoras_lock") {
      const hinekoraApplicable = canApplyHinekorasLock(itemRoll);
      const hinekoraBlockedReason = hinekoraApplicable
        ? undefined
        : t("craftLab.hinekoraLockAlreadyActive");
      return (
        <CraftingLabOrbSlotButton
          key={id}
          iconSrc={iconSrc}
          applicable={hinekoraApplicable}
          currencyName={name}
          hoverHint={hoverHint}
          disabledReason={hinekoraBlockedReason}
          onBlockedClick={() => {
            if (hinekoraBlockedReason !== undefined) {
              setStashValidationMessage(hinekoraBlockedReason);
            }
          }}
          onUse={() => {
            if (craftLabMode === "simulation") {
              setLastError(t("craftLab.hinekoraLockNoSimPreview"));
              return;
            }
            tryApply("orb_hinekoras_lock", (roll) => {
              return applyHinekorasLock(roll);
            });
          }}
          onHoverChange={(hovered) => {
            if (!hovered) {
              setHinekoraHoverPreview(null);
              return;
            }
            setEssenceHoverPreview(null);
            setHinekoraHoverPreview(resolveHinekoraHoverDraft(id));
          }}
          tierRoman={null}
          ariaLabel={
            hinekoraApplicable ? name : t("craftLab.orbDisabledAria", { name })
          }
          showQuantityBadge={hinekoraApplicable}
          quantityLabel={t("craftLab.stashOrbQuantityUnlimited")}
        />
      );
    }

    const rowDisabledReason = getCraftLabDisabledCurrencyRowTooltip(id, t);
    return (
      <CraftingLabOrbSlotButton
        key={id}
        iconSrc={iconSrc}
        applicable={false}
        currencyName={name}
        hoverHint={hoverHint}
        disabledReason={rowDisabledReason}
        onBlockedClick={() => {
          setStashValidationMessage(rowDisabledReason);
        }}
        onUse={() => {}}
        onHoverChange={(hovered) => {
          if (!hovered) {
            setHinekoraHoverPreview(null);
            return;
          }
          setEssenceHoverPreview(null);
          setHinekoraHoverPreview(resolveHinekoraHoverDraft(id));
        }}
        tierRoman={null}
        ariaLabel={name}
        showQuantityBadge={false}
        quantityLabel=""
      />
    );
  };

  const renderAbyssBoneSlot = (
    boneId: CraftLabAbyssBoneIdType,
  ): ReactElement | null => {
    const boneDef = getBoneDefinition(boneId);
    if (boneDef === undefined) {
      return null;
    }
    const name = t(`currency.${boneId}`);
    const hoverHint = t(`currencyHoverHint.${boneId}`);
    const boneOk = canApplyPreservedBone(itemRoll, boneDef, modRollFilters);
    const boneDisabledInRandom = craftLabMode !== "random" || !boneOk;
    const boneDisabledTitle = boneDisabledInRandom
      ? !boneOk
        ? itemRoll.rarity !== "rare"
          ? t("craftLab.boneRequiresRare")
          : itemRoll.isCorrupted === true
            ? t("craftLab.boneCorrupted")
            : t("craftLab.boneWrongSlotOrFull")
        : t("craftLab.boneRequiresRandomMode")
      : undefined;
    return (
      <CraftingLabOrbSlotButton
        key={boneId}
        iconSrc={getCraftingLabCurrencyIconUrl(boneId)}
        applicable={!boneDisabledInRandom}
        currencyName={name}
        hoverHint={hoverHint}
        disabledReason={boneDisabledTitle}
        onBlockedClick={() => {
          if (boneDisabledTitle !== undefined) {
            setStashValidationMessage(boneDisabledTitle);
          }
        }}
        onUse={() => {
          tryApplyPreservedBone(boneId);
        }}
        onHoverChange={(hovered) => {
          if (hovered) {
            setHinekoraHoverPreview(null);
            setEssenceHoverPreview(null);
          }
        }}
        tierRoman={null}
        ariaLabel={boneDisabledInRandom ? t("craftLab.orbDisabledAria", { name }) : name}
        showQuantityBadge
        quantityLabel={t("craftLab.stashOrbQuantityUnlimited")}
      />
    );
  };

  return (
    <div className="flex w-full flex-col items-center bg-zinc-50 dark:bg-black px-4 py-8 sm:px-6 sm:py-10">
      <div className="w-full max-w-6xl flex flex-col gap-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2 min-w-0">
            <h1 className="font-sc text-2xl font-bold text-zinc-950 dark:text-zinc-50">
              {t("craftLab.title")}
            </h1>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 max-w-3xl">
              {t("craftLab.intro")}
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              <Link
                href="/"
                className="text-amber-700 dark:text-amber-400 underline-offset-2 hover:underline"
              >
                {t("craftLab.navToSimulator")}
              </Link>
            </p>
          </div>
          <LocaleSwitcher />
        </header>

        <ReservedStatusRegion
          minHeightClass="min-h-[4.5rem]"
          isEmpty={lastError === null}
          placeholderTextClassName="text-sm leading-snug"
        >
          {lastError !== null ? (
            <p
              className="text-sm leading-snug text-red-600 dark:text-red-400"
              role="alert"
            >
              {t("craftLab.lastActionError", { message: lastError })}
            </p>
          ) : null}
        </ReservedStatusRegion>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
          <section
            className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-sm flex flex-col gap-4"
            aria-labelledby="craft-lab-item-heading"
          >
            <div className="flex flex-wrap items-start gap-3">
              <button
                type="button"
                disabled={!hasBaseForCraft}
                onClick={() => {
                  handleResetCraft();
                }}
                aria-label={t("craftLab.resetItem")}
                className="shrink-0 rounded-lg border border-zinc-300 dark:border-zinc-600 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none"
              >
                {t("craftLab.baseSectionReset")}
              </button>
              <div className="min-w-0 flex-1">
                <h2
                  id="craft-lab-item-heading"
                  className="font-sc text-base font-semibold text-zinc-900 dark:text-zinc-50"
                >
                  {t("itemSimulatorWorkspace.panels.baseItem.title")}
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  {t("itemSimulatorWorkspace.panels.baseItem.description")}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {hasBaseForCraft ? (
                <ReservedStatusRegion
                  minHeightClass="min-h-[2.75rem]"
                  isEmpty={itemRoll.hinekoraLockActive !== true}
                  placeholderTextClassName="text-xs leading-snug"
                >
                  {itemRoll.hinekoraLockActive === true ? (
                    <p
                      className="text-xs font-medium text-amber-800 dark:text-amber-300/95"
                      role="status"
                    >
                      {t("craftLab.hinekoraLockActiveBanner")}
                    </p>
                  ) : null}
                </ReservedStatusRegion>
              ) : null}
              <div className="min-h-[280px] flex flex-col justify-start">
                {selectedBaseItemRecord ? (
                  <ItemSimulatorBaseItemTooltipCard
                    record={selectedBaseItemRecord}
                    baseItemKey={selectedBaseItem?.baseItemKey ?? ""}
                    explicitItemRoll={itemRoll}
                    previewExplicitItemRoll={
                      essenceHoverPreview ?? hinekoraHoverPreview
                    }
                    onUnrevealedDesecratedModClick={
                      craftLabMode === "random"
                        ? handleUnrevealedDesecratedModClick
                        : undefined
                    }
                    soulWellInteractionDisabled={
                      essenceHoverPreview !== null ||
                      hinekoraHoverPreview !== null
                    }
                  />
                ) : (
                  <p className="text-sm text-zinc-400 dark:text-zinc-500 py-1">
                    {t("itemSimulatorWorkspace.baseFilter.noResults")}
                  </p>
                )}
              </div>

              {soulWellReveal !== null ? (
                <div
                  className="rounded-xl border border-emerald-900/40 bg-emerald-950/15 dark:bg-emerald-950/25 p-3 flex flex-col gap-2"
                  role="region"
                  aria-labelledby="craft-lab-soul-well-heading"
                >
                  <h3
                    id="craft-lab-soul-well-heading"
                    className="text-xs font-semibold text-emerald-800 dark:text-emerald-200/95"
                  >
                    {t("craftLab.soulWellRevealTitle")}
                  </h3>
                  <p className="text-[11px] leading-snug text-zinc-600 dark:text-zinc-400">
                    {t("craftLab.soulWellRevealHint")}
                  </p>
                  <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                    {soulWellReveal.candidates.map((cand, idx) => {
                      return (
                        <li key={`${cand.modKey}-${String(idx)}`}>
                          <button
                            type="button"
                            onClick={() => {
                              handleSoulWellConfirmChoice(cand);
                            }}
                            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white/80 dark:bg-zinc-900/80 px-2.5 py-2 text-left text-xs leading-snug text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            aria-label={t("craftLab.soulWellRevealCandidateAria", {
                              index: idx + 1,
                            })}
                          >
                            <span className="text-[10px] font-medium tabular-nums text-zinc-500 dark:text-zinc-400">
                              T{cand.tier}
                            </span>{" "}
                            {cand.modKey.startsWith("essence_forced_") ? (
                              <span>{cand.displayName}</span>
                            ) : (
                              <SimulatorModTemplateText
                                nameTemplateKey={cand.displayName}
                              />
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <button
                    type="button"
                    onClick={() => {
                      setSoulWellReveal(null);
                    }}
                    className="self-start rounded-lg border border-zinc-300 dark:border-zinc-600 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    {t("craftLab.soulWellRevealCancel")}
                  </button>
                </div>
              ) : null}

              <ItemSimulatorBaseItemSearchBlock
                filteredBaseItemRecords={filteredBaseItemRecords}
                effectiveSelectedBaseItemKey={effectiveSelectedBaseItemKey}
                onSelectBaseItemKey={(key) => {
                  setSelectedBaseItemKey(key);
                }}
                searchPlaceholder={t("itemSimulatorWorkspace.baseFilter.baseItemSearchPlaceholder", {
                  label: t("itemSimulatorWorkspace.baseFilter.baseItem"),
                  count: filteredBaseItemRecords.length,
                })}
                ariaLabelBaseItem={t("itemSimulatorWorkspace.baseFilter.baseItem")}
                noResultsLabel={t("itemSimulatorWorkspace.baseFilter.noResults")}
              />

              <ItemSimulatorBaseItemFilterCollapsible
                isOpen={isFilterOpen}
                onToggle={() => {
                  setIsFilterOpen((prev) => {
                    return !prev;
                  });
                }}
                equipmentTypeFilter={equipmentTypeFilter}
                onEquipmentTypeChange={handleEquipmentTypeChange}
                normalizedSubTypeFilter={normalizedSubTypeFilter}
                onSubTypeChange={setSubTypeFilter}
                availableSubTypes={availableSubTypes}
                rangeFieldsProps={rangeFieldsProps}
              />
            </div>
          </section>

          <section
            className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-sm flex flex-col gap-2.5"
            aria-labelledby="craft-lab-stash-heading"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2
                id="craft-lab-stash-heading"
                className="font-sc text-base font-semibold text-zinc-900 dark:text-zinc-50"
              >
                {t("craftLab.stashColumnTitle")}
              </h2>
              <div className="flex flex-wrap items-center justify-end gap-1.5 shrink-0">
                <button
                  type="button"
                  disabled={!hasBaseForCraft || undoStack.length === 0}
                  onClick={() => {
                    handleUndoCraft();
                  }}
                  aria-label={t("craftLab.undoCraftAria")}
                  className="rounded-lg border border-zinc-300 dark:border-zinc-600 px-2.5 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none"
                >
                  {t("craftLab.undoCraft")}
                </button>
                <button
                  type="button"
                  disabled={!hasBaseForCraft || redoStack.length === 0}
                  onClick={() => {
                    handleRedoCraft();
                  }}
                  aria-label={t("craftLab.redoCraftAria")}
                  className="rounded-lg border border-zinc-300 dark:border-zinc-600 px-2.5 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none"
                >
                  {t("craftLab.redoCraft")}
                </button>
                <button
                  type="button"
                  disabled={!hasBaseForCraft || usageEvents.length === 0}
                  onClick={() => {
                    setCompletionSnapshot([...usageEvents]);
                  }}
                  className="rounded-lg border border-amber-400/60 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 text-xs font-medium text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/50 disabled:opacity-40 disabled:pointer-events-none"
                >
                  {t("craftLab.craftCompleteButton")}
                </button>
              </div>
            </div>

            {!hasBaseForCraft ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {t("craftLab.stashPickBaseForCurrencies")}
              </p>
            ) : (
              <>
                <fieldset className="min-w-0 border-0 p-0 m-0">
                  <legend className="sr-only">{t("craftLab.craftModeLegend")}</legend>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <div
                      className="flex flex-col items-start gap-1.5"
                      role="radiogroup"
                      aria-label={t("craftLab.craftModeLegend")}
                    >
                      <h3 className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 shrink-0">
                        {t("craftLab.craftModeLabel")}
                      </h3>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={craftLabMode === "random"}
                        onClick={() => {
                          setCraftLabMode("random");
                          setSimPreview(null);
                          setSimPreviewLabel("");
                          setStashValidationMessage(null);
                        }}
                        className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${
                          craftLabMode === "random"
                            ? "border-amber-500/70 bg-amber-950/50 text-amber-100"
                            : "border-zinc-600 text-zinc-400 hover:bg-zinc-800"
                        }`}
                      >
                        {t("craftLab.craftModeRandom")}
                      </button>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={craftLabMode === "simulation"}
                        onClick={() => {
                          setCraftLabMode("simulation");
                          setStashValidationMessage(null);
                        }}
                        className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${
                          craftLabMode === "simulation"
                            ? "border-sky-500/70 bg-sky-950/40 text-sky-100"
                            : "border-zinc-600 text-zinc-400 hover:bg-zinc-800"
                        }`}
                      >
                        {t("craftLab.craftModeSimulation")}
                      </button>
                    </div>
                    <div
                      className="flex flex-col items-start gap-1.5"
                      aria-labelledby="craft-lab-staged-omen-panel-heading"
                    >
                      <h3
                        id="craft-lab-staged-omen-panel-heading"
                        className="text-[11px] font-semibold uppercase tracking-wide text-zinc-300"
                      >
                        {t("craftLab.stagedOmenPanelHeading")}
                      </h3>
                      <div
                        className="grid grid-cols-3 gap-1.5 sm:gap-2"
                        role="status"
                      >
                        {Array.from({
                          length: MAX_ACTIVE_STAGED_OMEN_COUNT,
                        }).map((_, index) => {
                          const omenId = activeStagedOmenSlotIds[index];
                          if (omenId === undefined) {
                            return (
                              <div
                                key={`empty-staged-omen-slot-${String(index)}`}
                                className="h-9 w-9 rounded-sm border border-[#3a3228]/85 bg-[#181410]/95 shadow-[inset_0_0_6px_rgba(0,0,0,0.65)] sm:h-10 sm:w-10"
                                aria-hidden="true"
                              />
                            );
                          }
                          const name = t(`currency.${omenId}`);
                          return (
                            <CraftingLabOrbSlotButton
                              key={`active-staged-omen-slot-${omenId}`}
                              iconSrc={getCraftingLabCurrencyIconUrl(omenId)}
                              applicable
                              currencyName={name}
                              hoverHint={t("craftLab.stagedOmenPanelSlotHint")}
                              onUse={() => {
                                toggleStagedOmen(omenId);
                                setStashValidationMessage(null);
                                setLastError(null);
                              }}
                              onHoverChange={(hovered) => {
                                if (hovered) {
                                  setHinekoraHoverPreview(null);
                                  setEssenceHoverPreview(null);
                                }
                              }}
                              tierRoman={null}
                              ariaLabel={t("craftLab.omenSelectedAria", { name })}
                              showQuantityBadge={false}
                              quantityLabel=""
                              isSelected
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </fieldset>

                <div
                  role="tablist"
                  aria-label={t("craftLab.stashTabListAria")}
                  className="flex flex-wrap gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100/80 p-1 dark:bg-zinc-900/50"
                >
                  {CRAFT_LAB_STASH_TABS.map((tabId) => {
                    const isSelected = stashTab === tabId;
                    return (
                      <button
                        key={tabId}
                        id={`craft-stash-tab-${tabId}`}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        aria-controls={`craft-stash-panel-${tabId}`}
                        onClick={() => {
                          setStashTab(tabId);
                          setStashValidationMessage(null);
                        }}
                        className={`rounded-md px-3 py-1.5 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500/80 ${
                          isSelected
                            ? "bg-amber-600/90 text-white shadow-sm dark:bg-amber-700/90"
                            : "text-zinc-600 hover:bg-zinc-200/90 dark:text-zinc-400 dark:hover:bg-zinc-800/90"
                        }`}
                      >
                        {t(CRAFT_LAB_STASH_TAB_LABEL_KEYS[tabId])}
                      </button>
                    );
                  })}
                </div>

                <div className="min-h-0">
                  <div
                    id="craft-stash-panel-currency"
                    role="tabpanel"
                    aria-labelledby="craft-stash-tab-currency"
                    hidden={stashTab !== "currency"}
                    className={stashTab !== "currency" ? "hidden" : undefined}
                  >
                    <div className="rounded-lg border border-[#3d3429] bg-[#141210] p-2 shadow-[inset_0_2px_8px_rgba(0,0,0,0.45)] dark:bg-[#141210]">
                      <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-center sm:gap-5">
                        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:gap-2.5">
                          {getCraftLabOrbSlotIdsGrouped().map(
                            (rowSlotIds, rowIndex) => {
                              return (
                                <div
                                  key={`${String(rowIndex)}-orb-row`}
                                  className="w-full min-w-0 flex justify-center sm:justify-start"
                                >
                                  <div className="grid w-max max-w-full grid-cols-3 gap-1.5 sm:gap-2">
                                    {rowSlotIds.map((slotId) => {
                                      return renderCraftLabOrbSlot(slotId);
                                    })}
                                  </div>
                                </div>
                              );
                            },
                          )}
                        </div>
                        <div
                          className="flex shrink-0 flex-col items-center gap-2 sm:gap-2.5"
                          aria-label={t("craftLab.currencyMiscGridAria")}
                        >
                          {CRAFT_LAB_CURRENCY_MISC_GRID_ROWS.map(
                            (row, rowIndex) => {
                              const colCount = row.length;
                              return (
                                <div
                                  key={`misc-currency-row-${String(rowIndex)}`}
                                  className={`grid w-max justify-items-center gap-1.5 sm:gap-2 ${
                                    colCount === 2
                                      ? "grid-cols-2"
                                      : "grid-cols-3"
                                  }`}
                                >
                                  {row.map((miscId) => {
                                    return renderCraftLabMiscGridCell(miscId);
                                  })}
                                </div>
                              );
                            },
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    id="craft-stash-panel-essence"
                    role="tabpanel"
                    aria-labelledby="craft-stash-tab-essence"
                    hidden={stashTab !== "essence"}
                    className={stashTab !== "essence" ? "hidden" : undefined}
                  >
                    <div className="rounded-lg border border-[#3d3429] bg-[#141210] p-2 shadow-[inset_0_2px_8px_rgba(0,0,0,0.45)] dark:bg-[#141210]">
                      <div className="mx-auto max-h-[min(70vh,28rem)] w-max max-w-full overflow-y-auto overflow-x-hidden pr-0.5">
                        <div className="mx-auto grid w-max grid-cols-3 gap-1.5 sm:gap-2">
                          {CRAFT_LAB_ESSENCE_DEFINITIONS.map((essenceDef) => {
                            const id = essenceDef.essenceKey;
                            const name = t(`currency.${id}`);
                            const hoverHint = t(
                              `currencyHoverHint.${essenceDef.essenceFamilyKey}`,
                            );
                            const essenceApplicable = canApplyEssence(
                              itemRoll,
                              essenceDef,
                              modRollFilters,
                            );
                            const essenceDisabledInRandom =
                              craftLabMode !== "simulation" &&
                              !essenceApplicable;
                            const essenceDisabledTitle = essenceDisabledInRandom
                              ? itemRoll.rarity !== "magic"
                                ? t("craftLab.essenceRequiresMagicItem")
                                : t("craftLab.essenceIncompatibleBase")
                              : undefined;
                            return (
                              <CraftingLabOrbSlotButton
                                key={id}
                                iconSrc={getCraftingLabCurrencyIconUrl(id)}
                                applicable={!essenceDisabledInRandom}
                                currencyName={name}
                                hoverHint={hoverHint}
                                disabledReason={essenceDisabledTitle}
                                onBlockedClick={() => {
                                  if (essenceDisabledTitle !== undefined) {
                                    setStashValidationMessage(
                                      essenceDisabledTitle,
                                    );
                                  }
                                }}
                                onUse={() => {
                                  if (craftLabMode === "simulation") {
                                    setSimPreview({
                                      status: "ok",
                                      noteKeys: ["essenceSimulationNote"],
                                      sections: [],
                                    });
                                    setSimPreviewLabel(name);
                                    setLastError(null);
                                    setStashValidationMessage(null);
                                    return;
                                  }
                                  tryApply(id as CraftingCurrencyIdType, (roll, filters) => {
                                    return applyEssence(
                                      roll,
                                      essenceDef,
                                      filters,
                                    );
                                  });
                                }}
                                onHoverChange={(hovered) => {
                                  if (!hovered) {
                                    setEssenceHoverPreview(null);
                                    return;
                                  }
                                  setHinekoraHoverPreview(null);
                                  setEssenceHoverPreview(
                                    buildEssenceGuaranteedModPreviewRoll(
                                      itemRoll,
                                      essenceDef,
                                      modRollFilters,
                                    ),
                                  );
                                }}
                                tierRoman={getOrbSlotTierRoman(id)}
                                ariaLabel={
                                  essenceDisabledInRandom
                                    ? t("craftLab.orbDisabledAria", { name })
                                    : craftLabMode === "simulation"
                                      ? t("craftLab.orbSimulateAria", {
                                          name,
                                        })
                                      : name
                                }
                                showQuantityBadge
                                quantityLabel={t("craftLab.stashOrbQuantityUnlimited")}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    id="craft-stash-panel-abyss"
                    role="tabpanel"
                    aria-labelledby="craft-stash-tab-abyss"
                    hidden={stashTab !== "abyss"}
                    className={stashTab !== "abyss" ? "hidden" : undefined}
                  >
                    <p className="mb-1 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
                      {t("craftLab.abyssTabHint")}
                    </p>
                    <div className="rounded-lg border border-[#3d3429] bg-[#141210] p-2 shadow-[inset_0_2px_8px_rgba(0,0,0,0.45)] dark:bg-[#141210]">
                      <div className="w-full min-w-0">
                        <div className="flex flex-col gap-2.5 md:flex-row md:items-start md:justify-between md:gap-3.5">
                          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
                            <div className="grid w-max grid-cols-3 gap-1.5 sm:gap-2">
                              {CRAFT_LAB_ABYSS_BONE_GRID.flat().map(
                                (boneId) => {
                                  return renderAbyssBoneSlot(boneId);
                                },
                              )}
                            </div>
                            <div
                              className={[
                                "flex w-max shrink-0 flex-col justify-start",
                                "border-t border-[#3d3429]/80 pt-3 sm:border-l sm:border-t-0 sm:pt-0 sm:pl-4 dark:border-zinc-700/80",
                              ].join(" ")}
                            >
                              {renderAbyssBoneSlot(
                                CRAFT_LAB_ABYSS_BONE_CRANIUM_ID,
                              )}
                            </div>
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col gap-1.5 md:max-w-none lg:max-w-md">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                              {t("craftLab.abyssTabAbyssOmensHeading")}
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5 sm:gap-2">
                              {CRAFT_LAB_ABYSS_OMEN_IDS.map((omenId) => {
                                const name = t(`currency.${omenId}`);
                                const hoverHint = t(
                                  `currencyHoverHint.${omenId}`,
                                );
                                const isSelected =
                                  activeStagedOmenIds.includes(omenId);
                                return (
                                  <CraftingLabOrbSlotButton
                                    key={omenId}
                                    iconSrc={getCraftingLabCurrencyIconUrl(
                                      omenId,
                                    )}
                                    applicable
                                    currencyName={name}
                                    hoverHint={hoverHint}
                                    isSelected={isSelected}
                                    onUse={() => {
                                      const willClearSelection =
                                        activeStagedOmenIds.includes(omenId);
                                      if (craftLabMode === "simulation") {
                                        if (willClearSelection) {
                                          setSimPreview({
                                            status: "ok",
                                            noteKeys: ["omenPreview_cleared"],
                                            sections: [],
                                          });
                                        } else {
                                          setSimPreview({
                                            status: "ok",
                                            noteKeys: [
                                              getCraftLabOmenPreviewNoteKey(
                                                omenId,
                                              ),
                                            ],
                                            sections: [],
                                          });
                                        }
                                        setSimPreviewLabel(name);
                                        setLastError(null);
                                        setStashValidationMessage(null);
                                      }
                                      toggleStagedOmen(omenId);
                                      if (craftLabMode !== "simulation") {
                                        setLastError(null);
                                        setStashValidationMessage(null);
                                      }
                                    }}
                                    onHoverChange={(hovered) => {
                                      if (hovered) {
                                        setHinekoraHoverPreview(null);
                                        setEssenceHoverPreview(null);
                                      }
                                    }}
                                    tierRoman={null}
                                    ariaLabel={
                                      craftLabMode === "simulation"
                                        ? t("craftLab.orbSimulateAria", { name })
                                        : isSelected
                                          ? t("craftLab.omenSelectedAria", { name })
                                          : t("craftLab.omenToggleAria", { name })
                                    }
                                    showQuantityBadge={false}
                                    quantityLabel=""
                                  />
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    id="craft-stash-panel-ritual"
                    role="tabpanel"
                    aria-labelledby="craft-stash-tab-ritual"
                    hidden={stashTab !== "ritual"}
                    className={stashTab !== "ritual" ? "hidden" : undefined}
                  >
                    <p className="mb-1 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
                      {t("craftLab.ritualTabHint")}
                    </p>
                    <p className="mb-1 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
                      {t("craftLab.ritualOmenSimulationNote")}
                    </p>
                    <div className="rounded-lg border border-[#3d3429] bg-[#141210] p-2 shadow-[inset_0_2px_8px_rgba(0,0,0,0.45)] dark:bg-[#141210]">
                      <div className="mx-auto max-h-[min(70vh,28rem)] w-max max-w-full overflow-y-auto overflow-x-hidden pr-0.5">
                        <div className="mx-auto grid w-max grid-cols-3 gap-1.5 sm:gap-2">
                          {CRAFT_LAB_RITUAL_OMEN_IDS.map((omenId) => {
                            const name = t(`currency.${omenId}`);
                            const hoverHint = t(`currencyHoverHint.${omenId}`);
                            const isSelected =
                              activeStagedOmenIds.includes(omenId);
                            return (
                              <CraftingLabOrbSlotButton
                                key={omenId}
                                iconSrc={getCraftingLabCurrencyIconUrl(omenId)}
                                applicable
                                currencyName={name}
                                hoverHint={hoverHint}
                                isSelected={isSelected}
                                onUse={() => {
                                  const willClearSelection =
                                    activeStagedOmenIds.includes(omenId);
                                  if (craftLabMode === "simulation") {
                                    if (willClearSelection) {
                                      setSimPreview({
                                        status: "ok",
                                        noteKeys: ["omenPreview_cleared"],
                                        sections: [],
                                      });
                                    } else {
                                      setSimPreview({
                                        status: "ok",
                                        noteKeys: [
                                          getCraftLabOmenPreviewNoteKey(omenId),
                                        ],
                                        sections: [],
                                      });
                                    }
                                    setSimPreviewLabel(name);
                                    setLastError(null);
                                    setStashValidationMessage(null);
                                  }
                                  toggleStagedOmen(omenId);
                                  if (craftLabMode !== "simulation") {
                                    setLastError(null);
                                    setStashValidationMessage(null);
                                  }
                                }}
                                onHoverChange={(hovered) => {
                                  if (hovered) {
                                    setHinekoraHoverPreview(null);
                                    setEssenceHoverPreview(null);
                                  }
                                }}
                                tierRoman={null}
                                ariaLabel={
                                  craftLabMode === "simulation"
                                    ? t("craftLab.orbSimulateAria", { name })
                                    : isSelected
                                      ? t("craftLab.omenSelectedAria", { name })
                                      : t("craftLab.omenToggleAria", { name })
                                }
                                showQuantityBadge={false}
                                quantityLabel=""
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {stashValidationMessage !== null ? (
                  <div
                    className="w-full shrink-0 px-0.5 pt-1"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    <p
                      className="text-xs leading-snug text-amber-900 dark:text-amber-200/95"
                      role="status"
                    >
                      {stashValidationMessage}
                    </p>
                  </div>
                ) : null}

                {simPreview !== null ? (
                  <div className="mt-1.5">
                    <CraftingLabOrbPreviewPanel
                      orbLabel={simPreviewLabel}
                      preview={simPreview}
                      onClose={() => {
                        setSimPreview(null);
                        setSimPreviewLabel("");
                      }}
                    />
                  </div>
                ) : null}
              </>
            )}
          </section>
        </div>

        {completionSnapshot !== null ? (
          <section
            className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-sm flex flex-col gap-3 w-full"
            aria-labelledby="craft-lab-usage-summary-heading"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3
                id="craft-lab-usage-summary-heading"
                className="font-sc text-base font-semibold text-zinc-900 dark:text-zinc-50"
              >
                {t("craftLab.usageSummaryHeading")}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setCompletionSnapshot(null);
                }}
                className="text-sm text-zinc-600 dark:text-zinc-400 underline-offset-2 hover:underline"
              >
                {t("craftLab.usageSummaryDismiss")}
              </button>
            </div>
            {completionSnapshot.length === 0 ? (
              <p className="text-sm text-zinc-500">{t("craftLab.usageSummaryEmpty")}</p>
            ) : (
              <>
                <div>
                  <p className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                    {t("craftLab.usageSummaryOrderLabel")}
                  </p>
                  <ol className="list-decimal list-inside text-sm text-zinc-800 dark:text-zinc-200 space-y-1">
                    {completionSnapshot.map((id, index) => {
                      return (
                        <li key={`${id}-${String(index)}`}>
                          {t(`currency.${id}`)}
                        </li>
                      );
                    })}
                  </ol>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {t("craftLab.usageSummaryTotals", { line: usageTotalsLine })}
                </p>
              </>
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
};
