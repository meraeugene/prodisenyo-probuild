"use server";
import { revalidatePath } from "next/cache";
import type { Json } from "@/types/database";
import { gmeaRentalsWriter } from "@/features/gmea-rentals/server/gmeaRentalsDatabase";
import {
  getGmeaRentalEquipment,
  getGmeaRentalAnalytics,
  getGmeaRentalOperations,
  getGmeaRentals,
  requireGmeaRentalsAccess,
} from "@/features/gmea-rentals/server/gmeaRentalsQueries";
import {
  normalizeEquipmentMutation,
  validEquipmentId,
} from "@/features/gmea-rentals/utils/equipmentValidation";
import type {
  EquipmentMutation,
  RentalCollectionMutation,
  RentalAssignmentMutation,
  RentalExpenseMutation,
  RentalMutation,
  RentalWorkerMutation,
} from "@/features/gmea-rentals/types";
import { normalizeRentalMutation } from "@/features/gmea-rentals/utils/rentalValidation";
import { normalizeRentalCollectionMutation } from "@/features/gmea-rentals/utils/collectionValidation";
import {
  normalizeRentalAssignmentMutation,
  normalizeRentalExpenseMutation,
  normalizeRentalWorkerMutation,
} from "@/features/gmea-rentals/utils/operationsValidation";

export async function getGmeaRentalEquipmentAction() {
  return getGmeaRentalEquipment();
}
export async function getGmeaRentalsAction() {
  return getGmeaRentals();
}
export async function getGmeaRentalAction(id: string) {
  validEquipmentId(id);
  return (await getGmeaRentals(id))[0] ?? null;
}
export async function getGmeaRentalOperationsAction() {
  return getGmeaRentalOperations();
}
export async function getGmeaRentalAnalyticsAction() {
  return getGmeaRentalAnalytics();
}

export async function saveGmeaRentalEquipmentAction(
  id: string | null,
  version: number | null,
  input: EquipmentMutation,
) {
  const { user } = await requireGmeaRentalsAccess(true);
  const command = normalizeEquipmentMutation(input);
  if (id) {
    validEquipmentId(id);
    if (!Number.isInteger(version) || (version ?? 0) < 1)
      throw new Error("Reload this equipment before saving.");
  } else if (command.kind !== "create")
    throw new Error("Create equipment first.");
  const { data, error } = await gmeaRentalsWriter().rpc(
    "mutate_gmea_rental_equipment",
    {
      p_actor: user.id,
      p_equipment: id,
      p_version: version,
      p_command: command as unknown as Json,
    },
  );
  if (error) throw new Error(error.message);
  revalidatePath("/gmea-rentals");
  revalidatePath("/gmea-overview");
  revalidatePath("/gmea-rentals/dashboard");
  revalidatePath("/gmea-rentals/reports");
  return data as string;
}

export async function createGmeaRentalAction(input: RentalMutation) {
  const { user } = await requireGmeaRentalsAccess(true);
  const command = normalizeRentalMutation(input);
  const { data, error } = await gmeaRentalsWriter().rpc("mutate_gmea_rental", {
    p_actor: user.id,
    p_rental: null,
    p_version: null,
    p_command: command as unknown as Json,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/gmea-rentals");
  revalidatePath("/gmea-overview");
  revalidatePath("/gmea-rentals/dashboard");
  revalidatePath("/gmea-rentals/reports");
  revalidatePath("/gmea-rentals/" + data);
  return data;
}

export async function saveGmeaRentalCollectionAction(
  rentalId: string,
  version: number,
  input: RentalCollectionMutation,
) {
  const { user } = await requireGmeaRentalsAccess(true);
  validEquipmentId(rentalId);
  if (!Number.isInteger(version) || version < 1) {
    throw new Error("Reload this rental before saving.");
  }
  const command = normalizeRentalCollectionMutation(input);
  const { data, error } = await gmeaRentalsWriter().rpc(
    "mutate_gmea_rental_collection",
    {
      p_actor: user.id,
      p_rental: rentalId,
      p_version: version,
      p_command: command as unknown as Json,
    },
  );
  if (error) throw new Error(error.message);
  revalidatePath("/gmea-rentals");
  revalidatePath("/gmea-overview");
  revalidatePath("/gmea-rentals/dashboard");
  revalidatePath("/gmea-rentals/reports");
  revalidatePath("/gmea-rentals/" + rentalId);
  return data;
}

export async function saveGmeaRentalWorkerAction(
  workerId: string | null,
  version: number | null,
  input: RentalWorkerMutation,
) {
  const { user } = await requireGmeaRentalsAccess(true);
  const command = normalizeRentalWorkerMutation(input);
  if (workerId) {
    validEquipmentId(workerId);
    if (!Number.isInteger(version) || (version ?? 0) < 1) {
      throw new Error("Reload this worker before saving.");
    }
  } else if (command.kind !== "create") {
    throw new Error("Create a worker first.");
  }
  const { data, error } = await gmeaRentalsWriter().rpc(
    "mutate_gmea_rental_worker",
    {
      p_actor: user.id,
      p_worker: workerId,
      p_version: version,
      p_command: command as unknown as Json,
    },
  );
  if (error) throw new Error(error.message);
  revalidatePath("/gmea-rentals");
  revalidatePath("/gmea-overview");
  revalidatePath("/gmea-rentals/dashboard");
  revalidatePath("/gmea-rentals/reports");
  return data;
}

export async function saveGmeaRentalAssignmentAction(
  rentalId: string,
  version: number,
  input: RentalAssignmentMutation,
) {
  const { user } = await requireGmeaRentalsAccess(true);
  validEquipmentId(rentalId);
  if (!Number.isInteger(version) || version < 1) {
    throw new Error("Reload this rental before saving.");
  }
  const command = normalizeRentalAssignmentMutation(input);
  const { data, error } = await gmeaRentalsWriter().rpc(
    "mutate_gmea_rental_assignment",
    {
      p_actor: user.id,
      p_rental: rentalId,
      p_version: version,
      p_command: command as unknown as Json,
    },
  );
  if (error) throw new Error(error.message);
  revalidatePath("/gmea-rentals");
  revalidatePath("/gmea-overview");
  revalidatePath("/gmea-rentals/dashboard");
  revalidatePath("/gmea-rentals/reports");
  revalidatePath("/gmea-rentals/" + rentalId);
  return data;
}

export async function saveGmeaRentalExpenseAction(
  expenseId: string | null,
  version: number | null,
  input: RentalExpenseMutation,
) {
  const { user } = await requireGmeaRentalsAccess(true);
  const command = normalizeRentalExpenseMutation(input);
  if (expenseId) {
    validEquipmentId(expenseId);
    if (!Number.isInteger(version) || (version ?? 0) < 1) {
      throw new Error("Reload this expense before saving.");
    }
  } else if (command.kind !== "create") {
    throw new Error("Create an expense first.");
  }
  const { data, error } = await gmeaRentalsWriter().rpc(
    "mutate_gmea_rental_expense",
    {
      p_actor: user.id,
      p_expense: expenseId,
      p_version: version,
      p_command: command as unknown as Json,
    },
  );
  if (error) throw new Error(error.message);
  revalidatePath("/gmea-rentals");
  revalidatePath("/gmea-overview");
  revalidatePath("/gmea-rentals/dashboard");
  revalidatePath("/gmea-rentals/reports");
  return data;
}
