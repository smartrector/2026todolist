# 거축 디자인 시스템: 컬러와 폰트

기준일: 2026-11-17. 현재 메인 페이지의 `style.css`, `tokens.css`, `base.css`를 기준으로 작성한다.

## 기본 원칙

- 따뜻한 백색과 딥 네이비를 중심으로 절제된 인상을 유지한다.
- 색상과 글꼴은 `:root`에 토큰으로 선언하고 컴포넌트에서는 `var()`로 사용한다. 새로운 HEX 값이나 `font-family`를 컴포넌트에 직접 넣지 않는다.
- `tokens.css`는 공통 기본값, `base.css`는 요소별 기본 스타일, `style.css`는 거축 브랜드와 반응형 재정의를 담당한다. 동일한 토큰은 나중에 선언된 값이 적용된다.
- 아래 표는 최종 브랜드 값이다. `tokens.css`에 남아 있는 Cobalt 계열 보조 토큰을 새 화면의 색상으로 임의 사용하지 않는다.

## 컬러

### 기본 팔레트

| 토큰 | 값 | 역할 |
| --- | --- | --- |
| `--color-paper` | `#f6f6f2` | 페이지 기본 배경, 네이비 버튼의 글자 |
| `--color-paper-2` | `#eeeeea` | 푸터, 보조 배경, 입력 요소 호버 |
| `--color-paper-3` | `#e5e7e6` | 선택된 문의 유형, 눌린 목록 배경 |
| `--color-ink` | `#14263d` | 제목, 기본 본문, 주요 버튼 배경 |
| `--color-ink-2` | `#34465b` | 첫 화면 설명 등 보조 본문 |
| `--color-muted` | `#626a70` | 설명, 캡션, 입력 테두리 |
| `--color-rule` | `#cbd0d1` | 섹션과 목록의 구분선 |
| `--color-rule-2` | `#adb6bc` | 강조된 구분선, 선택 컨트롤 기본 테두리 |
| `--color-accent` | `#14263d` | 주요 행동과 브랜드 강조 |
| `--color-accent-ink` | `#f6f6f2` | 강조색 위의 텍스트 |
| `--color-focus` | `#527bbd` | 밝은 배경의 키보드 포커스 |
| `--color-transparent` | `transparent` | 투명한 컨트롤 배경 |

### 네이비 영역

| 토큰 | 값 | 역할 |
| --- | --- | --- |
| `--color-graphite` | `#14263d` | 협업 관점 섹션의 배경 |
| `--color-graphite-ink` | `#f6f6f2` | 네이비 배경 위 제목과 주요 텍스트 |
| `--color-graphite-muted` | `#bac4cf` | 네이비 배경 위 설명 |
| `--color-on-dark-rule` | `#44556b` | 어두운 영역의 구분선 |

### 이미지 히어로

| 토큰 | 값 | 역할 |
| --- | --- | --- |
| `--color-hero-ink` | `#ffffff` | 이미지 위 제목, 슬라이드 컨트롤, 포커스 |
| `--color-hero-muted` | `#e5eaf0` | 이미지 위 설명 |
| `--color-hero-shade` | `#081321` | 이미지 로딩 전 배경, 제목 그림자 |
| `--color-hero-rule` | `#c1cad5` | 슬라이드 버튼과 문의 버튼 테두리 |
| `--hero-overlay` | 아래 정의 참조 | 이미지 위 텍스트를 위한 명암 보정 |

```css
:root {
  --hero-overlay: linear-gradient(
    180deg,
    rgb(8 19 33 / .48),
    rgb(8 19 33 / .4) 40%,
    rgb(8 19 33 / .86)
  );
}
```

사진이 바뀌어도 제목과 버튼이 읽히도록 오버레이를 유지한다. 사진의 밝기와 크롭에 따라 실제 화면에서 대비를 확인한다. 이 그라디언트는 사진의 가독성을 위한 용도로만 사용한다.

### 상태와 사용 규칙

- 오류는 `--color-error: oklch(52% 0.19 27)`을 사용한다. 테두리 색만 바꾸지 않고 원인과 해결 방법을 텍스트로 제공한다.
- 성공 상태용 공통 토큰은 `--color-success: oklch(50% 0.12 150)`이다. 실제 동작 결과가 확인된 경우에만 사용하며, 현재 문의 복사를 접수 성공으로 표시하지 않는다.
- 주요 버튼은 네이비 배경과 밝은 글자 조합으로 통일한다. 별도의 강조 색상이나 그라디언트 버튼을 추가하지 않는다.
- 구분선 토큰은 장식용이다. 작은 본문이나 필수 입력 테두리에 사용하지 않는다.
- 포커스는 즉시 표시되는 `2px` 외곽선과 `2px` 간격을 기본으로 한다. 히어로 위 포커스는 `--color-hero-ink`를 사용한다.
- 새 조합의 대비 목표는 일반 텍스트 4.5:1, 큰 텍스트와 필요한 UI 경계 3:1이다. 이미지 위 조합은 실제 배경을 포함해 확인한다. 목표를 명시한 것이며 전체 화면의 접근성 검증 완료를 의미하지 않는다.

## 폰트

### 글꼴 계열과 로딩

