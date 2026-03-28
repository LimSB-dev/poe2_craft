import { MOD_DB } from "@/lib/poe2-item-simulator/modDb";

/**
 * 확률 미리보기 카드에 붙일 태그 라벨.
 * `craftTags`가 있으면(PoE2DB/위키 스케일) 우선, 없으면 시뮬 `modTags`(한글 등)를 사용한다.
 */
export const getCraftLabPreviewTagLabelsForModKey = (modKey: string): readonly string[] => {
  const record = MOD_DB.records.find((r) => {
    return r.modKey === modKey;
  });
  if (record === undefined) {
    return [];
  }
  if (record.craftTags !== undefined && record.craftTags.length > 0) {
    return record.craftTags;
  }
  return record.modTags;
};

/** 소문자 craft tag 키에 대한 칩 색(없으면 중립). */
export const craftLabPreviewTagChipClassName = (tag: string): string => {
  const key = tag.trim().toLowerCase();
  const map: Record<string, string> = {
    life: "border-emerald-500/35 bg-emerald-950/50 text-emerald-100/95",
    mana: "border-blue-500/35 bg-blue-950/45 text-blue-100/95",
    cold: "border-sky-400/40 bg-sky-950/50 text-sky-100/95",
    fire: "border-orange-500/40 bg-orange-950/45 text-orange-100/95",
    lightning: "border-amber-400/40 bg-amber-950/45 text-amber-100/95",
    chaos: "border-violet-500/35 bg-violet-950/45 text-violet-100/95",
    physical: "border-stone-500/35 bg-stone-900/60 text-stone-200/95",
    elemental: "border-cyan-500/30 bg-cyan-950/35 text-cyan-100/90",
    resistance: "border-zinc-500/40 bg-zinc-800/50 text-zinc-200/90",
    defences: "border-slate-500/35 bg-slate-900/55 text-slate-200/90",
    damage: "border-rose-500/35 bg-rose-950/40 text-rose-100/90",
    attribute: "border-indigo-500/35 bg-indigo-950/45 text-indigo-100/90",
    ailment: "border-fuchsia-500/30 bg-fuchsia-950/35 text-fuchsia-100/90",
    attack: "border-red-500/30 bg-red-950/35 text-red-100/90",
    spell: "border-teal-500/30 bg-teal-950/40 text-teal-100/90",
    minion: "border-lime-500/30 bg-lime-950/30 text-lime-100/90",
  };
  return (
    map[key] ??
    "border-zinc-600/50 bg-zinc-900/70 text-zinc-300/95"
  );
};
