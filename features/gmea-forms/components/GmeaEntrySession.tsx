"use client";

import { createContext, useContext, useRef, useState, type ComponentType, type FormEvent } from "react";
import styles from "@/components/workspace/workspace.module.css";
import actionStyles from "./gmeaFormActions.module.css";
export const saveAndAddAgainClass = `${styles.button} ${actionStyles.saveAgain}`;

type EntrySession = {
  prepare: (event: FormEvent<HTMLFormElement>) => void;
  addingAgain: () => boolean;
  cancel: () => void;
};
const EntryContext = createContext<EntrySession | null>(null);
export const useGmeaEntrySession = () => useContext(EntryContext);

export function SaveAndAddAgainButton({ pending, form, enabled = true }: { pending: boolean; form?: string; enabled?: boolean }) {
  const session = useGmeaEntrySession();
  return session && enabled ? <button type="submit" name="saveIntent" value="add-again" form={form} disabled={pending} className={saveAndAddAgainClass}>Save and add again</button> : null;
}

/** Remount after a successful save so defaults, validation, and record IDs reset together. */
export function withGmeaEntrySession<P extends { onClose: () => void }>(Form: ComponentType<P>, clearOnRepeat: (keyof P)[] = []) {
  function RepeatableEntry(props: P) {
    const [generation, setGeneration] = useState(0);
    const again = useRef(false);
    const next = { ...props };
    if (generation) for (const key of clearOnRepeat) delete next[key];
    const session: EntrySession = {
      prepare: event => { again.current = ((event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null)?.value === "add-again"; },
      addingAgain: () => again.current,
      cancel: () => { again.current = false; props.onClose(); },
    };
    function complete() {
      if (again.current) { again.current = false; setGeneration(value => value + 1); }
      else props.onClose();
    }
    return <EntryContext.Provider value={session}><Form {...next} key={generation} onClose={complete} /></EntryContext.Provider>;
  }
  RepeatableEntry.displayName = `Repeatable${Form.displayName || Form.name || "GmeaEntry"}`;
  return RepeatableEntry;
}
