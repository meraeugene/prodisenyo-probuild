const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');
function load(file, mocks = {}) {
  const source = fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8');
  const compiled = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const module = {exports:{}};
  new Function('require','module','exports',compiled)(name => mocks[name] ?? require(name), module, module.exports);
  return module.exports;
}
test('Escape closes the top dialog once, ignores composing input, and cleans up listeners', () => {
  const listeners = new Set(), cleanup = [], closed = [];
  const previous = global.document;
  global.document = {addEventListener:(_,fn)=>listeners.add(fn),removeEventListener:(_,fn)=>listeners.delete(fn)};
  try {
    const {useDialogEscape} = load('lib/useDialogEscape.ts',{react:{useEffect:fn=>cleanup.push(fn())}});
    useDialogEscape(()=>closed.push('adjustment'),70);
    useDialogEscape(()=>closed.push('employee'),50);
    function press(key,isComposing=false){let stopped=false;for(const fn of listeners){if(stopped)break;fn({key,isComposing,preventDefault(){},stopImmediatePropagation(){stopped=true}});}}
    press('Enter'); press('Escape',true); assert.deepEqual(closed,[]);
    press('Escape');assert.deepEqual(closed,['adjustment']);
    cleanup[0]();press('Escape');assert.deepEqual(closed,['adjustment','employee']);
    cleanup[1]();assert.equal(listeners.size,0);
    useDialogEscape(()=>closed.push('disabled'),90,false);press('Escape');assert.equal(closed.length,2);
  } finally {global.document=previous;}
});
test('numbered pagination selects exact pages and supports first and last',()=>{
  const {PayrollPageControls}=load('features/payroll/components/PayrollPageControls.tsx');
  const changed=[]; const element=PayrollPageControls({page:7,totalPages:12,onChange:p=>changed.push(p)});
  const flatten=nodes=>nodes.flatMap(n=>Array.isArray(n)?flatten(n):n?[n]:[]);
  const buttons=flatten(element.props.children).filter(n=>n.type==='button');
  const numbers=buttons.filter(n=>n.props['aria-label']?.startsWith('Page '));
  assert.deepEqual(numbers.map(n=>n.props.children),[5,6,7,8,9]);
  assert.equal(numbers.find(n=>n.props.children===7).props['aria-current'],'page');
  buttons[0].props.onClick();buttons.at(-1).props.onClick();numbers[0].props.onClick();assert.deepEqual(changed,[1,12,5]);
  const first=PayrollPageControls({page:1,totalPages:12,onChange:()=>{}});assert.equal(first.props.children[0].props.disabled,true);
  const last=PayrollPageControls({page:12,totalPages:12,onChange:()=>{}});assert.equal(last.props.children.at(-1).props.disabled,true);
});
