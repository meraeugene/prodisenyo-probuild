import CostEstimatorItemModal from './CostEstimatorItemModal';
import type {useCostEstimatorPage} from '../hooks/useCostEstimatorPage';
export default function CostEstimatorDraftItemDialog({state,budgetCeiling}:{state:ReturnType<typeof useCostEstimatorPage>;budgetCeiling:number|null}){
  const editingItemTotal =
    state.editingItemIndices?.reduce(
      (sum, index) =>
        sum + (state.estimateForm.items[index]?.lineTotal ?? 0),
      0,
    ) ?? 0;
  const groupedItemCount = new Set(
    state.estimateForm.items.map(
      (item) =>
        item.section.trim().toLowerCase() +
        "::" +
        item.itemNumber.trim().toLowerCase(),
    ),
  ).size;
  const modalItemNumber =
    state.editingItemIndices && state.editingItemIndices.length > 0
      ? String(Math.min(...state.editingItemIndices) + 1)
      : String(groupedItemCount + 1);

return <CostEstimatorItemModal
        open={state.itemModalOpen}
        form={state.itemModalForm}
        errors={state.itemModalErrors}
        editingMaterialSnapshots={state.editingMaterialSnapshots}
        pendingMaterialRowId={state.pendingMaterialRowId}
        materials={state.materialOptions}
        computedTotal={state.currentLineTotal}
        baseEstimateTotal={state.currentEstimateTotal - editingItemTotal}
        budgetCeiling={budgetCeiling}
        itemNumberLabel={modalItemNumber}
        editing={Boolean(
          !state.itemModalReadOnly &&
          state.editingItemIndices &&
          state.editingItemIndices.length > 0,
        )}
        readOnly={state.itemModalReadOnly}
        pending={state.pendingEstimateAction}
        onClose={state.handleCloseAddCostModal}
        onSelectMaterial={state.handleSelectMaterial}
        onSelectUnitType={state.handleSelectMaterialUnit}
        onFieldChange={state.handleItemModalFieldChange}
        onMaterialRowFieldChange={state.handleMaterialRowFieldChange}
        onAddMaterial={state.handleAddModalMaterial}
        onSaveMaterial={state.handleSaveModalMaterial}
        onEditMaterial={state.handleEditModalMaterial}
        onCancelMaterial={state.handleCancelModalMaterial}
        onRemoveMaterial={state.handleRemoveModalMaterial}
        onSave={state.handleSaveItem}
        onDelete={() => {
          if (state.editingItemIndices && state.editingItemIndices.length > 0) {
            state.handleRemoveItem(state.editingItemIndices);
          }
          state.handleCloseAddCostModal();
        }}
      />;
}
