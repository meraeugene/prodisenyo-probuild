"use server";
import { getGmeaInputOptions } from "@/features/gmea-inputs/server/gmeaInputOptionsQueries";

export async function getGmeaInputOptionsAction() { return getGmeaInputOptions(); }
