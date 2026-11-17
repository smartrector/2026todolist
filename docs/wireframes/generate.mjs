import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const output = dirname(fileURLToPath(import.meta.url));
const skill = resolve(output, '../..', '.agents/skills/wireframe');
const template = (await readFile(resolve(skill, 'wireframe-template.html'), 'utf8')).replace(/\r\n/g, '\n');
const marker = 'const WIREFRAME_DATA = null;';
if (template.split(marker).length !== 2) throw new Error('Expected one template data marker');
await mkdir(output, { recursive: true });

// The original skill template is kept intact. Only generated previews are made achromatic.
function gray(hex) {
  const chars = hex.slice(1);
  const full = chars.length <= 4 ? [...chars].map(c => c + c).join('') : chars;
  const n = Math.round(.2126 * parseInt(full.slice(0, 2), 16) + .7152 * parseInt(full.slice(2, 4), 16) + .0722 * parseInt(full.slice(4, 6), 16));
  return '#' + n.toString(16).padStart(2, '0').repeat(3) + full.slice(6);
}
let monochrome = template.replace(/#[\da-f]{3,8}\b/gi, (color) => [3, 4, 6, 8].includes(color.length - 1) ? gray(color) : color);
monochrome = monochrome.replace(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(\s*,\s*[\d.]+)?\s*\)/gi, (_, r, g, b, alpha = '') => {
  const n = Math.round(.2126 * +r + .7152 * +g + .0722 * +b);
  return `${alpha ? 'rgba' : 'rgb'}(${n}, ${n}, ${n}${alpha})`;
});
// Remove external font dependencies: each preview works without a network connection.
monochrome = monochrome.replace(/<link\b[^>]*href=["']https?:[^>]*>/gi, '');
monochrome = monochrome.replace(/@import\s+(?:url\()?['"]https?:[^;]+;/gi, '');
const overrides = `<style id="lofi-monochrome">
  :root { color-scheme: light; accent-color: #444; }
  html { filter: grayscale(1); }
  body { font-family: Arial, 'Malgun Gothic', sans-serif; }
  * { box-sizing: border-box; }
  :focus-visible { outline: 2px solid #333; outline-offset: 2px; }
  [data-todo-mobile-row] > .wf-type-text { min-width: 0; flex: 1 1 0%; white-space: normal; overflow-wrap: anywhere; font-size: 14px; line-height: 1.4; }
  [data-todo-mobile-row] > [data-direction="horizontal"] { flex-shrink: 0; }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition: none !important; animation: none !important; } }
</style>`;
monochrome = monochrome.replace('</head>', overrides + '</head>');

// Add a small interactive prototype layer without changing the skill template.
const elementHook = "const el = document.createElement('div');\n  const classes = ['wf-node'];";
if (!monochrome.includes(elementHook)) throw new Error('Wireframe renderer hook changed');
monochrome = monochrome.replace(elementHook, `const isTodoAction = node.type === 'button' && /^todo-(toggle|edit|delete|filters-toggle)$/.test(node._solves || '');
  const el = document.createElement(isTodoAction ? 'button' : 'div');
  if (isTodoAction) el.type = 'button';
  if (node._solves === 'todo-mobile-row') el.dataset.todoMobileRow = 'true';
  if (/^todo-filters(?:-hidden)?$/.test(node._solves || '')) {
    el.id = 'todo-search-filters';
    if (node._solves === 'todo-filters-hidden') { el.hidden = true; el.style.display = 'none'; }
  }
  const classes = ['wf-node'];`);
const childrenHook = '  // Render children\n  if (hasChildren) {';
if (!monochrome.includes(childrenHook)) throw new Error('Wireframe children hook changed');
monochrome = monochrome.replace(childrenHook, `  if (isTodoAction) {
    el.draggable = false;
    el.style.font = 'inherit';
    el.style.cursor = 'pointer';
    if (WIREFRAME_DATA.viewport.width === 375) {
      el.style.fontSize = '12px';
      el.style.padding = '4px 6px';
      el.style.minHeight = '32px';
      el.style.flexShrink = '0';
      el.style.whiteSpace = 'nowrap';
    }
    if (node._solves === 'todo-toggle') {
      el.setAttribute('aria-pressed', String(node.name === '완료'));
      el.setAttribute('aria-label', node.name + ' 상태, 클릭하여 ' + (node.name === '완료' ? '미완료' : '완료') + '로 변경');
    }
    if (node._solves === 'todo-filters-toggle') {
      el.setAttribute('aria-expanded', String(node.name === '검색·필터 숨기기'));
      el.setAttribute('aria-controls', 'todo-search-filters');
    }
    el.addEventListener('click', (event) => {
      event.stopPropagation();
      if (node._solves === 'todo-toggle' || node._solves === 'todo-filters-toggle') {
        if (node._solves === 'todo-filters-toggle') toggleTodoFilters(node);
        else { toggleTodoStatus(node); updateTodoSummary(WIREFRAME_DATA.root); }
        modified = true;
        document.getElementById('wf-edited-badge').style.display = 'inline';
        render();
        updateJSONPanel();
        document.querySelector('[data-path="' + path + '"]')?.focus();
      } else {
        const screen = node._solves === 'todo-edit' ? 'edit' : 'delete';
        const device = WIREFRAME_DATA.viewport.width === 375 ? 'mobile' : 'desktop';
        window.location.href = 'todo-' + screen + '-' + device + '.wireframe.html';
      }
    });
  }

  // Render children
  if (hasChildren) {`);
const interactiveFunctions = `
function toggleTodoStatus(node) {
  if (node._solves !== 'todo-toggle' || !['완료', '미완료'].includes(node.name)) return;
  node.name = node.name === '완료' ? '미완료' : '완료';
}
function updateTodoSummary(root) {
  const states = [];
  const summaries = [];
  function visit(node) {
    if (node._solves === 'todo-toggle') states.push(node.name);
    if (node._solves === 'todo-summary') summaries.push(node);
    (node.children || []).forEach(visit);
  }
  visit(root);
  const completed = states.filter(state => state === '완료').length;
  summaries.forEach(node => {
    node.name = '예시 데이터: 전체 ' + states.length + '개 / 미완료 ' + (states.length - completed) + '개 / 완료 ' + completed + '개';
  });
}
function toggleTodoFilters(button) {
  const hide = button.name === '검색·필터 숨기기';
  function visit(node) {
    if (/^todo-filters(?:-hidden)?$/.test(node._solves || '')) {
      node._solves = hide ? 'todo-filters-hidden' : 'todo-filters';
    }
    (node.children || []).forEach(visit);
  }
  visit(WIREFRAME_DATA.root);
  button.name = hide ? '검색·필터 표시' : '검색·필터 숨기기';
}
`;
monochrome = monochrome.replace('function renderNode(node, container, path) {', interactiveFunctions + '\nfunction renderNode(node, container, path) {');

const text = (name, variant, height = variant === 'display' ? 48 : variant === 'heading' ? 40 : 24) => ({ name, type: 'text', ...(variant ? { variant } : {}), height });
const link = name => ({ name, type: 'link', height: 44 });
const button = name => ({ name, type: 'button', height: 44 });
const input = (name, height = 44) => ({ name, type: 'input', height, grow: true });
const group = (name, direction, children, extra = {}) => ({ name, direction, children, ...extra });
const vertical = (name, children, extra = {}) => group(name, 'vertical', children, extra);
const horizontal = (name, children, extra = {}) => group(name, 'horizontal', children, extra);
const divider = () => ({ name: '구분선', type: 'divider' });

const items = ['화면 흐름 문서 검토', '와이어프레임 의견 정리', '등록 폼 검증 항목 확인'];
function todoRow(title, complete, mobile) {
  const status = { ...button(complete ? '완료' : '미완료'), _solves: 'todo-toggle' };
  const actions = horizontal('완료 상태 및 항목 동작', [
    status, { ...button('수정'), _solves: 'todo-edit' }, { ...button('삭제'), _solves: 'todo-delete' },
  ], { gap: mobile ? 4 : 8, align: 'center' });
  if (mobile) {
    actions.children.forEach(action => { action.height = 32; });
    return horizontal(title + ' 항목', [
      { ...text(title, undefined, 64), grow: true }, actions,
    ], { height: 80, gap: 8, align: 'center', _solves: 'todo-mobile-row' });
  }
  return horizontal(title + ' 행', [
    vertical('Todo 내용', [text(title)], { grow: true, justify: 'center' }),
    actions,
  ], { height: 64, gap: 16, align: 'center' });
}
function filters(mobile, noResults) {
  return group('검색 및 상태 필터', mobile ? 'vertical' : 'horizontal', [
    vertical('내용 검색', [text('검색', 'caption'), input(noResults ? '검색어: 일치하지 않는 내용' : 'Todo 내용 검색')], { grow: true, gap: 8 }),
    vertical('상태 선택', [text('상태 필터', 'caption'), input('전체 / 미완료 / 완료')], { ...(mobile ? {} : { width: 240 }), gap: 8 }),
  ], { gap: 16, _solves: 'todo-filters' });
}
function listContent(mobile, state) {
  const empty = state === 'empty';
  const noResults = state === 'no-results';
  const body = empty || noResults ? vertical('목록 상태 안내', [
    text(empty ? '아직 등록한 Todo가 없습니다' : '일치하는 Todo가 없습니다', 'heading', mobile ? 72 : 40),
    text(empty ? '첫 할 일을 등록해 보세요.' : '검색어나 상태 필터를 바꿔 보세요.', undefined, mobile ? 48 : 24),
    empty ? button('첫 Todo 등록') : link('검색 및 필터 초기화'),
  ], { gap: 16, padding: mobile ? 16 : 32, height: mobile ? 288 : 320, justify: 'center', align: 'center' }) : vertical('Todo 목록', [
    ...items.map((item, i) => todoRow(item, i === 1, mobile)),
  ], { gap: mobile ? 12 : 24 });
  return [
    group('페이지 제목과 주요 동작', mobile ? 'vertical' : 'horizontal', [text('Todo 목록', 'display'), ...(empty ? [] : [button('Todo 등록')])], { gap: 16, justify: 'space-between', ...(mobile ? {} : { align: 'center' }) }),
    { ...button('검색·필터 숨기기'), _solves: 'todo-filters-toggle' },
    filters(mobile, noResults),
    { ...text(empty || noResults ? '표시할 항목 0개' : '예시 데이터: 전체 3개 / 미완료 2개 / 완료 1개', 'caption', mobile ? 40 : 24), ...(!empty && !noResults ? { _solves: 'todo-summary' } : {}) },
    body,
  ];
}
function formContent(mobile, edit) {
  return [
    text(edit ? 'Todo 수정' : 'Todo 등록', 'display'),
    link('목록으로 돌아가기'),
    vertical('Todo 입력 폼', [
      text('Todo 내용 (필수)'),
      input(edit ? '화면 흐름 문서 검토 (기존 내용)' : '할 일을 입력하세요', mobile ? 120 : 144),
      text('공백만 입력하면 저장할 수 없습니다.', 'caption', mobile ? 40 : 24),
      ...(edit ? [text('완료 상태: 미완료 (기존 상태 유지)', 'caption', mobile ? 40 : 24)] : [text('새 Todo는 미완료로 등록됩니다.', 'caption', mobile ? 40 : 24)]),
      horizontal('저장과 취소', [link('취소'), button(edit ? '변경 내용 저장' : '등록')], { gap: 8, justify: 'flex-end' }),
    ], { gap: 16, padding: mobile ? 16 : 24, maxWidth: 720, _solves: '등록·수정 성공 또는 취소 시 기존 검색·필터를 유지한 목록으로 돌아간다. 오류는 입력 필드 가까이에 표시하며 입력을 유지한다.' }),
  ];
}
function deleteContent(mobile) {
  return [
    text('Todo 목록', 'display'),
    text('삭제 확인 열린 상태 / 배경 목록 유지', 'caption', mobile ? 40 : 24),
    vertical('삭제 확인 대화상자 배치', [
      vertical('삭제 확인 대화상자', [
        text('Todo를 삭제할까요?', 'heading', mobile ? 72 : 40),
        text('화면 흐름 문서 검토', undefined, 48),
        text('삭제한 항목은 되돌릴 수 없습니다.', undefined, mobile ? 48 : 24),
        horizontal('확인 동작', [link('취소'), button('삭제')], { gap: 8, justify: 'flex-end' }),
      ], { maxWidth: 480, padding: mobile ? 16 : 24, gap: 16, _solves: '목록 위 모달. 배경 비활성화, 포커스 가두기, Escape 취소, 닫은 뒤 트리거 복귀. 스키마에는 중첩 레이어 속성이 없어 위치와 내부 구조로 표현한다.' }),
    ], { height: 480, align: 'center', justify: 'center' }),
  ];
}
function sidebar(mobile = false) {
  return vertical(mobile ? '모바일 사이드바 펼침' : '사이드바', [
    text('작업 공간', 'caption'), link('Todo 목록 (현재 위치)'),
    ...(mobile ? [link('메뉴 닫기')] : []),
  ], { ...(mobile ? {} : { width: 240, grow: false }), gap: 8, padding: mobile ? 16 : 24, _solves: mobile ? '375px에서는 기본 숨김. 헤더 메뉴로 여는 서랍의 탐색 구조. 닫을 때 메뉴 버튼에 포커스 복귀.' : '요청된 고정 탐색 영역. 목록으로 복귀하며 검색·필터를 중복 배치하지 않는다.' });
}
const screens = [];
for (const mobile of [false, true]) {
  for (const state of ['list', 'create', 'edit', 'delete', 'empty', 'no-results', ...(mobile ? ['sidebar-open'] : [])]) {
    const name = `Todo ${state.split('-').map(s => s[0].toUpperCase() + s.slice(1)).join(' ')} ${mobile ? 'Mobile' : 'Desktop'}`;
    const content = state === 'create' || state === 'edit' ? formContent(mobile, state === 'edit') : state === 'delete' ? deleteContent(mobile) : listContent(mobile, state);
    const main = vertical('메인 작업 영역', content, { grow: true, padding: mobile ? 24 : 32, gap: mobile ? 24 : 32 });
    const header = horizontal('헤더', [text('Todo', 'heading', 40), ...(mobile ? [link(state === 'sidebar-open' ? '메뉴 닫기' : '메뉴 열기')] : [text('할 일 관리', 'caption')])], { height: 64, padding: [8, mobile ? 16 : 24], gap: 8, justify: 'space-between', align: 'center' });
    const data = {
      name,
      viewport: { width: mobile ? 375 : 1440, height: mobile ? 1440 : 960 },
      root: vertical('페이지', [header, divider(), group('본문', mobile ? 'vertical' : 'horizontal', [...(!mobile ? [sidebar()] : state === 'sidebar-open' ? [sidebar(true)] : []), main], { grow: true })], { height: mobile ? 1440 : 960 }),
    };
    const stem = name.toLowerCase().replaceAll(' ', '-');
    const json = JSON.stringify(data, null, 2);
    await writeFile(resolve(output, `${stem}.wireframe.json`), json + '\n', 'utf8');
    const html = monochrome.replace(marker, 'const WIREFRAME_DATA = ' + json + ';').replace(/<title>[^<]*<\/title>/, `<title>${name} — Lo-fi wireframe</title>`);
    await writeFile(resolve(output, `${stem}.wireframe.html`), html, 'utf8');
    screens.push({ name, stem, width: data.viewport.width, state });
  }
}
const labels = { list: 'Todo 목록', create: 'Todo 등록', edit: 'Todo 수정', delete: '삭제 확인', empty: '빈 목록', 'no-results': '검색 결과 없음', 'sidebar-open': '모바일 사이드바 펼침' };
const index = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Todo Lo-fi 와이어프레임</title><style>
body{font:16px/1.6 Arial,'Malgun Gothic',sans-serif;background:#f5f5f5;color:#222;margin:0;padding:32px}main{max-width:1100px;margin:auto}h1{font-size:32px}p{max-width:70ch}table{border-collapse:collapse;width:100%;background:#fff}th,td{text-align:left;padding:16px;border-bottom:1px solid #ccc}a{color:#222;text-underline-offset:3px}a:focus-visible{outline:2px solid #333;outline-offset:4px}.links{display:flex;gap:16px;flex-wrap:wrap}@media(max-width:600px){body{padding:16px}th,td{padding:12px}h1{font-size:26px}}
</style></head><body><main><h1>Todo List / Lo-fi 와이어프레임</h1><p>Desktop 1440px / Mobile 375px. 흑백 구조 검토용 화면입니다. 실제 등록·검색·삭제가 동작하는 앱이 아닙니다. 각 미리보기에서 JSON 확인·편집·드래그 재정렬·복사·다운로드가 가능합니다.</p><p>모바일은 한 열 배치와 접힌 사이드바를 기본으로 합니다. 삭제 확인의 배경 오버레이와 모바일 서랍은 스키마 제약상 구조와 주석으로 표현합니다.</p><table><thead><tr><th>화면</th><th>Desktop</th><th>Mobile</th></tr></thead><tbody>${Object.entries(labels).map(([state,label])=>`<tr><td>${label}</td>${[1440,375].map(width=>{const screen=screens.find(s=>s.state===state&&s.width===width);return `<td>${screen?`<div class="links"><a href="${screen.stem}.wireframe.html">HTML 보기</a><a href="${screen.stem}.wireframe.json">JSON</a></div>`:'해당 없음'}</td>`}).join('')}</tr>`).join('')}</tbody></table><p><a href="README.md">설계 설명</a> / <a href="validation-report.json">검증 보고서</a></p></main></body></html>`;
await writeFile(resolve(output, 'index.html'), index, 'utf8');
console.log(`Generated ${screens.length} JSON/HTML pairs plus index.html`);
