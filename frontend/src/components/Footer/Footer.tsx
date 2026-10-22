import "./Footer.css";

export function Footer() {
  return (
    <footer className="kailor-footer">
      <span>
        © 2025
        {new Date().getFullYear() > 2025 ? `–${new Date().getFullYear()}` : ""}{" "}
        kailor
      </span>
    </footer>
  );
}
