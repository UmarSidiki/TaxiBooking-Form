import fs from 'fs';
const dir='messages';const flat=(o,p='')=>Object.entries(o).flatMap(([k,v])=>v&&typeof v==='object'?flat(v,p+k+'.'):[p+k]);
const en=new Set(flat(JSON.parse(fs.readFileSync(dir+'/en.json'))));let bad=0;
for(const f of fs.readdirSync(dir)){if(f==='en.json')continue;const s=new Set(flat(JSON.parse(fs.readFileSync(dir+'/'+f))));
const miss=[...en].filter(k=>!s.has(k)),extra=[...s].filter(k=>!en.has(k));if(miss.length||extra.length){bad=1;console.log(f,'missing',miss.length,'extra',extra.length);if(process.argv[2])console.log(miss.join('\n'))}}
process.exit(bad);
