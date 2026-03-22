# Python (RL 실험)

Next.js 앱의 **아이템 크래프트 / RL API**와 개념을 맞춘 **오프라인 Q-learning 샘플**입니다. 웹 서버와 별도로, 로컬에서 환경을 돌려 보거나 수치를 조정할 때 사용합니다.

## 구성 (`python/rl/`)

| 파일 | 설명 |
| --- | --- |
| `crafting_env.py` | 카오스 / 에센스 / 종료 행동이 있는 단순 크래프팅 환경. 상태·보상 로직은 `src/app/api/rl-train/route.ts`의 `quality()` 등과 맞추는 주석이 있습니다. |
| `currency_exalt_rates.py` | 엑잘 비용 상수. **`src/lib/poe2-item-simulator/currencyExaltExchangeRates.ts`와 숫자를 맞출 것** (주석 참고). |
| `train_q_agent.py` | ε-greedy Q-learning 학습 및 간단한 평가 출력. |

## 의존성

- **표준 라이브러리만**으로도 동작합니다.
- `gymnasium`이 있으면 `crafting_env.py`에서 실제 `spaces`를 쓰고, 없으면 최소 대체 구현으로 동작합니다. (학습 스크립트는 `gymnasium`을 직접 쓰지 않습니다.)

```bash
pip install gymnasium   # 선택
```

## 실행 방법

모듈 import가 `crafting_env`, `currency_exalt_rates` 기준이므로 **`rl` 디렉터리에서** 실행합니다.

```bash
cd python/rl
python train_q_agent.py
```

## TS / 웹과의 관계

- 엑잘 단가는 `currency_exalt_rates.py` ↔ `currencyExaltExchangeRates.ts` **양쪽을 함께 수정**해야 불일치가 나지 않습니다.
- 보상·품질 공식을 바꿀 때는 `crafting_env.py`의 `_item_quality`와 API 쪽 구현을 함께 점검하세요.

## Git

- `__pycache__/`, 가상환경 등은 저장소 루트 `.gitignore`에서 제외합니다.
