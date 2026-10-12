import { type ChangeEvent, type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { buildProgressSummary, sortProgressActivities } from '../utils/engineeringWorkspace';
import { parseEngineeringProgressWorkbook } from '../utils/engineeringProgressImport';
import { buildActivitySignature, buildDraftRows, buildClientId, parsePercent, validateForm } from '../utils/progressWorksheet';
import { emptyForm, type ActivityFormState, type ActivityFormErrors, type ConfirmState, type ProgressDraftActivity, type EngineeringProgressWorksheetProps } from '../worksheetTypes';

export function useEngineeringProgressWorksheet({ activities, readOnly = false, onSubmitProgress }: EngineeringProgressWorksheetProps) {
  const [draftActivities, setDraftActivities] = useState<ProgressDraftActivity[]>(() =>
    buildDraftRows(activities),
  );
  const [form, setForm] = useState<ActivityFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<ActivityFormErrors>({});
  const [importError, setImportError] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [importing, setImporting] = useState(false);
  const persistedSignatureRef = useRef(buildActivitySignature(activities));
  const [persistedSignature, setPersistedSignature] = useState(() =>
    buildActivitySignature(activities),
  );

  useEffect(() => {
    const nextSignature = buildActivitySignature(activities);

    if (nextSignature === persistedSignatureRef.current) return;
    persistedSignatureRef.current = nextSignature;
    setPersistedSignature(nextSignature);
    setDraftActivities(buildDraftRows(activities));
  }, [activities]);

  const sortedActivities = useMemo(
    () => sortProgressActivities(draftActivities),
    [draftActivities],
  );
  const summary = useMemo(
    () => buildProgressSummary(sortedActivities),
    [sortedActivities],
  );
  const submitLabel = editingId ? "Save activity" : "Add activity";
  const hasActivities = sortedActivities.length > 0;
  const draftSignature = useMemo(
    () => buildActivitySignature(sortedActivities),
    [sortedActivities],
  );
  const hasUnsavedChanges = draftSignature !== persistedSignature;
  const progressButtonLabel = hasUnsavedChanges
    ? "Update changes to CEO"
    : "Submit progress to CEO";

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormErrors({});
  };

  const handleSubmit = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    const input: ProgressDraftActivity = {
      id: editingId ?? buildClientId(),
      projectName: activities[0]?.projectName ?? "",
      activity: form.activity.trim(),
      weightPercent: parsePercent(form.weightPercent),
      progressPercent: parsePercent(form.progressPercent),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDraft: true,
    };

    setDraftActivities((current) =>
      editingId
        ? current.map((activity) => (activity.id === editingId ? input : activity))
        : [...current, input],
    );
    toast.success(editingId ? "Activity saved." : "Activity added.");
    resetForm();
  };

  const handleEdit = (activity: ProgressDraftActivity) => {
    if (readOnly) return;
    setEditingId(activity.id);
    setFormErrors({});
    setForm({
      activity: activity.activity,
      weightPercent: String(activity.weightPercent),
      progressPercent: String(activity.progressPercent),
    });
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setImporting(true);
    try {
      const importedActivities = await parseEngineeringProgressWorkbook(file);
      if (importedActivities.length === 0) {
        setImportError("No activity, % WT, and progress rows were found.");
        return;
      }

      const importedRows = importedActivities.map((activity) => ({
        id: buildClientId(),
        projectName: activities[0]?.projectName ?? "",
        activity: activity.activity,
        weightPercent: activity.weightPercent,
        progressPercent: activity.progressPercent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDraft: true,
      }));
      setDraftActivities((current) => [...current, ...importedRows]);
      setImportError(null);
      toast.success("Excel progress imported.");
    } catch (importError) {
      console.error(importError);
      setImportError("Unable to import this Excel file.");
    } finally {
      setImporting(false);
    }
  };

  function confirmDelete() {
    if (!confirmState) return;

    if (confirmState.type === "delete-one") {
      setDraftActivities((current) =>
        current.filter((activity) => activity.id !== confirmState.activity.id),
      );
      if (editingId === confirmState.activity.id) resetForm();
      toast.success("Activity deleted.");
    } else {
      setDraftActivities([]);
      resetForm();
      toast.success("All activities deleted.");
    }

    setConfirmState(null);
  }

  function submitToCeo() {
    if (!onSubmitProgress) return;
    onSubmitProgress(
      sortedActivities.map((activity) => ({
        activity: activity.activity,
        weightPercent: activity.weightPercent,
        progressPercent: activity.progressPercent,
      })),
    );
  }


  return { form, setForm, editingId, formErrors, setFormErrors, importError, confirmState, setConfirmState, importing, sortedActivities, summary, submitLabel, hasActivities, hasUnsavedChanges, progressButtonLabel, resetForm, handleSubmit, handleEdit, handleImportFile, confirmDelete, submitToCeo };
}
