import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const folder = dirname(fileURLToPath(import.meta.url));
const files = (await readdir(folder)).filter(file => file.endsWith('.wireframe.json')).sort();
const issues = [];
const details = [];
const validTypes = new Set(['text', 'image', 'icon', 'button', 'link', 'input', 'card', 'table', 'divider']);
const spacing = new Set([0, 4, 8, 12, 16, 24, 32]);
const counts = { desktop: 0, mobile: 0, nodes: 0, inlineScripts: 0, interactiveLists: 0, filterToggles: 0 };
function check(condition, message) { if (!condition) issues.push(message); }
for (const file of files) {
  const data = JSON.parse(await readFile(resolve(folder, file), 'utf8'));
  const stem = data.name.toLowerCase().replaceAll(' ', '-');
  check(file === `${stem}.wireframe.json`, `${file}: name/filename mismatch`);
  check([1440, 375].includes(data.viewport?.width), `${file}: incorrect viewport`);
  counts[data.viewport.width === 1440 ? 'desktop' : 'mobile']++;
  let nodeCount = 0;
  const names = [];
  const allNodes = [];
  function walk(node, path) {
    nodeCount++;
    allNodes.push(node);
    names.push(node.name);
    check(typeof node.name === 'string' && node.name.trim(), `${path}: missing name`);
    if (node.children) {
      check(['vertical', 'horizontal'].includes(node.direction), `${path}: missing direction`);
      check(Array.isArray(node.children), `${path}: invalid children`);
      for (const [i, child] of node.children.entries()) walk(child, `${path}/${i}`);
    } else check(validTypes.has(node.type), `${path}: unknown leaf type`);
    if (['button', 'link', 'text'].includes(node.type)) check(!('width' in node), `${path}: fixed leaf width`);
    if (node.type === 'input') check(node.height > 0 && (node.grow || node.maxWidth) && !node.width, `${path}: invalid input sizing`);
    if (node.type === 'icon') check(node.width > 0 && node.height > 0, `${path}: invalid icon sizing`);
    if (node._solves === 'todo-mobile-row') {
      check(node.direction === 'horizontal', `${path}: mobile list must share one row`);
      const actions = node.children[1];
      check(actions.gap === 4 && actions.children.length === 3, `${path}: compact action group required`);
      check(actions.children.every(action => action.type === 'button' && action.height === 32), `${path}: mobile buttons must be 32px high`);
    }
    if (node.gap !== undefined) check(spacing.has(node.gap), `${path}: gap off scale`);
    if (node.padding !== undefined) {
      const padding = Array.isArray(node.padding) ? node.padding : [node.padding];
      check(padding.every(value => spacing.has(value)), `${path}: padding off scale`);
      check(Math.min(...padding) >= (node.gap || 0), `${path}: padding less than gap`);
    }
    for (const key of ['fill', 'color', 'stroke', 'shadow']) check(!(key in node), `${path}: unexpected styled wireframe property`);
  }
  walk(data.root, file);
  counts.nodes += nodeCount;
  check(names.includes('헤더'), `${file}: header missing`);
  check(names.includes('메인 작업 영역'), `${file}: main missing`);
  if (data.viewport.width === 1440) check(names.includes('사이드바'), `${file}: desktop sidebar missing`);
  const htmlFile = file.replace('.json', '.html');
  const html = await readFile(resolve(folder, htmlFile), 'utf8');
  check(html.includes('const WIREFRAME_DATA = ' + JSON.stringify(data, null, 2) + ';'), `${htmlFile}: embedded JSON mismatch`);
  check(!html.includes('const WIREFRAME_DATA = null;'), `${htmlFile}: unfilled template`);
  check(!/<(?:script|link|img)\b[^>]*(?:src|href)=["']https?:/i.test(html), `${htmlFile}: external dependency`);
  check(html.includes('filter: grayscale(1)'), `${htmlFile}: missing grayscale guard`);
  check(!/react(?:dom)?[./-]|type=["']text\/babel/i.test(html), `${htmlFile}: React dependency`);
  const styles = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]).join('\n');
  for (const match of styles.matchAll(/#([\da-f]{6}|[\da-f]{3})\b/gi)) {
    let value = match[1];
    if (value.length === 3) value = [...value].map(c => c + c).join('');
    check(value.slice(0, 2) === value.slice(2, 4) && value.slice(2, 4) === value.slice(4, 6), `${htmlFile}: chromatic CSS ${match[0]}`);
  }
  for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
    try { new vm.Script(match[1], { filename: htmlFile }); counts.inlineScripts++; }
    catch (error) { issues.push(`${htmlFile}: ${error.message}`); }
  }
  const actions = [];
  function findActions(node) {
    if (/^todo-(toggle|edit|delete)$/.test(node._solves || '')) actions.push(node);
    (node.children || []).forEach(findActions);
  }
  findActions(data.root);
  if (actions.length) {
    let rendered = 0;
    let synced = 0;
    let focused = 0;
    const createElement = tagName => ({ tagName, style: {}, dataset: {}, attrs: {}, events: {},
      setAttribute(k, v) { this.attrs[k] = v; }, addEventListener(k, fn) { this.events[k] = fn; }, appendChild() {} });
    const context = { WIREFRAME_DATA: data, modified: false,
      document: { createElement, getElementById: () => ({ style: {} }), querySelector: () => ({ focus: () => focused++ }) },
      render: () => rendered++, updateJSONPanel: () => synced++, createGrabBar: () => createElement('div'), window: { location: { href: '' } } };
    const start = html.indexOf('function toggleTodoStatus(node)');
    const end = html.indexOf('\nfunction render() {', start);
    check(start >= 0 && end > start, `${htmlFile}: prototype helpers missing`);
    if (start >= 0 && end > start) {
      vm.createContext(context);
      vm.runInContext(html.slice(start, end), context);
      for (const action of actions) {
        let el;
        context.renderNode(action, { appendChild(node) { el = node; } }, '0.0');
        check(el.tagName === 'button' && el.type === 'button', `${htmlFile}: non-native action button`);
        if (action._solves === 'todo-toggle') {
          const initial = action.name;
          el.events.click({ stopPropagation() {} });
          check(action.name === (initial === '완료' ? '미완료' : '완료'), `${htmlFile}: status did not toggle`);
          el.events.click({ stopPropagation() {} });
          check(action.name === initial, `${htmlFile}: status did not toggle back`);
        } else {
          el.events.click({ stopPropagation() {} });
          const target = action._solves === 'todo-edit' ? 'edit' : 'delete';
          check(context.window.location.href === `todo-${target}-${data.viewport.width === 375 ? 'mobile' : 'desktop'}.wireframe.html`, `${htmlFile}: incorrect action target`);
        }
      }
      check(rendered === 6 && synced === 6 && focused === 6, `${htmlFile}: render, JSON sync or focus restoration failed`);
      check(context.modified === true, `${htmlFile}: edited state not updated`);
      const filterButton = allNodes.find(node => node._solves === 'todo-filters-toggle');
      const filterArea = allNodes.find(node => node._solves === 'todo-filters');
      check(Boolean(filterButton && filterArea), `${htmlFile}: filter disclosure missing`);
      if (filterButton && filterArea) {
        const original = JSON.stringify(filterArea.children);
        let disclosure;
        context.renderNode(filterButton, { appendChild(node) { disclosure = node; } }, '0.1');
        check(disclosure.attrs['aria-expanded'] === 'true', `${htmlFile}: filters should start expanded`);
        disclosure.events.click({ stopPropagation() {} });
        check(filterArea._solves === 'todo-filters-hidden' && filterButton.name === '검색·필터 표시', `${htmlFile}: filter hide failed`);
        let hiddenArea;
        context.renderNode(filterArea, { appendChild(node) { hiddenArea = node; } }, '0.2');
        check(hiddenArea.hidden === true && hiddenArea.style.display === 'none', `${htmlFile}: hidden filters still displayed`);
        disclosure.events.click({ stopPropagation() {} });
        check(filterArea._solves === 'todo-filters' && filterButton.name === '검색·필터 숨기기', `${htmlFile}: filter show failed`);
        check(JSON.stringify(filterArea.children) === original, `${htmlFile}: filter content lost on toggle`);
        counts.filterToggles++;
      }
      counts.interactiveLists++;
    }
  }
  details.push({ json: file, html: htmlFile, viewport: data.viewport, nodes: nodeCount });
}
check(files.length === 13 && counts.desktop === 6 && counts.mobile === 7, 'expected six desktop and seven mobile screen pairs');
const report = {
  checkedAt: new Date().toISOString(),
  result: issues.length ? 'FAIL' : 'PASS',
  scope: 'Static schema, layout, grayscale, HTML/JSON parity, JS syntax, no React; mocked DOM action tests: bidirectional status toggle, summary/JSON refresh, focus restoration, edit/delete screen navigation',
  counts,
  issues,
  browserVerification: { result: 'BLOCKED', reason: 'Chrome headless exited before rendering: Windows CreateFile / mojo platform channel Access denied (0x5). No screenshot or runtime layout pass is claimed.' },
  details,
};
await writeFile(resolve(folder, 'validation-report.json'), JSON.stringify(report, null, 2) + '\n', 'utf8');
console.log(JSON.stringify({ result: report.result, counts, issues }, null, 2));
if (issues.length) process.exitCode = 1;