```css
:root {
  --font-display: 'Pretendard', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;
  --font-body: var(--font-display);
  --font-outlier: var(--font-body);
  --display-weight: 500;
  --tracking-display: -0.065em;
}
```

- 제목, 본문, 메뉴, 버튼, 입력 요소는 Pretendard 계열로 통일한다. 로고도 별도 이미지 없이 같은 계열의 굵은 글자로 표현한다.
- Pretendard는 `index.html`에서 버전을 고정해 로드한다: `https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/web/static/pretendard.min.css`.
- CDN을 사용할 수 없으면 맑은 고딕, Apple SD Gothic Neo, 기기 기본 산세리프 순으로 대체한다. 대체 글꼴에서도 한글 줄바꿈과 버튼 폭을 확인한다.
- 코드나 실제 측정값이 없는 현재 페이지에는 별도 모노스페이스 글꼴을 추가하지 않는다.

### 크기와 위계

아래 px 환산은 브라우저 기본 글자 크기 `16px` 기준이다. 사용자 글자 크기 설정을 막지 않는다.

| 역할 | 현재 적용 값 | 굵기·행간 |
| --- | --- | --- |
| 기본 H1 토큰 | `--text-display: clamp(3.1rem, 7.6vw, 7.25rem)` | 500, 히어로 규칙 우선 |
| 이미지 히어로 H1 | `clamp(3rem, 6.8vw, 6.5rem)` / 48~104px | 500, 1.2 |
| 모바일 히어로 H1 | `clamp(2rem, 8.3vw, 3.3rem)` / 32~52.8px | 500, 1.4 |
| 섹션 H2 | `--text-section: clamp(2.25rem, 4vw, 3.75rem)` / 36~60px | 500, 1.25 |
| 기본 H3 | `--text-title: clamp(1.25rem, 0.75vw + 0.875rem, 1.625rem)` / 20~26px | 500, 1.2 |
| 질문 목록 H3 | `clamp(1.5rem, 2.25vw, 2rem)` / 24~32px, 모바일 23px | 500, 1.5 |
| 리드 문장 | `--text-lead: clamp(1.125rem, 0.35vw + 1rem, 1.375rem)` / 18~22px | 400, 기본 `.lead` 1.45 |
| 기본 본문·버튼·입력 | `--text-md: 1rem` / 16px | 본문 400, 기본 1.55 |
| 메뉴·라벨·캡션 | `--text-sm: 0.875rem` / 14px | 기본 400, 문맥별 행간 |
| 헤더 텍스트 로고 | 35px, 모바일 30px | 800, 행간 1, 자간 -0.085em |
| 푸터 텍스트 로고 | `clamp(4rem, 9vw, 8rem)` / 64~128px | 800, 행간 1, 자간 -0.09em |

현재 이미지 히어로는 기본 H1 토큰보다 나중에 선언된 `.hero-content h1` 규칙이 우선한다. 히어로 설명은 데스크톱 16px, 모바일 14px이며 행간은 1.65다. 푸터 채용 제목 등 개별 역할은 `style.css`의 컴포넌트 규칙을 따른다.

### 조판 규칙

- 제목은 한 단계 안에서 같은 굵기와 색상을 유지한다. 일부 단어만 기울이거나 색을 바꿔 강조하지 않는다.
- 제목에는 `--tracking-display`를 적용한다. 본문, 메뉴, 라벨에 이 음수 자간을 적용하지 않는다. 대문자 자간을 벌린 장식 라벨도 사용하지 않는다.
- 한글 본문은 `word-break: keep-all`로 단어 단위 줄바꿈을 유지한다. 제목에는 `overflow-wrap: break-word`, `min-width: 0`을 함께 적용한다.
- 제목의 의도적인 줄바꿈은 모바일에서도 확인한다. 글자를 고정 높이로 잘라내거나 말줄임으로 핵심 문구를 숨기지 않는다.
- 일반 본문은 16px를 기본으로 한다. 14px는 메뉴·라벨·캡션과 현재 모바일 히어로의 짧은 보조 문구에 한정한다.
- 여러 줄 설명은 대체로 1.55~1.8 행간을 사용한다. 본문 너비는 공통 규칙의 `65ch` 이내를 기본으로 한다.
- 버튼과 입력 요소는 `font: inherit`로 주변 타이포그래피와 일치시킨다. 슬라이드 번호에는 `font-variant-numeric: tabular-nums`를 사용한다.

## 적용 예시

```css
.service-description {
  background: var(--color-paper);
  color: var(--color-ink-2);
  font-family: var(--font-body);
  font-size: var(--text-md);
  line-height: 1.65;
}

.service-heading {
  color: var(--color-ink);
  font-family: var(--font-display);
  font-size: var(--text-section);
  font-weight: var(--display-weight);
  letter-spacing: var(--tracking-display);
  line-height: 1.25;
  overflow-wrap: break-word;
  min-width: 0;
}
```

컬러·폰트 규칙을 변경할 때는 `style.css`의 브랜드 토큰 또는 해당 역할의 규칙을 수정하고 이 문서도 함께 갱신한다. 빌드 결과인 `dist/`는 직접 수정하지 않는다.
