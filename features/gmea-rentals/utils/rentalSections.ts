export const rentalSections = {
  income: { title: "Rentals", description: "Review rentals by location, payment totals, collections, and expenses." },
  expenses: { title: "Rental Expenses", description: "Review monthly spending, weekly reports, and expense history." },
  bookings: { title: "Rental Bookings", description: "Manage rental schedules, clients, and booking status." },
  equipment: { title: "Equipment", description: "Manage rental equipment, availability, and asset details." },
} as const;
export type RentalSection = keyof typeof rentalSections;
