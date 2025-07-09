import { createFileRoute } from "@tanstack/react-router";
import Page from "../pages/about";

export const Route = createFileRoute("/about")({
  component: Page,
});
