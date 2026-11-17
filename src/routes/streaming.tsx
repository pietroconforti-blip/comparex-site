import { createFileRoute } from "@tanstack/react-router";
import { CategoryScreen } from "@/components/category-screen";

export const Route = createFileRoute("/streaming")({
  head: () => ({ meta: [{ title: "Streaming · CompareX" }] }),
  component: () => <CategoryScreen category="streaming" />,
});
