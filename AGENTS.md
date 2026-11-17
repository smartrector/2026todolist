# 프로젝트 작업 인계

최종 정리: 2026-11-17. 이 문서는 지금까지의 진행 상황과 후속 작업 시 지킬 기준을 기록한다.

## 현재 상태

Todo의 Lo-fi 와이어프레임과 Hi-fi FigCraft 디자인을 생성한 상태다. 최신 완료 산출물은 `docs/design/figcraft/hifi/todo-hifi.figcraft`이다.

- 기존 Lo-fi의 화면 구조, 문구, 기능 구성을 유지한 Hi-fi 화면 13개를 만들었다.
- Desktop 1440×960px 6개, Mobile 375×1440px 7개다.
- 화면은 목록, 등록, 수정, 삭제 확인, 빈 목록, 검색 결과 없음이며 모바일에 사이드바 펼침 상태를 추가했다.
- 디자인 시스템 보드 3개를 같은 파일에 포함했다: Foundations, Component states, Responsive and analysis.
- Pretendard, 네이비/블루, Auto Layout, 편집 가능한 텍스트·프레임, 디자인 토큰과 텍스트 스타일을 적용했다.
- Hover·Focus·Error 및 Active·Disabled 상태를 설계 보드에 표현했다. 실제 앱 이벤트나 폼 검증 구현은 아니다.
- React 소스를 생성하거나 수정하지 않았다. 실제 Todo 앱 구현은 요청 범위가 아니었다.

## 저장소의 성격과 범위

루트 프로젝트는 기존 거축 기업 홈페이지용 정적 사이트다. `package.json` 이름은 `geochuk-landing`이며 React 앱으로 간주하지 않는다.

- 기존 사이트: `index.html`, `style.css`, `tokens.css`, `base.css`, `app.js`.
- 사이트 빌드: `npm.cmd run build`.
- 사이트 실행: `npm.cmd start`.
- Todo 디자인은 `docs/` 아래 별도 산출물이다. 후속 디자인 작업에서 기존 사이트나 React 소스를 임의로 변경하지 않는다.
- 사용자 요구가 달라지면 최신 사용자 지시를 따른다.

## 주요 파일

| 경로 | 역할 |
| --- | --- |
| `docs/wireframes/index.html` | 전체 Lo-fi JSON/HTML 탐색 미리보기 |
| `docs/wireframes/*.wireframe.json` | 13개 화면의 구조·문구 원본 |
| `docs/wireframes/*.wireframe.html` | 화면별 Lo-fi 미리보기 |
| `docs/wireframes/README.md` | Lo-fi 설계 의도와 미리보기 동작 범위 |
| `docs/design-system.md` | 기존 거축 사이트의 색상·폰트 기준. Todo 전용 문서와 구분할 것 |
| `docs/design/figcraft/todo-all-screens.figcraft` | 전체 13개 Lo-fi 네이티브 FigCraft 파일 |
| `docs/design/figcraft/generate-native.mjs` | Lo-fi FigCraft 명령 생성기 |
| `docs/design/figcraft/hifi/todo-hifi.figcraft` | 최신 Hi-fi 완료 파일 |
| `docs/design/figcraft/hifi/previews/` | Hi-fi 13개 화면과 3개 보드의 PNG 렌더 |
| `docs/design/figcraft/hifi/design-system.json` | Todo Hi-fi 색상·타이포·반응형 기준 |
| `docs/design/figcraft/hifi/design-decisions.json` | 사용 도구, 원본 분석, 적용 판단, 제약 |
| `docs/design/figcraft/hifi/manifest.json` | 화면 이름, 노드 ID, 원본 파일, 보드 ID |
| `docs/design/figcraft/hifi/validation-report.json` | 구조·원문 보존·글꼴·대비 검사 결과 |
| `docs/design/figcraft/hifi/finish-review.json` | Hallmark 별도 검토 결과: ship |
| `docs/design/figcraft/hifi/todo-hifi.native.json` | 최종 네이티브 문서의 JSON 내보내기 |
| `docs/design/figcraft/hifi/fonts/` | Pretendard 4개 굵기와 라이선스 |
| `docs/design/figcraft/generate-hifi.mjs` | Hi-fi 화면·설계 보드·토큰·스타일 생성기 |
| `docs/design/figcraft/mcp-local.mjs` | 설치된 FigCraft의 로컬 stdio MCP 클라이언트 |
| `docs/design/figcraft/hifi/build.requests.json` | Hi-fi MCP 생성 요청. 생성기 실행으로 갱신됨 |
| `docs/design/figcraft/hifi/fix.requests.json` | 최초 생성 후 발견한 텍스트 경계 5곳의 수정 이력 |
| `docs/design/figcraft/hifi/audit.mjs` | 최종 JSON 기반 구조·색상 대비 검사 |

