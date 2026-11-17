import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const sourceDir = path.resolve(here, '../../wireframes');
const order = ['list', 'create', 'edit', 'delete', 'empty', 'no-results', 'sidebar-open'];
const commands = [];
const frames = [];
let nextId = 2;
const font = 'Noto Sans KR';
const measure = (text, size) => [...text].reduce((w, c) => w + (/[^\u0000-\u00ff]/.test(c) ? size : size * 0.56), 0);
const padding = p => typeof p === 'number' ? [p,p,p,p] : !p ? [0,0,0,0] : p.length === 2 ? [p[0],p[1],p[0],p[1]] : p;
const isAction = n => n.type === 'button' || n.type === 'link';
const sizeOf = n => n.variant === 'display' ? 28 : n.variant === 'heading' ? 24 : n.variant === 'caption' ? 12 : 14;
const primary = n => ['Todo 등록','첫 Todo 등록','등록','변경 내용 저장'].includes(n.name);

function intrinsic(n, mobile) {
  if (n.width) return n.width;
  if (isAction(n)) return Math.ceil(measure(n.name, mobile && n.height === 32 ? 12 : 14) + (mobile && n.height === 32 ? 12 : 24));
  if (n.type === 'text') return Math.ceil(measure(n.name, sizeOf(n))) + 16;
  if (n.direction === 'horizontal') return (n.children || []).reduce((s,c) => s + intrinsic(c,mobile), 0) + Math.max(0,(n.children?.length || 0)-1)*(n.gap || 0);
  return 0;
}

// Resolve dimensions before emitting commands. Every related group remains an
// auto-layout frame; explicit text widths allow Korean labels to wrap reliably.
function layout(n, width, mobile, allocatedHeight) {
  const node = {...n, children: undefined, w: Math.max(1,width)};
  const p = padding(n.padding);
  node.pad = p;
  if (n.type === 'divider') { node.h = 1; return node; }
  if (n.type === 'text') {
    node.fontSize = sizeOf(n);
    if (mobile && n.name === '아직 등록한 Todo가 없습니다') node.name = '아직 등록한 Todo가\n없습니다';
    if (mobile && n.name === '일치하는 Todo가 없습니다') node.name = '일치하는 Todo가\n없습니다';
    const lineHeight = Math.ceil(node.fontSize * 1.5);
    const lines = Math.max(1, Math.ceil(measure(n.name,node.fontSize)/Math.max(1,width)));
    node.h = Math.max(n.height || 0, lines * lineHeight);
    return node;
  }
  if (isAction(n) || n.type === 'input') {
    node.h = n.height || 44;
    node.fontSize = mobile && node.h === 32 ? 12 : 14;
    return node;
  }
  const children = n.children || [];
  const inner = Math.max(1,width-p[1]-p[3]);
  const gap = n.gap || 0;
  node.children = [];
  if (n.direction === 'horizontal') {
    const flexible = children.map(c => c.grow === true || (!c.width && !isAction(c) && c.type !== 'text' && c.name !== '완료 상태 및 항목 동작'));
    const fixedTotal = children.reduce((s,c,i) => s + (flexible[i] ? 0 : intrinsic(c,mobile)),0);
    const fillCount = flexible.filter(Boolean).length;
    const available = Math.max(1,inner-fixedTotal-gap*Math.max(0,children.length-1));
    children.forEach((c,i) => {
      const cw = flexible[i] ? available/Math.max(1,fillCount) : intrinsic(c,mobile);
      const fillHeight = c.name === '사이드바' ? allocatedHeight : undefined;
      node.children.push(layout(c,Math.max(1,cw),mobile,fillHeight));
    });
    node.h = Math.max(n.height || allocatedHeight || 0, Math.max(0,...node.children.map(c=>c.h))+p[0]+p[2]);
  } else {
    const fixedHeights = children.filter(c=>c.name!=='본문').map(c => layout(c,Math.min(inner,c.width || c.maxWidth || inner),mobile));
    let fixedIndex=0;
    for (const c of children) {
      if (c.name === '본문') {
        const used = fixedHeights.reduce((s,c)=>s+c.h,0)+gap*Math.max(0,children.length-1)+p[0]+p[2];
        node.children.push(layout(c,inner,mobile,Math.max(1,(n.height || allocatedHeight || 960)-used)));
      } else node.children.push(fixedHeights[fixedIndex++]);
    }
    const contentHeight = node.children.reduce((s,c)=>s+c.h,0)+gap*Math.max(0,children.length-1)+p[0]+p[2];
    node.h = Math.max(n.height || allocatedHeight || 0, contentHeight);
  }
  return node;
}

