import { generatedTimeText } from "./time.js";
import { project } from "./projection.js";

export function notificationSafe(row: Record<string, any>) {
  const data = project(row.data, [
    "title",
    "text",
    "targetType",
    "targetId",
    "sourceEventKey",
  ]);
  return {
    ...data,
    text:
      data.targetType === "assistance"
        ? generatedTimeText(data.text, "Appointment")
        : data.text,
    id: row.id,
    createdAt: row.created_at,
    readAt: row.read_at,
  };
}
