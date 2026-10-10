const crypto = require('node:crypto');
const cents = value => Math.round(Number(value)*100);
const normalize = value => String(value).toUpperCase().replace(/\bTRUCK\b/g,'').replace(/[^A-Z0-9]/g,'');
const uuid = name => { const hex=crypto.createHash('sha256').update(name).digest('hex'); return `${hex.slice(0,8)}-${hex.slice(8,12)}-5${hex.slice(13,16)}-8${hex.slice(17,20)}-${hex.slice(20,32)}`; };

function buildRentalWeeklyImportPlans(report, state, runtime) {
  const expenses=state.gmea_rental_expenses, used=new Set(), plans=[], assigned=[];
  for (const row of report.weeks.flatMap(week=>week.rows)) {
    const source=`${row.week.source.sheet}!${row.week.source.cell}`;
    const equipment=row.week.section==='equipment' ? state.gmea_rental_equipment.filter(item=>normalize(item.name)===normalize(row.party)) : [];
    if(row.week.section==='equipment'&&equipment.length!==1) throw new Error(`Unresolved equipment: ${source} ${row.party}`);
    const categoryName=row.week.section==='cash-advance'?'Cash Advance':row.week.section==='salary'?/DRIVER/i.test(row.party)?'Driver':/OPERATOR/i.test(row.party)?'Operator':'Labor':/DIESEL/i.test(row.description)?'Diesel/Fuel':/RENEW/i.test(row.description)?'Registration/Renewal':/MAINTENANCE/i.test(row.description)?'Maintenance':'Miscellaneous';
    const category=state.gmea_rental_expense_categories.find(item=>item.name===categoryName&&item.is_active);
    if(!category) throw new Error(`Unresolved category: ${categoryName}`);
    const canonical=expenses.filter(item=> {const meta=runtime.rentalWeekMetadata(item.notes);return meta?.source?.sheet===row.week.source.sheet&&meta.source.cell===row.week.source.cell;});
    if(canonical.length>1) throw new Error(`Duplicate weekly source: ${source}`);
    let existing=canonical[0];
    if(!existing) {
      const bySource=expenses.filter(item=>!used.has(item.id)&&item.notes.includes(`source: ${source}:weekly-`));
      if(bySource.length>1) throw new Error(`Duplicate original source: ${source}`);
      existing=bySource[0];
    }
    if(!existing&&equipment[0]) {
      const sameEvent=expenses.filter(item=>!used.has(item.id)&&!runtime.rentalWeekMetadata(item.notes)&&item.notes.startsWith('Historical import;')&&item.rental_id===null&&item.equipment_id===equipment[0].id&&item.expense_date===row.date);
      const exact=sameEvent.filter(item=>cents(item.amount)===cents(row.amount)).sort((a,b)=>a.notes.localeCompare(b.notes));
      existing=exact[0] || (sameEvent.length===1?sameEvent[0]:undefined);
    }
    if(existing&&used.has(existing.id)) throw new Error(`Weekly row reused: ${source}`);
    const id=existing?.id || uuid(`rental-week:${report.source.sha256}:${source}`);
    used.add(id);
    const previous=existing?.notes || `Weekly workbook import; source: ${source}:weekly-${row.week.section}; source-fingerprint:${crypto.createHash('sha256').update(JSON.stringify(row)).digest('hex')}`;
    const value={id,rental_id:null,equipment_id:equipment[0]?.id??null,category_id:category.id,date:row.date,description:row.week.section==='equipment'?row.description:`${row.description} - ${row.party}`,supplier:row.week.section==='equipment'?'':row.party,method:existing?.method||'',invoice_number:existing?.invoice_number||'',amount:row.amount,refunded_amount:0,vat_mode:'off',vat_rate:0,notes:runtime.encodeRentalWeekNotes(previous,row.week),version:existing?.version||1};
    // A rerun must not overwrite subsequent manual changes to a reconciled source row.
    if(canonical[0]&&(canonical[0].expense_date!==row.date||cents(canonical[0].amount)!==cents(row.amount)||canonical[0].equipment_id!==value.equipment_id)) throw new Error(`Reviewed weekly expense was changed: ${source}`);
    const keys=['rental_id','equipment_id','category_id','description','supplier','method','invoice_number','vat_mode','notes'];
    const unchanged=existing&&keys.every(key=>existing[key]===value[key])&&existing.expense_date===value.date&&cents(existing.amount)===cents(value.amount)&&Number(existing.refunded_amount)===0&&Number(existing.vat_rate)===0;
    assigned.push({id,row});
    if(!unchanged) plans.push({id,source,version:existing?.version??null,command:{kind:existing?'update':'create',value},priceChanged:!!existing&&cents(existing.amount)!==cents(row.amount),previousAmount:existing?Number(existing.amount):null});
  }
  return {plans,assigned};
}
module.exports={buildRentalWeeklyImportPlans};
