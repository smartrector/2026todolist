import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
const doc=JSON.parse(fs.readFileSync(path.join(dir,'todo-hifi.native.json'),'utf8'));
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
const system=JSON.parse(fs.readFileSync(path.join(dir,'design-system.json'),'utf8'));
const nodes=Object.values(doc.nodes);
const problems=[];
const norm=t=>t.replace(/\s+/g,' ').trim();
const children=n=>(n.children||[]).flatMap(id=>[doc.nodes[id],...children(doc.nodes[id])]);
const frameReports=[];
for(const frame of manifest.frames){
 const root=doc.nodes[frame.id];const descendants=children(root);
 const source=JSON.parse(fs.readFileSync(path.resolve(dir,'../../../wireframes',frame.source),'utf8'));
 const texts=[];function sourceTexts(n){if(n.type==='text'||n.type==='button'||n.type==='link'||n.type==='input')texts.push(norm(n.name));for(const c of n.children||[])sourceTexts(c)}sourceTexts(source.root);
 const actual=descendants.filter(n=>n.type==='text').map(n=>norm(n.characters));
 for(const text of texts){const i=actual.indexOf(text);if(i<0)problems.push(frame.name+': missing text '+text);else actual.splice(i,1)}
 if(root.width!==frame.width||root.height!==frame.height)problems.push(frame.name+': incorrect viewport');
 const overflow=descendants.filter(n=>{
  const parent=doc.nodes[n.parent];if(!parent||parent.type==='page')return false;
  const x=n.transform?.[4]||0,y=n.transform?.[5]||0;
  return x<-.5||y<-.5||x+n.width>parent.width+1||y+n.height>parent.height+1;
 }).map(n=>({id:n.id,name:n.name}));
 if(overflow.length)problems.push(frame.name+': overflowing nodes '+JSON.stringify(overflow));
 frameReports.push({id:frame.id,name:frame.name,width:root.width,height:root.height,descendants:descendants.length,preservedTextCount:texts.length,overflow});
}
function luminance(hex){const rgb=hex.match(/[a-f\d]{2}/gi).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722}
function contrast(a,b){const [x,y]=[luminance(a),luminance(b)].sort((a,b)=>b-a);return Math.round((x+.05)/(y+.05)*100)/100}
const pairs=[['ink','paper',4.5],['secondary','paper',4.5],['muted','paper',4.5],['onDark','ink',4.5],['blue','blueSoft',4.5],['success','successSoft',4.5],['error','errorSoft',4.5],['border','surface',3],['focus','surface',3],['focus','paper',3]];
const contrastReports=pairs.map(([foreground,background,minimum])=>{const ratio=contrast(system.colors[foreground],system.colors[background]);if(ratio<minimum)problems.push('contrast '+foreground+'/'+background);return{foreground,background,ratio,minimum}});
const fonts=[...new Set(nodes.filter(n=>n.type==='text').map(n=>n.style.font_family))];
if(fonts.length!==1||fonts[0]!=='Pretendard')problems.push('font mismatch');
const images=nodes.filter(n=>n.fills?.some(p=>p.type==='image'));if(images.length)problems.push('unexpected raster layers');
const report={status:problems.length?'needs-fix':'passed',screenCount:manifest.frames.length,designBoards:manifest.boards.length,totalNodes:nodes.length,variables:doc.variables.variables.length,styles:doc.styles.length,components:nodes.filter(n=>n.type==='component').length,autoLayoutFrames:nodes.filter(n=>n.layout).length,boundNodes:nodes.filter(n=>n.bound&&Object.keys(n.bound).length).length,fonts,imageLayers:images.length,contrastReports,frames:frameReports,problems,limitations:['Hover, focus and error are editable design-state examples; no application handlers were implemented.','Hallmark sloplint was invoked with --render; native .figcraft files are not supported by its HTML/CSS parser. Native frame bounds, typography, contrast and rendered previews were checked instead.','Python was unavailable. UI/UX Pro Max local CSV product/style entries and skill rules were read directly; automated search/design-system generation was not claimed.']};
fs.writeFileSync(path.join(dir,'validation-report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
if(problems.length)process.exitCode=1;
