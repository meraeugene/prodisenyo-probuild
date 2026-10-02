import PayrollWorkflowNavigation from "./PayrollWorkflowNavigation";

export default function PayrollDraftLoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div><PayrollWorkflowNavigation current={3} canReview={false} /><div role="alert" className="m-4 rounded-xl border border-rose-200 bg-rose-50 p-5 sm:m-6"><p className="text-sm text-rose-800">{message}</p><button type="button" onClick={onRetry} className="mt-4 rounded-lg bg-[#076d69] px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">Try again</button></div></div>;
}
