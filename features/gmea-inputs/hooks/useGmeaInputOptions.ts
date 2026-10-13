"use client";
import useSWR from "swr";
import { getGmeaInputOptionsAction } from "@/actions/gmeaInputOptions";
import { defaultGmeaInputOptions } from "../utils/gmeaInputOptions";

export function useGmeaInputOptions(enabled = true) {
  const { data = defaultGmeaInputOptions, error } = useSWR(enabled ? "gmea-input-options" : null, getGmeaInputOptionsAction,
    { fallbackData: defaultGmeaInputOptions, revalidateOnFocus: true, revalidateOnReconnect: true });
  return { options: data, error };
}
