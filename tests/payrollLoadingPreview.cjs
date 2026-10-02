const path = require("node:path");
const os = require("node:os");
const fs = require("node:fs");
const { build } = require("esbuild");
const { chromium } = require("@playwright/test");
const postcss = require("postcss");
const tailwind = require("tailwindcss");

async function main() {
  const root = path.resolve(__dirname, "..");
  const output = path.join(os.tmpdir(), "probuild-payroll-loading-preview");
  fs.mkdirSync(output, { recursive: true });
  const entry = `import React from 'react';import {createRoot} from 'react-dom/client';import Skeleton from './features/payroll/components/generate-payroll/GeneratePayrollSkeleton';import {PayrollCalculationWorkspace} from './features/payroll/components/payroll-edit/PayrollCalculationWorkspace';const root=createRoot(document.getElementById('root'));root.render(React.createElement(Skeleton));window.showWorkspace=()=>{const noop=()=>{};const props={employeeName:'Adam Taer',roleName:'Employee',siteLabel:'MULTI BRANCH',periodLabel:'August 20 to August 26',logs:[],visibleLogs:[],page:1,totalPages:1,showAllLogs:false,paidHolidayDates:new Set(),attendanceDays:5,daysWorked:5,actualWorkedHours:43.83,regularWorkedHours:38.67,overtimeHours:0,baseWorkedPay:2416.67,overtimePay:0,grossPay:2416.67,adjustedTotalPay:2416.67,adjustmentTotal:0,hasBiometricOvertime:true,biometricOvertimeHours:0.17,biometricOvertimeStatus:null,confirmBiometricOvertimeStatus:null,cashAdvanceEntries:Array.from({length:9},(_,i)=>({id:String(i),amount:100,notes:'Entry '+i})),overtimeEntries:[],paidLeaveEntries:[],allowanceEntries:[],deductionEntries:[],branchRates:[{site:'Site A',hours:8,ratePerDay:500},{site:'Site B',hours:8,ratePerDay:500}],showBranchRates:false,isPayrollManager:true,isSaving:false,cutoffAttendanceDays:Array.from({length:14},(_,i)=>({date:'2026-08-'+String(20+i).padStart(2,'0'),classification:'WORKED',biometricWorkedSeconds:28800,approvedRegularSeconds:28800,payableSeconds:28800,approvedOvertimeSeconds:0})),onResolveAttendance:noop,onRemoveCashAdvance:noop,onRemoveOvertime:noop,onRemovePaidLeave:noop,onRemoveAllowance:noop,onOpenAdjustment:()=>window.lastAction='adjustment',onBiometricDecision:s=>window.lastAction=s,onClose:()=>window.lastAction='close',onSave:()=>window.lastAction='save'};root.render(React.createElement(PayrollCalculationWorkspace,props))};`;
  const bundle = await build({
    absWorkingDir: root,
    stdin: { contents: entry, resolveDir: root, loader: "tsx" },
    bundle: true,
    write: false,
    jsx: "automatic",
    tsconfig: path.join(root, "tsconfig.json"),
    plugins: [{
      name: "link-shim",
      setup(builder) {
        builder.onResolve({ filter: /^next\/link$/ }, () => ({ path: "link", namespace: "shim" }));
        builder.onLoad({ filter: /.*/, namespace: "shim" }, () => ({ contents: "import React from 'react';export default function Link(props){return React.createElement('a',props,props.children)}", loader: "js", resolveDir: root }));
      },
    }],
  });
  const css = (await postcss([tailwind({ content: [path.join(root, "features/payroll/components/generate-payroll/*.tsx"), path.join(root, "components/LoadingSkeleton.tsx"), path.join(root, "features/payroll/components/payroll-edit/*.tsx"), path.join(root, "features/payroll/components/PayrollPageControls.tsx")], theme: { extend: {} }, plugins: [] })]).process("@tailwind base;@tailwind components;@tailwind utilities;", { from: undefined })).css;
  const browser = await chromium.launch({ headless: true, channel: process.env.PAYROLL_TEST_BROWSER || "msedge" });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    await page.setContent(`<html><head><style>${css}</style></head><body><div id="root"></div></body></html>`);
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    await page.getByRole("status", { name: "Loading payroll draft" }).waitFor();
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 960 });
      const info = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth, paddingBottom: getComputedStyle(document.querySelector("nav")).paddingBottom, labels: [...document.querySelectorAll("nav li")].map((element) => element.textContent) }));
      if (info.overflow) throw new Error(`Horizontal overflow at ${width}px`);
      if (info.paddingBottom !== "20px") throw new Error("Missing bottom padding");
      if (info.labels.length !== 3) throw new Error("Missing workflow steps");
      console.log(`${width}px: workflow labels visible, bottom padding ${info.paddingBottom}, no horizontal overflow`);
      await page.screenshot({ path: path.join(output, `payroll-loading-${width}.png`), fullPage: true });
    }
    if (await page.getByRole('link', {name:'Back to all drafts'}).getAttribute('href') !== '/payroll-workspace') throw new Error('Missing drafts link');
    await page.evaluate(()=>window.showWorkspace());
    for (const width of [1440,390]) {
      await page.setViewportSize({width,height:900});
      for(const label of ['Cutoff Attendance','Biometric Logs','Biometric OT Decision','Adjustment Breakdown','Calculation Summary','Branch Rates']) {
        await page.getByRole('tab',{name:label,exact:true}).click();
        if (await page.getByRole('tab',{name:label,exact:true}).getAttribute('aria-selected') !== 'true') throw new Error('Tab did not activate');
        const overflowing=await page.getByRole('tabpanel').evaluate(e=>e.scrollHeight>e.clientHeight+1);
        if(overflowing) throw new Error('Vertical scrolling in '+label+' at '+width);
        if (label==='Adjustment Breakdown') { await page.getByRole('button',{name:'Next page'}).click();await page.getByText('Entry 2',{exact:true}).waitFor(); }
        if (label==='Biometric OT Decision') {await page.getByRole('button',{name:'Confirm',exact:true}).click();if(await page.evaluate(()=>window.lastAction)!=='approved') throw new Error('Lost biometric decision');}
      }
      await page.getByRole('tab',{name:'Cutoff Attendance',exact:true}).click();
      await page.screenshot({path:path.join(output,'payroll-tabs-'+width+'.png'),fullPage:true});
      console.log(width+'px: all six tabs fit without vertical scrolling; pagination and decisions work');
    }
    await page.getByRole('button',{name:'Save Changes'}).click();if(await page.evaluate(()=>window.lastAction)!=='save') throw new Error('Lost save callback');
    console.log(`Screenshots: ${output}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
