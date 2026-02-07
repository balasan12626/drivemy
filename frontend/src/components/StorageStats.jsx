export function StorageStats({ stats }) {
  return (
    <section className="card">
      <h3>Storage Analytics</h3>
      <p>Used: {stats.usedStorageGB} GB</p>
      <p>Remaining: {stats.remainingStorageGB} GB</p>
      <p>Capacity: {stats.maxCapacityGB} GB</p>
      <p>Total Bytes: {stats.totalBytes}</p>
      <p>Files: {stats.fileCount}</p>
    </section>
  );
}
