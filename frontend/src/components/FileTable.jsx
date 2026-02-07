export function FileTable({ items, onOpenFolder, onDelete, onRename, onDownload }) {
  return (
    <table className="file-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Type</th>
          <th>Size</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.key}>
            <td>{item.name}</td>
            <td>{item.type}</td>
            <td>{item.size || '-'}</td>
            <td>
              {item.type === 'folder' ? (
                <button onClick={() => onOpenFolder(item.key)}>Open</button>
              ) : (
                <button onClick={() => onDownload(item.key)}>Download</button>
              )}
              <button
                onClick={() => {
                  const nextName = window.prompt('Rename to', item.name);
                  if (nextName) {
                    const targetPrefix = item.key.split('/').slice(0, -1).join('/');
                    const targetKey = item.type === 'folder'
                      ? `${targetPrefix ? `${targetPrefix}/` : ''}${nextName}/`
                      : `${targetPrefix ? `${targetPrefix}/` : ''}${nextName}`;
                    onRename(item.key, targetKey);
                  }
                }}
              >
                Rename
              </button>
              <button onClick={() => onDelete(item.key)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
