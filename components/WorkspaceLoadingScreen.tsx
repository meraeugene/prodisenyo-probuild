import Image from "next/image";
import styles from "./WorkspaceLoadingScreen.module.css";

export default function WorkspaceLoadingScreen() {
  return (
    <main data-workspace-loading="true" className={styles.screen}>
      <div role="status" aria-live="polite" aria-label="Loading Prodisenyo ProBuild" className={styles.content}>
        <div data-loading-logo="true" className={styles.logo}>
          <Image src="/prodisenyo-building-mark.png" alt="" width={1280} height={1280} sizes="168px" className={styles.image} priority />
        </div>
        <p className={styles.title}>Prodisenyo ProBuild</p>
        <div aria-hidden="true" className={styles.track}><div className={styles.progress} /></div>
        <span className="sr-only">Loading workspace</span>
      </div>
    </main>
  );
}
