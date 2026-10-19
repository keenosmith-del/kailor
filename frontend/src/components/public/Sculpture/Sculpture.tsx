import "./Sculpture.css";
export function Sculpture({ kind = 0 }: { kind?: number }) {
  return (
    <div className={`sculpture sculpture-${kind}`} aria-hidden="true">
      <div className="sculpture-core" />
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <div className="orbit orbit-three" />
      <span className="orbit-dot" />
    </div>
  );
}
