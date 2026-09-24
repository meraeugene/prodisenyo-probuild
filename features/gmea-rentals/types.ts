export const EQUIPMENT_STATUSES = [
  "available",
  "reserved",
  "on_rental",
  "maintenance",
  "inactive",
] as const;

export const RATE_UNITS = ["hour", "day", "week", "month", "fixed"] as const;

export type EquipmentStatus = (typeof EQUIPMENT_STATUSES)[number];
export type RateUnit = (typeof RATE_UNITS)[number];

export type RentalEquipment = {
  id: string;
  code: string;
  name: string;
  equipment_type: string;
  plate_number: string;
  default_rate: number | null;
  rate_unit: RateUnit | null;
  notes: string;
  status: EquipmentStatus;
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
};

export type EquipmentInput = Omit<
  RentalEquipment,
  "id" | "version" | "created_at" | "updated_at"
>;

export type EquipmentMutation =
  | { kind: "create"; value: EquipmentInput }
  | { kind: "update"; value: EquipmentInput }
  | { kind: "deactivate" };

export const RENTAL_STATUSES = [
  "draft",
  "active",
  "completed",
  "cancelled",
] as const;
export type RentalStatus = (typeof RENTAL_STATUSES)[number];
export const RENTAL_WORKER_ROLES = ["Driver", "Operator", "Other"] as const;
export type RentalWorkerRole = (typeof RENTAL_WORKER_ROLES)[number];
export type RentalVatMode = "off" | "inclusive" | "exclusive";

export type RentalItem = {
  id: string;
  equipment_id: string;
  equipment_name: string;
  rate_type: RateUnit;
  unit_rate: number;
  quantity: number;
  subtotal: number;
};

export type RentalPayment = {
  id: string;
  rental_id: string;
  amount: number;
  payment_date: string;
  method: string;
  reference_number: string;
  notes: string;
  status: "posted" | "voided";
  recorded_by: string;
  recorded_at: string;
  voided_by: string | null;
  voided_at: string | null;
  void_reason: string;
};

export type RentalWorker = {
  id: string;
  name: string;
  role: RentalWorkerRole;
  phone: string;
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
};

export type RentalWorkerAssignment = {
  id: string;
  rental_id: string;
  worker_id: string;
  equipment_id: string | null;
  assigned_from: string;
  assigned_until: string | null;
  status: "assigned" | "completed" | "cancelled";
};

export type RentalExpenseCategory = {
  id: string;
  name: string;
  is_active: boolean;
  sort_order: number;
};

export type RentalExpense = {
  id: string;
  rental_id: string | null;
  equipment_id: string | null;
  category_id: string;
  date: string;
  description: string;
  supplier: string;
  method: string;
  invoice_number: string;
  amount: number;
  refunded_amount: number;
  vat_mode: RentalVatMode;
  vat_rate: number;
  notes: string;
  version: number;
  created_at: string;
  updated_at: string;
};

export type GmeaRental = {
  id: string;
  rental_number: string;
  client: string;
  location: string;
  start_date: string;
  end_date: string;
  notes: string;
  status: RentalStatus;
  version: number;
  created_at: string;
  updated_at: string;
  items: RentalItem[];
  payments: RentalPayment[];
  assignments: RentalWorkerAssignment[];
};

export type CreateRentalInput = Omit<
  GmeaRental,
  | "id"
  | "version"
  | "created_at"
  | "updated_at"
  | "items"
  | "payments"
  | "assignments"
> & {
  items: Array<
    Pick<
      RentalItem,
      "id" | "equipment_id" | "rate_type" | "unit_rate" | "quantity"
    >
  >;
};

export type RentalMutation = { kind: "create"; value: CreateRentalInput };

export type RentalCollectionMutation =
  | {
      kind: "record_payment";
      value: Pick<
        RentalPayment,
        | "id"
        | "amount"
        | "payment_date"
        | "method"
        | "reference_number"
        | "notes"
      >;
    }
  | { kind: "void_payment"; payment_id: string; reason: string };

export type RentalWorkerInput = Pick<
  RentalWorker,
  "name" | "role" | "phone" | "is_active"
>;
export type RentalWorkerMutation =
  | { kind: "create"; value: RentalWorkerInput }
  | { kind: "update"; value: RentalWorkerInput }
  | { kind: "deactivate" };

export type RentalAssignmentMutation =
  | {
      kind: "assign_worker";
      value: { id: string; worker_id: string; equipment_id: string | null };
    }
  | { kind: "remove_assignment"; assignment_id: string };

export type RentalExpenseMutation =
  | {
      kind: "create" | "update";
      value: Omit<RentalExpense, "created_at" | "updated_at">;
    }
  | { kind: "delete" };

export type RentalOperationsData = {
  workers: RentalWorker[];
  categories: RentalExpenseCategory[];
  expenses: RentalExpense[];
  equipment: RentalEquipment[];
};
