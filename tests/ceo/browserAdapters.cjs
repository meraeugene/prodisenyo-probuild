// Offline adapters keep this UI check independent of accounts and live Supabase data.
module.exports = {
  name: "ceo-offline-adapters",
  setup(build) {
    const mocks = {
      "next/link": "export default function Link({href,prefetch,children,...props}){return <a href={href} {...props}>{children}</a>}",
      "next/image": "export default function Image({priority,fill,...props}){return <img {...props}/>}",
      "next/navigation": "export const usePathname=()=>window.location.pathname; export const useRouter=()=>({push:()=>{},refresh:()=>{}});",
      "@/actions/gmeaProjects": "export async function getGmeaProjectsDataAction(){return window.__gmeaProjects;}",
      "@/features/navigation/hooks/useSidebarNotificationCounts": "export const useSidebarNotificationCounts=()=>({overtime:1,payrollReports:2,estimateReviews:0,gmeaExpenses:0,gmeaRentalExpenses:0});",
      "@/components/auth/SignOutButton": "export default function SignOutButton(){return <button type='button' className='px-3 py-2 text-sm text-slate-500'>Logout</button>}",
      "@/lib/supabase/storage": "export const getProfileAvatarPublicUrl=()=>null;",
      "@/actions/payroll": "export async function approveOvertimeRequestFormAction(id){window.__approvedRequest=id;return {approvedAt:'2026-10-07T08:00:00Z'}};export async function rejectOvertimeRequestFormAction(input){window.__returnedRequest=input;return {rejectedAt:'2026-10-07T08:00:00Z',rejectionReason:input.rejectionReason}};",
      "@/features/payroll/hooks/usePayrollApprovalQueue": "import {useState} from 'react';export function usePayrollApprovalQueue({initialRequests}){const [rows,setRows]=useState(initialRequests);return {pendingRequests:rows,pendingCount:rows.filter(r=>r.status==='pending').length,isPending:false,pendingActionId:null,pendingActionType:null,employeeLogsLoadingByRequestId:{},activeLogsModalState:null,openRequestLogs:()=>{},closeLogsModal:()=>{},handleAction:(id,type)=>setRows(current=>current.map(r=>r.id===id?{...r,status:type==='approve'?'approved':'rejected'}:r))}};",
    };
    build.onResolve({ filter: /^(next\/|@\/)/ }, (args) => args.path in mocks ? { path: args.path, namespace: "ceo-mocks" } : undefined);
    build.onLoad({ filter: /.*/, namespace: "ceo-mocks" }, (args) => ({ loader: "jsx", contents: mocks[args.path], resolveDir: process.cwd() }));
  },
};
