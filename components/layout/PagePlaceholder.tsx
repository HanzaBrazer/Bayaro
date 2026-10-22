import * as React from "react";
import { Card, EmptyState } from "@/components/ui";

export function PagePlaceholder({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <EmptyState icon={icon} title={title} description={description} />
    </Card>
  );
}
