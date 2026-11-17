import { createFileRoute } from "@tanstack/react-router";
import { CategoryScreen } from "@/components/category-screen";

export const Route = createFileRoute("/gym")({
  head: () => ({ meta: [{ title: "Gym · CompareX" }] }),
  component: () => <CategoryScreen category="gym" />,
});
