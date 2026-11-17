import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const sourceDir = path.resolve(here, '../../wireframes');
const order = ['list', 'create', 'edit', 'delete', 'empty', 'no-results', 'sidebar-open'];
const commands = [];
const frames = [];
let nextId = 2;
const font = 'Pretendard';
const outDir = path.join(here, 'hifi');
fs.mkdirSync(outDir,{recursive:true});
const colors={paper:'#F6F6F2',surface:'#FFFFFF',surfaceAlt:'#EEF3F8',ink:'#14263D',secondary:'#34465B',muted:'#626A70',rule:'#CBD0D1',border:'#7A899B',navyHover:'#223D5D',blue:'#245CB0',blueSoft:'#EAF1FC',focus:'#527BBD',error:'#B42332',errorSoft:'#FFF0F2',success:'#17633E',successSoft:'#EAF6EF',disabled:'#DDE3EB',onDark:'#F6F6F2',onDarkMuted:'#BAC4CF'};
const colorsByHex=new Map(Object.entries(colors).map(([k,v])=>[v,k]));
const measure = (text, size) => [...text].reduce((w, c) => w + (/[^\u0000-\u00ff]/.test(c) ? size : size * 0.56), 0);
const padding = p => typeof p === 'number' ? [p,p,p,p] : !p ? [0,0,0,0] : p.length === 2 ? [p[0],p[1],p[0],p[1]] : p;
const isAction = n => n.type === 'button' || n.type === 'link';
const sizeOf = n => n.variant === 'display' ? 28 : n.variant === 'heading' ? 24 : n.variant === 'caption' ? 14 : 16;
const primary = n => ['Todo 등록','첫 Todo 등록','등록','변경 내용 저장'].includes(n.name);

