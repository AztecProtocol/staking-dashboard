import styles from "./ATPCardSkeleton.module.css";

export default function ATPCardSkeleton() {
  return (
    <div className={styles.skeletonCard}>
      <div className={styles.skeletonContent}></div>
    </div>
  );
}
