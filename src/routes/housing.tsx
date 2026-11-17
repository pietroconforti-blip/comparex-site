import { createFileRoute } from "@tanstack/react-router";
import { CategoryScreen } from "@/components/category-screen";

export const Route = createFileRoute("/housing")({
  head: () => ({ meta: [{ title: "Housing · CompareX" }] }),
  component: () => <CategoryScreen category="housing" />,
});
