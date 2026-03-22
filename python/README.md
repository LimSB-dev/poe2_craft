# Python (RL 실험)

Next.js 앱의 **아이템 크래프트 / RL API**와 개념을 맞춘 **오프라인 Q-learning 샘플**입니다. 웹 서버와 별도로, 로컬에서 환경을 돌려 보거나 수치를 조정할 때 사용합니다.

## 구성 (`python/rl/`)

| 파일 | 설명 |
| --- | --- |
| `crafting_env.py` | 카오스 / 에센스 / 종료 행동이 있는 단순 크래프팅 환경. 상태·보상 로직은 `src/app/api/rl-train/route.ts`의 `quality()` 등과 맞추는 주석이 있습니다. |
| `currency_exalt_rates.py` | 엑잘 비용 상수(폴백). **`src/lib/poe2-item-simulator/currencyExaltExchangeRates.ts`와 숫자를 맞출 것** (주석 참고). |
| `poe_currency_exchange.py` | 공식 [Currency Exchange API](https://www.pathofexile.com/developer/docs/reference#currency-exchange) (`/currency-exchange/poe2`)로 `chaos|exalted` 집계를 읽어 카오스·에센스의 엑잘 비용을 계산. |
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

### 공식 환전 집계로 엑잘 비용 쓰기 (선택)

학습 보상의 `total_exalt_spent`는 `crafting_env`에서 카오스/에센스 1회당 엑잘 비용을 곱해 계산합니다. 다음 환경 변수가 있으면 **PoE2 Currency Exchange** 집계에서 `chaos|exalted` 행을 고르고, `r_exalted / r_chaos`(비율 필드 중간값)로 **카오스 1회당 엑잘**을 잡습니다. 에센스는 `RL_ESSENCE_TO_CHAOS_COST_RATIO`(기본 3) × 카오스 엑잘과 동일합니다.

| 변수 | 설명 |
| --- | --- |
| `POE_API_ACCESS_TOKEN` | OAuth 액세스 토큰(스코프 **`service:cxapi`** 필요). 없으면 `currency_exalt_rates.py` 상수로 폴백. |
| `POE_API_USER_AGENT` | (선택) 통째로 지정. 없으면 아래 둘로 조합. |
| `POE_OAUTH_CLIENT_ID` / `POE_APP_VERSION` / `POE_CONTACT_EMAIL` | [개발자 가이드](https://www.pathofexile.com/developer/docs/index#user-agent)의 `User-Agent` 형식용. |

토큰이 있어도 API 오류 시에도 동일 상수로 폴백하고, 실행 로그에 이유를 출력합니다.

```bash
export POE_API_ACCESS_TOKEN="…"
export POE_OAUTH_CLIENT_ID="your_registered_client_id"
export POE_CONTACT_EMAIL="you@example.com"
cd python/rl
python train_q_agent.py
```

## TS / 웹과의 관계

- 엑잘 단가는 `currency_exalt_rates.py` ↔ `currencyExaltExchangeRates.ts` **양쪽을 함께 수정**해야 불일치가 나지 않습니다.
- 보상·품질 공식을 바꿀 때는 `crafting_env.py`의 `_item_quality`와 API 쪽 구현을 함께 점검하세요.

## Git

- `__pycache__/`, 가상환경 등은 저장소 루트 `.gitignore`에서 제외합니다.
