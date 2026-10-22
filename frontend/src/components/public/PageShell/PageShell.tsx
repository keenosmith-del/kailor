import type { ReactNode } from "react";
import { PageBack } from "../PageBack/PageBack";
import "./PageShell.css";
export function PageShell({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <section className="public-page-shell">
      <PageBack />
      <h1>{title}</h1>
      {children}
    </section>
  );
}
