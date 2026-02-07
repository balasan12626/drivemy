export function Breadcrumbs({ path, onNavigate }) {
  const segments = path.split('/').filter(Boolean);

  return (
    <div className="breadcrumbs">
      <button onClick={() => onNavigate('')}>Root</button>
      {segments.map((segment, idx) => {
        const nextPath = `${segments.slice(0, idx + 1).join('/')}/`;
        return (
          <span key={nextPath}>
            {' / '}
            <button onClick={() => onNavigate(nextPath)}>{segment}</button>
          </span>
        );
      })}
    </div>
  );
}
