import { ArrowUpRight } from "lucide-react";
import { services } from "../../content";
import "./ServiceIndex.css";
export function ServiceIndex() {
  return (
    <div className="services-index" aria-label="Service index">
      {services.map((s) => (
        <a key={s.id} href={`#${s.id}`}>
          {s.title} {s.second}
          <ArrowUpRight size={15} />
        </a>
      ))}
    </div>
  );
}
