import {
  contractCollectionSummary,
  sumMoney,
  vatBreakdown,
} from "@/features/gmea-projects/utils/gmeaCalculations";
import {
  expenseTotal,
  paidRevenue,
} from "@/features/gmea-rentals/utils/rentalAnalytics";
import type {
  GmeaOverviewActivity,
  GmeaOverviewAlert,
  GmeaOverviewData,
} from "../types";

export function formatOverviewMoney(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function projectRevenue(data: GmeaOverviewData) {
  return sumMoney(data.projects.map((project) => project.contract_amount));
}

function projectExpenses(data: GmeaOverviewData) {
  return sumMoney(
    data.projects.flatMap((project) =>
      project.expenses.map(
        (expense) =>
          vatBreakdown(expense.amount, expense.vat_mode, expense.vat_rate)
            .gross - expense.refunded_amount,
      ),
    ),
  );
}

function rentalRevenue(data: GmeaOverviewData) {
  return paidRevenue(data.rentals.payments);
}

function rentalExpenses(data: GmeaOverviewData) {
  return expenseTotal(data.rentals.expenses);
}

export function buildGmeaOverview(data: GmeaOverviewData) {
  const electronicsRevenue = projectRevenue(data);
  const electronicsExpenses = projectExpenses(data);
  const rentalsRevenue = rentalRevenue(data);
  const rentalsExpenses = rentalExpenses(data);
  const totalRevenue = sumMoney([electronicsRevenue, rentalsRevenue]);
  const totalExpenses = sumMoney([electronicsExpenses, rentalsExpenses]);
  const projectClients = data.projects.map((project) => project.client);
  const rentalClients = data.rentals.rentals.map((rental) => rental.client);
  const clients = new Set(
    [...projectClients, ...rentalClients]
      .map((client) => client.trim().toLocaleLowerCase())
      .filter(Boolean),
  );
  const activeProjects = data.projects.length;
  const activeRentals = data.rentals.rentals.filter(
    (rental) => rental.status === "active",
  ).length;
  const divisions = [
    {
      name: "Electronics & Solar" as const,
      count: activeProjects,
      countLabel: "Projects",
      revenue: electronicsRevenue,
      expenses: electronicsExpenses,
      profit: electronicsRevenue - electronicsExpenses,
      clients: new Set(
        projectClients
          .map((client) => client.trim().toLocaleLowerCase())
          .filter(Boolean),
      ).size,
      href: "/gmea-projects",
    },
    {
      name: "Rentals" as const,
      count: activeRentals,
      countLabel: "Active rentals",
      revenue: rentalsRevenue,
      expenses: rentalsExpenses,
      profit: rentalsRevenue - rentalsExpenses,
      clients: new Set(
        rentalClients
          .map((client) => client.trim().toLocaleLowerCase())
          .filter(Boolean),
      ).size,
      href: "/gmea-rentals",
    },
  ];
  return {
    activeProjects,
    activeRentals,
    activeWork: activeProjects + activeRentals,
    totalRevenue,
    totalExpenses,
    netProfit: totalRevenue - totalExpenses,
    activeClients: clients.size,
    divisions,
  };
}

export function selectGmeaOverviewActivity(data: GmeaOverviewData) {
  const projectActivity: GmeaOverviewActivity[] = data.projects.flatMap(
    (project) => [
      {
        id: "project:" + project.id,
        title: "Project added",
        detail: project.title,
        date: project.created_at,
        href: "/gmea-projects/" + project.id,
        division: "Electronics & Solar" as const,
        kind: "project" as const,
      },
      ...project.expenses.map((expense) => ({
        id: "project-expense:" + expense.id,
        title: "Project expense recorded",
        detail: expense.description || project.title,
        date: expense.date,
        href: "/gmea-projects/" + project.id,
        division: "Electronics & Solar" as const,
        kind: "expense" as const,
      })),
      ...project.payment_terms.flatMap((term) =>
        term.receipts.map((receipt) => ({
          id: "project-payment:" + receipt.id,
          title:
            receipt.status === "voided"
              ? "Project payment voided"
              : "Project payment received",
          detail: project.title,
          date: receipt.voided_at ?? receipt.recorded_at,
          href: "/gmea-projects/" + project.id,
          division: "Electronics & Solar" as const,
          kind: "payment" as const,
        })),
      ),
    ],
  );
  const rentalActivity: GmeaOverviewActivity[] = [
    ...data.rentals.rentals.map((rental) => ({
      id: "rental:" + rental.id,
      title: "Rental created",
      detail: rental.rental_number + " / " + rental.client,
      date: rental.created_at,
      href: "/gmea-rentals/" + rental.id,
      division: "Rentals" as const,
      kind: "rental" as const,
    })),
    ...data.rentals.payments.map((payment) => ({
      id: "rental-payment:" + payment.id,
      title:
        payment.status === "voided"
          ? "Rental payment voided"
          : "Rental payment received",
      detail: payment.reference_number || "Rental collection",
      date: payment.voided_at ?? payment.recorded_at,
      href: "/gmea-rentals/" + payment.rental_id,
      division: "Rentals" as const,
      kind: "payment" as const,
    })),
    ...data.rentals.expenses.map((expense) => ({
      id: "rental-expense:" + expense.id,
      title: "Rental expense recorded",
      detail: expense.description,
      date: expense.created_at,
      href: expense.rental_id
        ? "/gmea-rentals/" + expense.rental_id
        : "/gmea-rentals",
      division: "Rentals" as const,
      kind: "expense" as const,
    })),
  ];
  return [...projectActivity, ...rentalActivity]
    .filter((activity) => Number.isFinite(Date.parse(activity.date)))
    .sort((left, right) => Date.parse(right.date) - Date.parse(left.date));
}

export function selectGmeaOverviewAlerts(
  data: GmeaOverviewData,
  today: string,
) {
  const upcoming: GmeaOverviewAlert[] = data.rentals.rentals
    .filter(
      (rental) => rental.start_date >= today && rental.status !== "cancelled",
    )
    .sort((left, right) => left.start_date.localeCompare(right.start_date))
    .slice(0, 4)
    .map((rental) => ({
      id: "rental:" + rental.id,
      title: "Upcoming rental",
      detail: rental.rental_number + " starts " + rental.start_date,
      href: "/gmea-rentals/" + rental.id,
      tone: "sky" as const,
    }));
  const maintenance: GmeaOverviewAlert[] = data.rentals.equipment
    .filter((equipment) => equipment.status === "maintenance")
    .slice(0, 4)
    .map((equipment) => ({
      id: "maintenance:" + equipment.id,
      title: "Equipment in maintenance",
      detail: equipment.name,
      href: "/gmea-rentals",
      tone: "amber" as const,
    }));
  const collections: GmeaOverviewAlert[] = data.projects
    .map((project) => ({
      project,
      collection: contractCollectionSummary(project),
    }))
    .filter(({ collection }) => collection.outstanding > 0)
    .sort(
      (left, right) =>
        right.collection.outstanding - left.collection.outstanding,
    )
    .slice(0, 4)
    .map(({ project, collection }) => ({
      id: "collection:" + project.id,
      title: "Outstanding project collection",
      detail:
        project.title +
        " / PHP " +
        collection.outstanding.toLocaleString("en-PH"),
      href: "/gmea-projects/" + project.id,
      tone: "rose" as const,
    }));
  return [...upcoming, ...maintenance, ...collections];
}
