const fs = require("node:fs");
const path = require("node:path");
module.exports = {
  name: "workspace-offline-actions",
  setup(build) {
    build.onResolve({ filter: /^@\/features\/settings\/hooks\/useSettingsPage$/ }, args => ({ path: args.path, namespace: "workspace-settings" }));
    build.onLoad({ filter: /.*/, namespace: "workspace-settings" }, () => ({ loader: "js", resolveDir: process.cwd(), contents: `
      import {useState,useRef} from 'react';
      export function useSettingsPage(profile){
        const [fullName,setFullName]=useState(profile.full_name),[username,setUsername]=useState(profile.username),[email,setEmail]=useState(profile.email);
        const [newPassword,setNewPassword]=useState(''),[confirmPassword,setConfirmPassword]=useState('');
        const [showNewPassword,setShowNewPassword]=useState(false),[showConfirmPassword,setShowConfirmPassword]=useState(false),[showResetConfirm,setShowResetConfirm]=useState(false);
        return {profile,fileInputRef:useRef(null),fullName,setFullName,username,setUsername,email,setEmail,newPassword,setNewPassword,confirmPassword,setConfirmPassword,showNewPassword,setShowNewPassword,showConfirmPassword,setShowConfirmPassword,showResetConfirm,setShowResetConfirm,
          displayedAvatarUrl:null,loadingProfile:false,savingProfile:false,hasProfileChanges:false,changingPassword:false,
          handleAvatarFileChange:()=>{},handleRemoveAvatar:()=>{},handleSaveProfile:()=>{},handleChangePassword:()=>{},handleConfirmReset:()=>setShowResetConfirm(false)};
      }
    ` }));
    build.onResolve({ filter: /^@\/features\/dashboard\/hooks\/useHistoricalDashboardData$/ }, args => ({ path: args.path, namespace: "workspace-history" }));
    build.onLoad({ filter: /.*/, namespace: "workspace-history" }, () => ({ loader: "js", resolveDir: process.cwd(), contents: `
      import {useState} from 'react';
      export function useHistoricalDashboardData(){
        const [selectedPeriodKey,setSelectedPeriodKey]=useState('payroll-1');
        return {loading:false,error:null,selectedPeriodKey,setSelectedPeriodKey,data:{
          payrollRows:window.__payrollInsightRows || [],payrollAttendanceInputs:window.__payrollInsightAttendance || [],
          payrollDailyPaidPoints:[{date:'2026-09-01',total:5150},{date:'2026-09-02',total:5150}],
          periodOptions:(window.__payrollReports || []).map(run=>({key:run.id,label:run.period_label,siteName:run.site_name}))
        }};
      }
    ` }));
    build.onResolve({ filter: /^@\/actions\// }, (args) => ({ path: args.path, namespace: "workspace-actions" }));
    build.onLoad({ filter: /.*/, namespace: "workspace-actions" }, (args) => {
      const source = fs.readFileSync(path.join(process.cwd(), args.path.replace("@/", "") + ".ts"), "utf8");
      const reads = { getPayrollReportsDataAction: "{reports:window.__payrollReports || []}", getHistoricalRentalIncomeAction: "window.__historicalIncome || []", getGmeaProjectsDataAction: "window.__gmeaProjects", getGmeaProjectDataAction: "null", getGmeaRentalEquipmentAction: "window.__equipment", getGmeaRentalsAction: "window.__rentals", getGmeaRentalOperationsAction: "window.__rentalOperations", getPurchasingRecordsAction: "window.__purchases" };
      Object.assign(reads, { getEngineerEstimateNotificationsAction: "window.__engineerNotifications || {estimates:[]}", getProjectWorkspaceDataAction: "window.__engineerWorkspace" });
      reads.getGmeaOperationExpensesAction = "window.__operationExpenses || []";
      reads.getGmeaDashboardDataAction = "(window.__dashboardReads=(window.__dashboardReads||0)+1,{projects:window.__gmeaProjects,rentalIncome:[...window.__rentals,...window.__historicalIncome],rentalExpenses:window.__rentalOperations.expenses,operationExpenses:window.__operationExpenses})";
      reads.getGmeaInputOptionsAction = "{methods:[...new Set(['Cash','GCash','Cheque','Bank transfer','Online transfer',...(window.__savedInputOptions?.methods||[]),...(window.__operationExpenses||[]).map(row=>row.method)])],suppliers:[...new Set(['Drivers','Operators','Admin','GMEA Admin',...(window.__savedInputOptions?.suppliers||[]),...(window.__operationExpenses||[]).map(row=>row.payee)])],invoiceNames:['GMEA MARKETING CORP.','Prodisenyo Builders Corp.'],clients:(window.__historicalIncome||[]).map(row=>row.client),locations:(window.__historicalIncome||[]).map(row=>row.location),services:['Backhoe rental','Truck delivery']}";
      const approvalMocks = {
        approveOvertimeRequestFormAction: "window.__approvedRequest=args[0];return {approvedAt:'2026-10-07T08:00:00Z'}",
        approvePayrollReportAction: "window.__approvedPayroll=args[0];window.__payrollReports=window.__payrollReports.map(run=>run.id===args[0]?{...run,status:'approved'}:run);return {approvedAt:'2026-10-07T08:00:00Z'}",
        saveCustomerRentalIncomeAction: `const value=args[0];window.__savedIncomeInput=value;window.__savedInputOptions=window.__savedInputOptions||{methods:[],suppliers:[]};window.__savedInputOptions.methods.push(value.method);
          const prior=window.__historicalIncome.find(row=>row.id===value.id);
          const payments=['down_payment','full_payment'].filter(type=>value[type]>0).map(type=>({id:crypto.randomUUID(),rental_id:value.id,amount:value[type],payment_type:type,payment_date:value[type+'_date'],status:'posted',method:value.method,recorded_at:'2026-10-12T00:00:00Z'}));
          const row={id:value.id,client:value.client,location:value.location,rental_number:'Income '+value.id.slice(0,8),customerIncome:{version:(prior?.customerIncome?.version||0)+1},status:'active',start_date:'2026-05-01',items:[{subtotal:value.total_amount,equipment_name:value.service}],payments:[...(prior?.payments||[]),...payments]};
          window.__historicalIncome=[...window.__historicalIncome.filter(item=>item.id!==value.id),row];return value.id;`,
        createCustomerRentalExpenseAction: `const value=args[1].value;window.__savedRentalExpense={...value,income_record_id:args[0],created_at:'2026-10-12T00:00:00Z',updated_at:'2026-10-12T00:00:00Z'};window.__rentalOperations={...window.__rentalOperations,expenses:[...window.__rentalOperations.expenses,window.__savedRentalExpense]};return value.id;`,
        saveGmeaRentalExpenseAction: `const value=args[2].value;window.__savedInputOptions=window.__savedInputOptions||{methods:[],suppliers:[]};window.__savedInputOptions.methods.push(value.method);window.__savedInputOptions.suppliers.push(value.supplier);window.__savedRentalExpense={...value,created_at:'2026-10-12T00:00:00Z',updated_at:'2026-10-12T00:00:00Z'};window.__rentalOperations={...window.__rentalOperations,expenses:[...window.__rentalOperations.expenses.filter(row=>row.id!==value.id),window.__savedRentalExpense]};return value.id;`,
        saveGmeaOperationExpenseAction: `const value=args[1];window.__savedOperationExpense=value;const row={...value,version:(args[0]||0)+1,created_at:'2026-10-12T00:00:00Z',updated_at:'2026-10-12T00:00:00Z'};window.__operationExpenses=[...window.__operationExpenses.filter(item=>item.id!==value.id),row];return value.id;`,
      };
      approvalMocks.getGmeaInputOptionsAction = `window.__savedInputOptions=JSON.parse(sessionStorage.getItem('gmea-saved-input-options')||'{"methods":[],"suppliers":[]}');return ${reads.getGmeaInputOptionsAction};`;
      const contents = [...source.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g)].map((match) =>
        `export async function ${match[1]}(...args){${match[1].startsWith("get") ? "" : "window.__gmeaMutationCalls=(window.__gmeaMutationCalls||0)+1;"}${approvalMocks[match[1]] || (reads[match[1]] ? `return ${reads[match[1]]}` : 'throw new Error("Mutation disabled in offline UI check")')}}`,
      ).join("\n");
      const persistedChoices = `function rememberOfflineChoices(method,payee){const choices=JSON.parse(sessionStorage.getItem('gmea-saved-input-options')||'{"methods":[],"suppliers":[]}');if(method)choices.methods=[...new Set([...choices.methods,method])];if(payee)choices.suppliers=[...new Set([...choices.suppliers,payee])];sessionStorage.setItem('gmea-saved-input-options',JSON.stringify(choices));window.__savedInputOptions=choices;}`;
      return { loader: "js", contents: persistedChoices + contents
        .replaceAll("window.__savedOperationExpense=value;", "window.__savedOperationExpense=value;rememberOfflineChoices(value.method,value.payee);")
        .replaceAll("window.__savedIncomeInput=value;", "window.__savedIncomeInput=value;rememberOfflineChoices(value.method,'');")
        .replaceAll("window.__savedRentalExpense={...value,", "rememberOfflineChoices(value.method,value.supplier);window.__savedRentalExpense={...value,") };
    });
  },
};
