import {useMemo,useState,useTransition} from 'react';
import {toast} from 'sonner';
import {createMaterialRequestAction} from '@/actions/materialRequests';
import type {PlannedMaterialRow} from '../utils/plannedMaterials';
import type {CreateMaterialRequestInput,MaterialRequestRecord} from '../types';
import {EMPTY_FORM,type MaterialFormErrors} from '../utils/materialRequestForm';
export interface MaterialRequestPageProps {
  initialRequests: MaterialRequestRecord[];
  projects: Array<{ id: string; name: string }>;
  defaultProjectId?: string;
  plannedMaterial?: PlannedMaterialRow | null;
}
export function useMaterialRequestPage({initialRequests,projects,defaultProjectId,plannedMaterial}:MaterialRequestPageProps){
  const defaultProject = projects.find((project) => project.id === defaultProjectId);
  const [form, setForm] = useState<CreateMaterialRequestInput>({
    ...EMPTY_FORM,
    projectId: defaultProject?.id ?? "",
    projectName: defaultProject?.name ?? "",
    estimateItemId: plannedMaterial?.estimateItemId,
    materialName: plannedMaterial?.materialName ?? "",
    unit: plannedMaterial?.unit ?? "pcs",
    quantity: plannedMaterial?.remainingQuantity ?? 1,
  });
  const [requests, setRequests] =
    useState<MaterialRequestRecord[]>(initialRequests);
  const [formErrors, setFormErrors] = useState<MaterialFormErrors>({});
  const [isPending, startTransition] = useTransition();

  const totalPending = requests.length;

  const sortedRequests = useMemo(
    () =>
      [...requests].sort(
        (left, right) =>
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime(),
      ),
    [requests],
  );

  function updateField<K extends keyof CreateMaterialRequestInput>(
    key: K,
    value: CreateMaterialRequestInput[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    setFormErrors((current) => ({
      ...current,
      [key]: undefined,
    }));
  }

  function validateForm() {
    const errors: MaterialFormErrors = {};
    const projectName = (form.projectName ?? "").trim();
    const materialName = (form.materialName ?? "").trim();
    const unit = (form.unit ?? "").trim();
    const neededBy = (form.neededBy ?? "").trim();
    const quantity = Number(form.quantity ?? 0);
    const notes = (form.notes ?? "").trim();

    if (!form.projectId || !projectName) errors.projectId = "Project is required.";

    if (!materialName) {
      errors.materialName = "Material name is required.";
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      errors.quantity = "Quantity must be greater than zero.";
    }

    if (!unit) {
      errors.unit = "Unit is required.";
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(neededBy)) {
      errors.neededBy = "Needed-by date is required.";
    }

    if (!form.priority) {
      errors.priority = "Priority is required.";
    }

    if (notes.length > 500) {
      errors.notes = "Notes must be 500 characters or less.";
    }

    return {
      errors,
      hasErrors: Object.keys(errors).length > 0,
    };
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validation = validateForm();
    if (validation.hasErrors) {
      setFormErrors(validation.errors);
      return;
    }

    setFormErrors({});

    startTransition(async () => {
      try {
        const created = await createMaterialRequestAction(form);
        setRequests((current) => [created, ...current]);
        setForm({
          ...EMPTY_FORM,
          neededBy: form.neededBy,
          projectId: form.projectId,
          projectName: form.projectName,
          estimateItemId: form.estimateItemId,
          materialName: plannedMaterial?.materialName ?? "",
          unit: plannedMaterial?.unit ?? "pcs",
          quantity: plannedMaterial?.remainingQuantity ?? 1,
        });
        toast.success("Material request submitted.");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to submit request.",
        );
      }
    });
  }

return {form,formErrors,isPending,totalPending,sortedRequests,updateField,handleSubmit};
}
