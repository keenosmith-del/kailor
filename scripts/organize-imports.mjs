import ts from 'typescript';
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
const files=readdirSync('frontend/src').filter(f=>/\.tsx?$/.test(f)).map(f=>'frontend/src/'+f);
const host={getScriptFileNames:()=>files,getScriptVersion:()=> '0',getScriptSnapshot:f=>{try{return ts.ScriptSnapshot.fromString(readFileSync(f,'utf8'))}catch{return undefined}},getCurrentDirectory:()=>process.cwd(),getCompilationSettings:()=>({jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2023,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler}),getDefaultLibFileName:o=>ts.getDefaultLibFilePath(o),fileExists:ts.sys.fileExists,readFile:ts.sys.readFile,readDirectory:ts.sys.readDirectory};
const service=ts.createLanguageService(host);
for(const file of files){for(const change of service.organizeImports({type:'file',fileName:file},{},{})){let text=readFileSync(change.fileName,'utf8');for(const edit of [...change.textChanges].sort((a,b)=>b.span.start-a.span.start))text=text.slice(0,edit.span.start)+edit.newText+text.slice(edit.span.start+edit.span.length);writeFileSync(change.fileName,text)}}