function create(command,params) {
  const id=nextId++;
  commands.push({command,params:{...params,select:false}});
  return id;
}
function set(id,props) { commands.push({command:'node.set',params:{ids:[id],...props}}); }
function label(text,parent,width,height,size,color,bold=false,align='left',vertical='middle') {
  return create('text.create',{text,name:text,parent,x:0,y:0,width,props:{height,fontFamily:font,fontStyle:bold?'Bold':'Regular',fontSize:size,lineHeight:Math.ceil(size*1.5),fill:color,textAutoResize:'none',textAlign:align,textAlignVertical:vertical,sizingH:'fixed',sizingV:'fixed'}});
}
function emit(n,parent,x=0,y=0,mobile=false) {
  if (n.type === 'text') return label(n.name,parent,n.w,n.h,n.fontSize,'#333333',n.variant === 'display' || n.variant === 'heading');
  if (n.type === 'divider') return create('shape.rectangle',{name:'구분선',parent,x,y,width:n.w,height:1,props:{fill:'#D9D9D9'}});
  const action=isAction(n), input=n.type==='input';
  let fill='none',stroke='none';
  if (action) { fill=primary(n)?'#2C2C2C':'#F2F2F2';stroke=primary(n)?'#2C2C2C':'#A6A6A6'; }
  if (input) { fill='#FFFFFF';stroke='#A6A6A6'; }
  if (n.name==='사이드바' || n.name==='모바일 사이드바 펼침') fill='#F7F7F7';
  if (n.name==='Todo 입력 폼' || n.name==='삭제 확인 대화상자' || n.name==='목록 상태 안내') {fill='#FFFFFF';stroke='#D9D9D9';}
  if (n.name==='페이지') fill='#FFFFFF';
  const props={fill,stroke,strokeWeight:1,layout:action||input?'horizontal':n.direction||'vertical',gap:n.gap||0,padding:n.pad||0,mainAlign:n.justify==='space-between'?'spaceBetween':n.justify==='flex-end'?'max':n.justify==='center'?'center':'min',crossAlign:n.align==='center'?'center':'min',sizingH:'fixed',sizingV:'fixed',clip:false};
  if(action||input) {props.padding=input?[12,12,12,12]:[0,mobile&&n.h===32?6:12,0,mobile&&n.h===32?6:12];props.mainAlign=action?'center':'min';props.crossAlign=input&&n.h>60?'min':'center';props.cornerRadius=4;}
  const id=create('frame.create',{name:n.name,parent,x,y,width:n.w,height:n.h,props});
  if (action||input) {
    const inset=mobile&&n.h===32?6:12;
    label(n.name,id,Math.max(1,n.w-inset*2),input?n.h-24:n.h,n.fontSize||14,primary(n)?'#FFFFFF':'#333333',false,action?'center':'left',input&&n.h>60?'top':'middle');
  } else for (const c of n.children || []) emit(c,id,0,0,mobile);
  return id;
}

for (const kind of order) {
  for (const device of ['desktop','mobile']) {
    const filename=`todo-${kind}-${device}.wireframe.json`;
    const full=path.join(sourceDir,filename);
    if(!fs.existsSync(full))continue;
    const source=JSON.parse(fs.readFileSync(full,'utf8'));
    const mobile=device==='mobile';
    const tree=layout(source.root,source.viewport.width,mobile);
    const rootId=emit(tree,1,mobile?1760:160,160+order.indexOf(kind)*1600,mobile);
    set(rootId,{name:source.name,clip:true});
    frames.push({id:rootId,name:source.name,width:source.viewport.width,height:source.viewport.height,source:filename});
  }
}
fs.writeFileSync(path.join(here,'todo-all-screens.commands.json'),JSON.stringify(commands));
fs.writeFileSync(path.join(here,'todo-all-screens.manifest.json'),JSON.stringify({format:'figcraft',screenCount:frames.length,fontFamily:font,frames},null,2));
console.log(JSON.stringify({screens:frames.length,commands:commands.length,nodes:nextId-2}));
