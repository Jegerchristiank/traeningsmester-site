import { strToU8, unzipSync, zipSync } from 'fflate';
import { tableNames, transferDocument } from './schemas.js';
const quote = (value: string) => `"${value.replaceAll('"','""')}"`;
export function csvArchive(document: unknown): Uint8Array {
  const value = transferDocument.parse(document);
  const { tables, ...metadata } = value;
  const manifest = { ...metadata, encoding:'UTF-8', delimiter:',', recordColumn:'record', tables:tableNames.map(name=>({name,file:`${name}.csv`,rows:(tables[name] as unknown[]).length})) };
  const files: Record<string,Uint8Array> = {'manifest.json':strToU8(JSON.stringify(manifest,null,2))};
  for (const name of tableNames) {
    const rows = tables[name] as Record<string,unknown>[];
    // JSON in the record column preserves null, decimal, nested and versioned
    // values. IDs are an optional convenience; record is the canonical payload.
    files[`${name}.csv`] = strToU8('id,record\r\n'+rows.map(row=>`${quote(typeof row.id==='string'?row.id:'')},${quote(JSON.stringify(row))}\r\n`).join(''));
  }
  return zipSync(files,{level:6});
}
export function parseCsvArchive(bytes: Uint8Array): unknown {
  if(bytes.byteLength>10*1024*1024) throw new Error('transfer_too_large');
  let total=0;
  const files=unzipSync(bytes,{filter:file=>{total+=file.originalSize;if(total>32*1024*1024) throw new Error('transfer_too_large');return file.name==='manifest.json'||tableNames.some(n=>file.name===`${n}.csv`);}});
  const manifest=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(files['manifest.json'])) as Record<string,unknown>;
  if(manifest.encoding!=='UTF-8'||manifest.delimiter!==','||manifest.recordColumn!=='record') throw new Error('invalid_manifest');
  const tables:Record<string,unknown[]>={};
  for(const name of tableNames){
    const text=new TextDecoder('utf-8',{fatal:true}).decode(files[`${name}.csv`]);
    const rows=parseCsv(text);if(rows.shift()?.join(',')!=='id,record') throw new Error('invalid_csv_header');
    tables[name]=rows.map(row=>{if(row.length!==2) throw new Error('invalid_csv_row');return JSON.parse(row[1]);});
    const declaration=(manifest.tables as {name:string;file:string;rows:number}[]).find(t=>t.name===name);
    if(!declaration||declaration.file!==`${name}.csv`||declaration.rows!==tables[name].length) throw new Error('manifest_count_mismatch');
  }
  const {encoding:_e,delimiter:_d,recordColumn:_r,tables:_t,...metadata}=manifest;
  return transferDocument.parse({...metadata,tables});
}
function parseCsv(text:string):string[][]{
  const rows:string[][]=[];let row:string[]=[];let cell='';let quoted=false;let closed=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(quoted){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++;}else{quoted=false;closed=true;}}else cell+=c;continue;}
    if(c==='"'&&!cell&&!closed){quoted=true;continue;}
    if(c===','||c==='\r'||c==='\n'){row.push(cell);cell='';closed=false;if(c!==','){if(c==='\r'&&text[i+1]==='\n')i++;rows.push(row);row=[];}continue;}
    if(closed)throw new Error('invalid_csv_quote');cell+=c;
  }
  if(quoted)throw new Error('invalid_csv_quote');if(cell||row.length){row.push(cell);rows.push(row);}return rows;
}