`docs/design/figcraft/view.figcraft`는 이전 연결 실험용 빈 파일이다. 최신 결과로 안내하지 않는다. `analysis.json`, `docs/design/figma-pending.json` 등의 과거 연결 실패 기록도 현재 Hi-fi 완료 상태와 구분한다.

## 디자인 기준

사용자가 지정한 도구는 UI/UX Pro Max, Hallmark, FigCraft MCP다. 관련 스킬은 `.agents/skills/ui-ux-pro-max/SKILL.md`와 `.agents/skills/hallmark/SKILL.md`에서 확인한다.

- Hallmark는 app scope의 restyle로 적용했다. 기존 화면 구조를 재설계하거나 마케팅 히어로를 추가하지 않는다.
- UI/UX Pro Max의 로컬 Productivity Tool 항목과 Flat Design/Micro-interactions 지침을 참고했다. Python 실행 환경이 없어 검색 스크립트의 `--design-system` 실행은 완료하지 못했다. 자동 검색 성공으로 보고하지 않는다.
- `docs/design-system.md`의 Pretendard와 네이비를 계승했다. 기업 사이트의 큰 히어로 글자 크기는 Todo 앱에 그대로 쓰지 않았다.
- 사용자 요청에 따라 블루를 선택·포커스에 적용했다. 주요 버튼은 네이비 배경과 밝은 글자다.
- 색상은 `hifi/design-system.json` 및 FigCraft 변수에서 관리한다. 무관한 테마나 그라디언트를 추가하지 않는다.

| 역할 | 값 |
| --- | --- |
| 기본 배경 | `#F6F6F2` |
| 카드·입력 표면 | `#FFFFFF` |
| 제목·주요 버튼 | `#14263D` |
| 보조 본문 | `#34465B` |
| 도움말 | `#626A70` |
| 블루 강조 | `#245CB0` |
| 선택 배경 | `#EAF1FC` |
| 포커스 | `#527BBD` |
| 입력 경계 | `#7A899B` |
| 오류 | `#B42332` |
| 완료 | `#17633E` |

- Pretendard: Regular, Medium, SemiBold, Bold가 현재 사용자 계정에 설치되어 있고 FigCraft 인식을 확인했다.
- 폰트는 `.figcraft` 안에 임베드되어 있지 않다. 다른 환경에서 열 때 `fonts/`의 글꼴과 라이선스를 함께 전달한다.
- 글자 크기: 페이지 제목 28px, 영역 제목 24px, 본문·입력 16px, 라벨·도움말 14px. 모바일 항목의 짧은 액션 라벨은 한 행 유지를 위해 12px다.
- 컨트롤 반경 8px, 카드 반경 12px. 간격은 4/8/12/16/24/32/48px 토큰이다.
- 모바일 터치 영역은 최소 44×44px다. 내용은 남는 폭에서 줄바꿈하고 완료·수정·삭제 액션은 한 행을 유지한다.
- Focus는 2px 링과 2px 간격, 입력 경계는 1px 유지. Error는 색상뿐 아니라 필드 아래 설명으로 표시한다.

## 반응형 설계

- 1440px: 헤더 64px, 사이드바 240px, 메인 여백 32px. 검색·상태 필터 가로 배치.
- 375px: 헤더 64px, 메인 여백 24px. 사이드바는 메뉴로 접고 검색·필터 세로 배치.
- 960px 미만: 사이드바를 메뉴로 전환.
- 768px 미만: 검색·필터와 제목 동작을 단일 열로 전환.
- 768~959px: 사이드바 접힘, 메인 여백 24px. 검색 조건은 가용 폭 600px 이상일 때 가로 배치.
- 1920px 이상: 메인 작업 너비 상한 1200px, 추가 공간은 여백으로 처리.
- 두 기준 너비의 네이티브 렌더는 확인했다. 중간 너비는 설계 규칙이며 실제 브라우저 구현·검증 완료를 뜻하지 않는다.

## 도구 및 연결 이력

### FigCraft

현재 성공한 생성 경로는 설치된 FigCraft의 로컬 MCP다. 과거 `.tools/figcraft`의 Figma 플러그인 릴레이와 구분한다.

