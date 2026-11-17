import { createFileRoute } from "@tanstack/react-router";
import { CategoryScreen } from "@/components/category-screen";

export const Route = createFileRoute("/mobile")({
  head: () => ({ meta: [{ title: "Mobile · CompareX" }] }),
  component: () => <CategoryScreen category="mobile" />,
});