function intrinsic(n, mobile) {
  if (n.width) return n.width;
  if (isAction(n)) return Math.max(44, Math.ceil(measure(n.name, mobile && n.height === 44 && ['미완료','완료','수정','삭제'].includes(n.name) ? 12 : 16) + (mobile ? 12 : 28)));
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
    node.fontSize = mobile && ['미완료','완료','수정','삭제'].includes(n.name) ? 12 : 16;
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
function emit(n,parent,x=0,y=0,mobile=false,onDark=false) {
  if (n.type === 'text') {const id=label(n.name,parent,n.w,n.h,n.fontSize,onDark?colors.onDarkMuted:n.variant==='caption'?colors.muted:colors.ink,n.variant === 'display' || n.variant === 'heading');if(n.grow||n.name==='화면 흐름 문서 검토'||n.name==='와이어프레임 의견 정리'||n.name==='등록 폼 검증 항목 확인')set(id,{sizingH:'fill'});return id;}
  if (n.type === 'divider') return create('shape.rectangle',{name:'구분선',parent,x,y,width:n.w,height:1,props:{fill:colors.rule}});
  const action=isAction(n), input=n.type==='input';
  let fill='none',stroke='none';
  let textColor=colors.ink;
  const sidebar=n.name==='사이드바'||n.name==='모바일 사이드바 펼침';
  const task=/ 행$| 항목$/.test(n.name);
  if (action) { fill=primary(n)?colors.ink:colors.surface;stroke=primary(n)?colors.ink:colors.border; }
  if (input) { fill=colors.surface;stroke=colors.border; }
  if (sidebar) fill=colors.ink;
  if (n.name==='Todo 입력 폼' || n.name==='삭제 확인 대화상자' || n.name==='목록 상태 안내') {fill=colors.surface;stroke=colors.rule;}
  if (n.name==='페이지') fill=colors.paper;
  if (n.name==='헤더') fill=colors.surface;
  if(task){fill=colors.surface;stroke=colors.rule;}
  if(action && n.name==='미완료'){fill=colors.blueSoft;stroke='none';textColor=colors.blue;}
  if(action && n.name==='완료'){fill=colors.successSoft;stroke='none';textColor=colors.success;}
  if(action && n.name==='삭제'){fill=colors.errorSoft;stroke='none';textColor=colors.error;}
  if(action && (n.name==='취소'||n.name==='수정'||n.name==='검색·필터 숨기기'||n.name==='목록으로 돌아가기')){fill='none';stroke='none';textColor=colors.secondary;}
  if(onDark&&action){fill=colors.blueSoft;stroke='none';textColor=colors.blue;}
  const props={fill,stroke,strokeWeight:1,layout:action||input?'horizontal':n.direction||'vertical',gap:n.gap||0,padding:n.pad||0,mainAlign:n.justify==='space-between'?'spaceBetween':n.justify==='flex-end'?'max':n.justify==='center'?'center':'min',crossAlign:n.align==='center'?'center':'min',sizingH:'fixed',sizingV:'fixed',clip:false};
  if(action||input) {props.padding=input?[12,12,12,12]:[0,mobile?6:14,0,mobile?6:14];props.mainAlign=action?'center':'min';props.crossAlign=input&&n.h>60?'min':'center';props.cornerRadius=8;}
  if(task||n.name==='Todo 입력 폼'||n.name==='목록 상태 안내'||n.name==='삭제 확인 대화상자')props.cornerRadius=12;
  const id=create('frame.create',{name:n.name,parent,x,y,width:n.w,height:n.h,props});
  if (action||input) {
    const inset=mobile?6:14;
    const textId=label(n.name,id,Math.max(1,n.w-inset*2),input?n.h-24:n.h,n.fontSize||16,primary(n)?colors.onDark:textColor,primary(n),action?'center':'left',input&&n.h>60?'top':'middle');
    if(input)set(textId,{sizingH:'fill',sizingV:'fill'});
  } else for (const c of n.children || []) emit(c,id,0,0,mobile,onDark||sidebar);
  if(n.name!=='페이지'&&!n.width&&!n.maxWidth&&(n.grow||['헤더','본문','메인 작업 영역','검색 및 상태 필터','Todo 목록','내용 검색','상태 선택'].includes(n.name)))set(id,{sizingH:'fill'});
  if(n.name==='본문')set(id,{sizingV:'fill'});
  return id;
}

for (const kind of order) {
  for (const device of ['desktop','mobile']) {
    const filename=`todo-${kind}-${device}.wireframe.json`;
    const full=path.join(sourceDir,filename);
    if(!fs.existsSync(full))continue;
    const source=JSON.parse(fs.readFileSync(full,'utf8'));
    const mobile=device==='mobile';
    function adapt(n){if(isAction(n))n.height=Math.max(44,n.height||44);if(/ 행$| 항목$/.test(n.name)){n.height=mobile?104:88;n.padding=mobile?12:16;}for(const c of n.children||[])adapt(c);}
    adapt(source.root);
    const tree=layout(source.root,source.viewport.width,mobile);
    const rootId=emit(tree,1,mobile?1760:160,160+order.indexOf(kind)*1600,mobile);
    set(rootId,{name:source.name,clip:true});
    frames.push({id:rootId,name:source.name,width:source.viewport.width,height:source.viewport.height,source:filename});
  }
}
// Append design-system boards to the right of the screen pairs.
function frame(name,parent,w,h,props={},x=0,y=0){return create('frame.create',{name,parent,width:w,height:h,x,y,props:{fill:'none',layout:'vertical',gap:16,padding:0,sizingH:'fixed',sizingV:'fixed',clip:false,...props}})}
const boards=[];
const foundation=frame('Design system / Foundations',1,1440,1280,{fill:colors.surface,padding:48,gap:24},2400,160);boards.push(foundation);
label('Todo 디자인 시스템',foundation,1344,48,32,colors.ink,true);
label('Pretendard와 네이비를 계승한 작업 중심 인터페이스',foundation,1344,28,16,colors.secondary);
label('기존 13개 화면의 순서와 기능 유지. 기업 홈페이지의 큰 히어로 타이포그래피는 앱 크기로 조정.',foundation,1344,28,16,colors.secondary);
label('색상',foundation,1344,32,24,colors.ink,true);
for(const group of [Object.entries(colors).slice(0,7),Object.entries(colors).slice(7,14),Object.entries(colors).slice(14)]){
 const row=frame('Color tokens',foundation,1344,124,{layout:'horizontal',gap:16});
 for(const [name,value]of group){const sw=frame('color/'+name,row,176,124,{gap:8});frame('Swatch / '+name,sw,176,60,{fill:value,cornerRadius:8});label(name+' '+value,sw,176,48,14,colors.ink);}
}
label('타이포그래피',foundation,1344,32,24,colors.ink,true);
for(const [name,size,weight]of [['페이지 제목',28,true],['영역 제목',24,true],['본문과 입력',16,false],['라벨과 도움말',14,false]])label(name+'  /  Pretendard '+size+'px',foundation,1344,Math.ceil(size*1.5),size,colors.ink,weight);
label('간격 4 / 8 / 12 / 16 / 24 / 32 / 48px     반경 8px 컨트롤 / 12px 카드',foundation,1344,32,16,colors.secondary);
label('일반 글자 대비 4.5:1 이상. 입력 경계와 포커스 3:1 이상. 상태는 색상과 텍스트로 함께 구분.',foundation,1344,32,16,colors.secondary);

const components=frame('Design system / Component states',1,1440,1480,{fill:colors.surface,padding:48,gap:24},2400,1600);boards.push(components);
label('컴포넌트와 상태',components,1344,48,32,colors.ink,true);
label('상태별 크기 고정. Hover는 포인터 전용. Focus는 지연 없이 표시. 터치 목표는 최소 44×44px.',components,1344,28,16,colors.secondary);
const componentIds=[];
const states=['Default','Hover','Focus','Active','Disabled'];
for(const type of ['Primary button','Secondary button','Input']){
 label(type,components,1344,32,24,colors.ink,true);const row=frame(type+' variants',components,1344,128,{layout:'horizontal',gap:24});
 for(const state of states){const cell=frame(state,row,240,128,{gap:12});label(state,cell,240,24,14,colors.muted);
 const focus=state==='Focus';const wrapper=frame(type+' / '+state,cell,240,56,{padding:4,stroke:focus?colors.focus:'none',strokeWeight:2,cornerRadius:12});
 const isInput=type==='Input',isPrimary=type==='Primary button',disabled=state==='Disabled';const bg=disabled?colors.disabled:isPrimary?(state==='Hover'?colors.navyHover:state==='Active'?colors.blue:colors.ink):state==='Hover'?colors.surfaceAlt:colors.surface;
 const c=frame(type,wrapper,232,48,{layout:'horizontal',mainAlign:isInput?'min':'center',crossAlign:'center',padding:[0,16,0,16],fill:bg,stroke:isPrimary?'none':colors.border,strokeWeight:1,cornerRadius:8});
 const textId=label(isInput?'Todo 내용 검색':'Todo 등록',c,200,46,16,disabled?colors.muted:isPrimary?colors.onDark:colors.ink,isPrimary,isInput?'left':'center');
 componentIds.push({id:wrapper,label:textId,name:type+' / '+state});
 }
}
label('Input / Error',components,1344,32,24,colors.ink,true);
const errorGroup=frame('입력 오류',components,600,144,{gap:8});label('Todo 내용 (필수)',errorGroup,600,24,14,colors.ink,true);
const errorInput=frame('Error textarea',errorGroup,600,56,{fill:colors.surface,stroke:colors.error,strokeWeight:1,cornerRadius:8,padding:16});label(' ',errorInput,568,24,16,colors.ink);
label('할 일을 입력해 주세요. 공백만 입력하면 저장할 수 없습니다.',errorGroup,600,24,14,colors.error);
label('Card / Default / Hover / Focus',components,1344,32,24,colors.ink,true);
const cards=frame('Card states',components,1344,144,{layout:'horizontal',gap:24});
for(const state of ['Default','Hover','Focus']){const c=frame('Task card / '+state,cards,432,144,{fill:state==='Hover'?colors.blueSoft:colors.surface,stroke:state==='Focus'?colors.focus:colors.rule,strokeWeight:state==='Focus'?2:1,cornerRadius:12,padding:24,gap:8});label('화면 흐름 문서 검토',c,384,24,16,colors.ink,true);label('미완료   수정   삭제',c,384,24,14,colors.blue);componentIds.push({id:c,name:'Task card / '+state});}
label('로딩 중에는 버튼 너비와 라벨 공간을 유지합니다. 완료는 초록색과 “완료” 문구를 함께 사용합니다.',components,1344,28,16,colors.secondary);

const responsive=frame('Design system / Responsive and analysis',1,1440,1160,{fill:colors.surface,padding:48,gap:24},2400,3240);boards.push(responsive);
label('Lo-fi 분석과 반응형 규칙',responsive,1344,48,32,colors.ink,true);
const notes=[
'보존: 헤더 → 사이드바 → 제목 → 검색·필터 → 요약 → 목록 순서. 등록·수정·삭제와 빈 상태 문구.',
'개선: 회색 Lo-fi의 동일한 버튼 위계를 주요·보조·위험 행동으로 구분. 필드 라벨과 오류 도움말 유지.',
'1440px: 헤더 64px, 사이드바 240px, 메인 여백 32px. 검색과 상태 필터는 가로 배치.',
'375px: 헤더 64px, 메인 여백 24px. 사이드바는 메뉴로 접고 검색·필터는 세로 배치.',
'375px: 완료·수정·삭제는 한 행 유지. 버튼 높이와 최소 너비 44px, 내용은 남는 폭에서 줄바꿈.',
'960px 미만: 사이드바를 메뉴로 전환. 768px 미만: 검색·필터와 제목 동작을 단일 열로 전환.',
'768~959px: 사이드바는 접힘. 메인은 24px 여백. 검색 조건은 가용 폭이 600px 이상일 때 가로 배치.',
'1920px 이상: 메인 작업 너비 1200px 상한. 남는 폭은 양쪽 여백. 긴 본문은 65ch 이내.',
'Auto Layout: 상하 그룹은 Vertical, 헤더·동작·목록 행은 Horizontal. 문구 수정 시 그룹 간격 유지.',
'Focus: 2px 링 + 2px 오프셋. 입력 경계는 1px 유지. Error는 필드 바로 아래 원인과 해결책 표시.',
'전환: 색·불투명도만 150ms. 키보드 포커스는 즉시. 동작 줄이기 설정에서는 전환을 제거.',
'산출물은 편집 가능한 설계 프레임입니다. 화면 전환·폼 검증의 실제 앱 동작은 구현하지 않습니다.',
'출처: docs/design-system.md / Lo-fi JSON·HTML / UI/UX Pro Max Productivity Tool, Flat Design / Hallmark restyle.'
];for(const note of notes)label(note,responsive,1344,44,16,colors.secondary);

// Reusable component definitions on the state board, without changing app structure.
for(const c of componentIds){commands.push({command:'component.create',params:{ids:[c.id]}});if(c.label)commands.push({command:'component.addProperty',params:{id:c.id,name:'Label',type:'text',layer:c.label,default:'Todo 등록'}});}
const definitions=[{command:'variable.createCollection',as:'theme',params:{name:'Todo Hi-fi',modes:['Light']}}];
for(const [role,value]of Object.entries(colors))definitions.push({command:'variable.create',params:{collection:{$ref:'theme'},name:'color/'+role,type:'color',value}});
definitions.push({command:'variable.create',params:{collection:{$ref:'theme'},name:'font/body',type:'string',value:font}});
for(const [role,value]of Object.entries({control:8,card:12}))definitions.push({command:'variable.create',params:{collection:{$ref:'theme'},name:'radius/'+role,type:'number',value}});
for(const n of [4,8,12,16,24,32,48])definitions.push({command:'variable.create',params:{collection:{$ref:'theme'},name:'space/'+n,type:'number',value:n}});
for(const n of [12,14,16,24,28,32])definitions.push({command:'variable.create',params:{collection:{$ref:'theme'},name:'type/'+n,type:'number',value:n}});
const bindingGroups=new Map();
// IDs are deterministic for node creation. Variable commands use their own UUIDs.
const textGroups=new Map();
let nodeIndex=2;for(const c of commands){if(!['frame.create','text.create','shape.rectangle'].includes(c.command))continue;const id=nodeIndex++;for(const field of ['fill','stroke']){const role=colorsByHex.get(c.params.props?.[field]);if(role){const key=field+'|color/'+role;if(!bindingGroups.has(key))bindingGroups.set(key,[]);bindingGroups.get(key).push(id)}}
 const p=c.params.props||{};
 for(const [field,role]of [['cornerRadius',p.cornerRadius===8?'radius/control':p.cornerRadius===12?'radius/card':null],['gap',[4,8,12,16,24,32,48].includes(p.gap)?'space/'+p.gap:null],['fontSize',p.fontSize?'type/'+p.fontSize:null]]){if(role){const key=field+'|'+role;if(!bindingGroups.has(key))bindingGroups.set(key,[]);bindingGroups.get(key).push(id)}}
 if(c.command==='text.create'){const key=p.fontSize+' / '+p.fontStyle;if(!textGroups.has(key))textGroups.set(key,[]);textGroups.get(key).push(id);}
}
for(const [key,ids]of bindingGroups){const [field,role]=key.split('|');commands.push({command:'variable.bind',params:{ids,field,variable:role}});}
let styleIndex=0;for(const [role,ids]of textGroups){const name='Todo / '+role;const ref='textStyle'+styleIndex++;commands.push({command:'style.create',as:ref,params:{type:'text',name,from:ids[0]}});commands.push({command:'style.apply',params:{ids,style:{$ref:ref}}});}
commands.unshift(...definitions);
const output=path.join(outDir,'todo-hifi.figcraft').replaceAll('\\','/');
const requests=[{name:'batch',arguments:{label:'Todo Hi-fi / screens and design system',commands},saveResult:path.join(outDir,'mcp-build-result.json'),maxOutput:600},{name:'save_file',arguments:{path:output}},{name:'run_command',arguments:{command:'file.fontReport'},saveResult:path.join(outDir,'font-report.json'),maxOutput:1500}];
fs.writeFileSync(path.join(outDir,'build.requests.json'),JSON.stringify(requests));
fs.writeFileSync(path.join(outDir,'design-system.json'),JSON.stringify({font,colors,baseDocument:'docs/design-system.md',style:'Flat Design + Micro-interactions',scope:'Hallmark restyle / app',sizes:{body:16,label:14,title:28,section:24},radius:{control:8,card:12},breakpoints:{sidebar:960,stack:768},touchTarget:44,originalScreens:13,boards,frames},null,2));
fs.writeFileSync(path.join(outDir,'manifest.json'),JSON.stringify({format:'figcraft',screenCount:frames.length,fontFamily:font,frames,boards},null,2));
console.log(JSON.stringify({screens:frames.length,commands:commands.length,nodes:nextId-2}));
