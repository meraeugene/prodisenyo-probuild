export function lockBodyScroll() {
  const body = document.body;
  const currentCount = Number(body.dataset.modalScrollLockCount ?? "0");

  if (currentCount === 0) {
    body.dataset.modalPrevOverflow = body.style.overflow;
    body.style.overflow = "hidden";
  }

  body.dataset.modalScrollLockCount = String(currentCount + 1);

  return () => {
    const latestCount = Number(body.dataset.modalScrollLockCount ?? "1");
    const nextCount = Math.max(latestCount - 1, 0);

    if (nextCount === 0) {
      body.style.overflow = body.dataset.modalPrevOverflow ?? "";
      delete body.dataset.modalPrevOverflow;
      delete body.dataset.modalScrollLockCount;
      return;
    }

    body.dataset.modalScrollLockCount = String(nextCount);
  };
}
