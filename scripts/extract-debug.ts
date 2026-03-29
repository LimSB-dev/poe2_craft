/**
 * PoE2DB / 위키 추출 스크립트용 디버그 로깅.
 *
 * 사용: `EXTRACT_DEBUG=1 yarn extract:poe2db-base-items`
 * 또는: `yarn extract:poe2db-base-items -- --debug-extract`
 *
 * 환경 변수 `EXTRACT_DEBUG`: `1` 또는 `true` 이면 활성.
 */

export const isExtractDebug = (): boolean => {
  return (
    process.env.EXTRACT_DEBUG === "1" ||
    process.env.EXTRACT_DEBUG === "true" ||
    process.argv.includes("--debug-extract")
  );
};

export const truncateText = (text: string, maxChars: number): string => {
  if (text.length <= maxChars) {
    return text;
  }
  return `${text.slice(0, maxChars)}… [+${String(text.length - maxChars)} chars]`;
};

export const previewJson = (value: unknown, maxChars = 16000): string => {
  try {
    const s = JSON.stringify(value, null, 2);
    if (s.length <= maxChars) {
      return s;
    }
    return `${s.slice(0, maxChars)}\n… (truncated, ${String(s.length)} chars total)`;
  } catch {
    return String(value);
  }
};

/**
 * PoE2DB `new ModsView(...)` 파싱 결과처럼 섹션별 배열이 큰 객체를 요약해 콘솔에 넣기 좋게 만든다.
 */
export const summarizeModsViewLikePayload = (
  payload: Record<string, unknown>,
): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (Array.isArray(value)) {
      const first = value[0];
      const firstKeys =
        first !== undefined && typeof first === "object" && first !== null
          ? Object.keys(first as object)
          : [];
      out[key] = {
        _kind: "array",
        length: value.length,
        firstRowKeys: firstKeys,
        firstRowSample:
          first !== undefined && typeof first === "object" && first !== null
            ? previewJson(first, 4000)
            : first,
      };
    } else {
      out[key] = value;
    }
  }
  return out;
};

export const logExtractDebugBlock = (title: string, body: string): void => {
  if (!isExtractDebug()) {
    return;
  }
  const line = "=".repeat(72);
  console.log(`\n${line}\n[EXTRACT_DEBUG] ${title}\n${line}`);
  console.log(body);
  console.log(`${line}\n`);
};

export const logExtractDebugJson = (title: string, value: unknown): void => {
  logExtractDebugBlock(title, previewJson(value));
};
