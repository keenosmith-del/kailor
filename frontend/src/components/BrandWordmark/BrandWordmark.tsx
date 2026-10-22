import { Link } from "react-router";
import "./BrandWordmark.css";
export function BrandWordmark({
  withHead = false,
  className = "",
}: {
  withHead?: boolean;
  className?: string;
}) {
  return (
    <Link
      to="/"
      className={`brand-wordmark ${className}`}
      aria-label="kailor home"
    >
      {withHead && <img src="/mascot-head.png" width={28} height={28} alt="" />}
      <span className="brand-wordmark__text">kailor</span>
    </Link>
  );
}
