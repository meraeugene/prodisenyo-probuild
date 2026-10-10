import { useMemo, useState } from "react";
import type { RentalIncomeRecord } from "../incomeTypes";
import { buildRentalIncomeCompanies, latestRentalIncomeMonth, rentalClientKey, selectRentalIncomeRentals,
  selectRentalIncomeTransactions, summarizeRentalIncome } from "../utils/rentalIncomeSelectors";

export function useRentalIncomePage(rentals: RentalIncomeRecord[]) {
  const [view, setView] = useState<"monthly" | "companies" | "transactions" | "review">("monthly");
  const [month, setMonth] = useState(() => latestRentalIncomeMonth(rentals,
    new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" }).slice(0, 7)));
  const [query, setQuery] = useState("");
  const [company, setCompany] = useState("");
  const companyOptions = useMemo(() => [...new Map(rentals.map(rental => [rentalClientKey(rental.client), rental.client.trim()])).entries()]
    .sort((left, right) => left[1].localeCompare(right[1])), [rentals]);
  const filteredRentals = useMemo(() => selectRentalIncomeRentals(rentals, query, company), [rentals, query, company]);
  const transactions = useMemo(() => selectRentalIncomeTransactions(filteredRentals, month), [filteredRentals, month]);
  const summary = useMemo(() => summarizeRentalIncome(transactions), [transactions]);
  const companies = useMemo(() => buildRentalIncomeCompanies(filteredRentals, month), [filteredRentals, month]);
  const outstanding = Math.round(companies.reduce((total, row) => total + row.outstanding, 0) * 100) / 100;
  const monthlyCompanies = companies.filter(row => transactions.some(transaction => rentalClientKey(transaction.rental.client) === row.key));
  const reviewRecords = filteredRentals.filter(row => row.historical?.issues.length).map(row => row.historical!);
  const unconfirmedBalances = companies.reduce((total,row)=>total+row.unconfirmedBalances,0);
  function openCompany(key: string) { setCompany(key); setQuery(""); setView("transactions"); }
  return { view, setView, month, setMonth, query, setQuery, company, setCompany, companyOptions,
    filteredRentals, transactions, summary, companies, monthlyCompanies, outstanding, reviewRecords, unconfirmedBalances, openCompany };
}

export type RentalIncomePageState = ReturnType<typeof useRentalIncomePage>;
