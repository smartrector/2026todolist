import { Client } from '../../../.tools/figcraft/node_modules/@modelcontextprotocol/sdk/dist/esm/client/index.js';
import { StdioClientTransport } from '../../../.tools/figcraft/node_modules/@modelcontextprotocol/sdk/dist/esm/client/stdio.js';
import fs from 'node:fs';
const root='C:/hanyong5/04test/01testproject';
const transport=new StdioClientTransport({command:'C:/hanyong5/program/figcraft/figcraft-cli.exe',args:['mcp','--automation-write-root',root],stderr:'pipe'});
const client=new Client({name:'todo-hifi-design',version:'1.0.0'});
try {
  await client.connect(transport);
  const requestPath=process.argv[2];
  if(requestPath){
    const requests=JSON.parse(fs.readFileSync(requestPath,'utf8'));
    for(const request of requests){
      const result=await client.callTool({name:request.name,arguments:request.arguments||{}},undefined,{timeout:180000});
      if(request.saveResult)fs.writeFileSync(request.saveResult,JSON.stringify(result,null,2));
      if(result.isError)throw new Error(JSON.stringify(result));
      console.log(JSON.stringify({tool:request.name,result}).slice(0,request.maxOutput||1500));
    }
  }else{
    const list=await client.listTools();
    fs.writeFileSync(root+'/docs/design/figcraft/mcp-tools.json',JSON.stringify(list,null,2));
    console.log(JSON.stringify(list.tools.map(t=>({name:t.name,schema:t.inputSchema}))).slice(0,18000));
  }
}finally{await client.close();}