- CLI: `C:/hanyong5/program/figcraft/figcraft-cli.exe`.
- MCP 실행: `figcraft-cli.exe mcp --automation-write-root C:/hanyong5/04test/01testproject`.
- `mcp-local.mjs`는 `.tools/figcraft/node_modules/@modelcontextprotocol/sdk`를 이용한다. 이 경로의 의존성이 없으면 먼저 실행 가능 여부를 확인한다.
- MCP의 `batch`, `set_properties`, `save_file`, `run_command` 등으로 실제 파일을 생성·수정했다.
- sandbox 내 자식 프로세스 실행이 `EPERM`으로 차단되어 MCP 실행에는 도구 승인 절차를 사용했다. 실패 시 승인 절차를 우회하지 않는다.
- `.codex/config.toml`에는 이전 FigCraft 릴레이와 공식 Figma MCP 설정이 존재한다. 연결 상태를 설정 존재만으로 판단하지 않는다.

### Figma

대상 파일: `https://www.figma.com/design/F9EHk7ctFWMH88rcaWfo7u/todo`.

- 공식 Figma MCP로 생성된 것은 초기 Lo-fi 목록 2개다: Desktop `5:261`, Mobile `5:387`.
- 추가 화면 생성 중 Starter 플랜 MCP 호출 한도 오류가 발생했다. 추가 11개 화면이나 최신 Hi-fi가 Figma에 업로드되었다고 보고하지 않는다.
- 최신 전체 디자인은 로컬 `.figcraft` 파일에 있다. Figma로 옮기는 작업은 별도 요청·연결 확인 후 진행한다.

## 재생성과 검사

아래 명령은 PowerShell 기준이다. 생성 명령은 현재 산출물을 덮어쓸 수 있으므로 사용자 편집이 생겼는지 확인하고, 필요하면 별도 출력 경로나 백업을 사용한다.

```powershell
node docs/design/figcraft/generate-hifi.mjs
node docs/design/figcraft/mcp-local.mjs docs/design/figcraft/hifi/build.requests.json
& C:/hanyong5/program/figcraft/figcraft-cli.exe info docs/design/figcraft/hifi/todo-hifi.figcraft
& C:/hanyong5/program/figcraft/figcraft-cli.exe convert docs/design/figcraft/hifi/todo-hifi.figcraft docs/design/figcraft/hifi/todo-hifi.native.json
node docs/design/figcraft/hifi/audit.mjs
& C:/hanyong5/program/figcraft/figcraft-cli.exe export docs/design/figcraft/hifi/todo-hifi.figcraft --out docs/design/figcraft/hifi/previews --format png --scale 1
```

검사 스크립트는 `.native.json` 내보내기를 읽는다. `.figcraft` 수정 후 JSON도 다시 내보내야 최신 검사가 된다. 재생성 후 노드 ID가 바뀌면 `fix.requests.json`의 과거 ID를 무조건 재적용하지 않는다.

최종 확인 결과:

- 13개 화면, 설계 보드 3개, 전체 613개 노드.
- 변수 35개, 텍스트 스타일 8개, 컴포넌트 18개.
- 모든 원본 화면 문구 보존, 화면 크기 일치, 검사 대상 프레임 경계 초과 없음.
- 모든 텍스트의 글꼴은 Pretendard. 래스터 이미지 레이어 없음.
- 주요 검토 조합의 일반 텍스트 대비 4.5:1 이상, 입력 경계·포커스 대비 3:1 이상.
- Hallmark fresh-context 최종 검토 결과는 `ship`이다.
- Hallmark `sloplint --render`는 실행했지만 `.figcraft`를 파싱하지 못해 HTML/CSS 검사를 수행하지 않았다. 이를 린트 통과로 표현하지 않는다. 네이티브 렌더와 구조·대비 검사를 대신 기록했다.

## 이후 작업 시 주의

- 사용자 중지 요청은 즉시 따른다. 과거 중지 후 새 요청으로 작업을 재개했으며, 현재 위 Hi-fi 파일 생성은 완료 상태다.
- 화면 디자인과 실제 앱 동작을 구분한다. 저장·검색·삭제 API, React 구현, 실시간 Hover/Focus 이벤트, 접근성 DOM 구현은 생성하지 않았다.
- Lo-fi와 기존 기업 사이트를 보존하고 별도 Hi-fi 산출물을 편집한다.
- 기존 변경사항을 되돌리지 않는다. 이 문서 작성 직전 `git status --short`에는 `.tools/figcraft`의 변경 상태가 있었다. 요청 없이 정리·커밋하지 않는다.
