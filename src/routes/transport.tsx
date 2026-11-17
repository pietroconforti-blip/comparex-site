import { createFileRoute } from "@tanstack/react-router";
import { CategoryScreen } from "@/components/category-screen";

export const Route = createFileRoute("/transport")({
  head: () => ({ meta: [{ title: "Transport · CompareX" }] }),
  component: () => <CategoryScreen category="transport" />,
});
