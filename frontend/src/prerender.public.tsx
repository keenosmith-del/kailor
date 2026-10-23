import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { PublicWebsite } from "./PublicWebsite";

export function render(path: string) {
  return renderToString(
    <MemoryRouter initialEntries={[path]}>
      <PublicWebsite />
    </MemoryRouter>,
  );
}
