"use client";

import { useEffect, useRef, useState } from "react";
import type { CostEstimatorItemModalProps } from "../types";

export type BoqItemPane = "details" | "costs" | "summary";

export function useBoqItemLayout(props: CostEstimatorItemModalProps) {
  const [pane, setPane] = useState<BoqItemPane>("details");
  const [requestedLineIndex, setActiveLineIndex] = useState(0);
  const [saveAttempt, setSaveAttempt] = useState(0);
  const previousSaveAttempt = useRef(0);
  const activeLineIndex = Math.min(requestedLineIndex, Math.max(0, props.form.materials.length - 1));

  useEffect(() => {
    if (props.open) {
      setPane("details");
      setActiveLineIndex(0);
    }
  }, [props.open]);

  useEffect(() => {
    if (previousSaveAttempt.current === saveAttempt) return;
    previousSaveAttempt.current = saveAttempt;
    const { section, itemNumber, displayName, materialRows } = props.errors;
    if (section || itemNumber || displayName) {
      setPane("details");
    } else {
      const invalidIndex = props.form.materials.findIndex(row =>
        Object.values(materialRows[row.id] ?? {}).some(Boolean),
      );
      if (invalidIndex >= 0) {
        setActiveLineIndex(invalidIndex);
        setPane("costs");
      }
    }
  }, [props.errors, props.form.materials, saveAttempt]);

  function addCostLine() {
    setActiveLineIndex(props.form.materials.length);
    setPane("costs");
    props.onAddMaterial();
  }

  function saveItem() {
    props.onSave();
    setSaveAttempt(attempt => attempt + 1);
  }

  return { pane, setPane, activeLineIndex, setActiveLineIndex, addCostLine, saveItem };
}
