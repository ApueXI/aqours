import assert from "node:assert/strict";
import { test } from "node:test";
import { generatedTimeText } from "../src/services/presentation/time.js";
import { notificationSafe } from "../src/services/presentation/notification-projection.js";
import { guidanceSafe } from "../src/services/presentation/projection.js";

test("generated appointment and restoration text uses Manila time while retaining immutable UTC records", () => {
  const original =
    "Missed callback. Appointment: 2026-10-19T10:08:00.000Z Next steps: call supplier.";
  const row = {
    id: "notice",
    created_at: "2026-10-19T09:00:00Z",
    read_at: null,
    data: {
      targetType: "assistance",
      targetId: "request",
      title: "Rescheduled",
      text: original,
      sourceEventKey: "event",
      privateNote: "PRIVATE",
    },
  };
  const notice = notificationSafe(row);
  assert.equal(
    notice.text,
    "Missed callback. Appointment: 19 Oct 2026, 18:08 (Asia/Manila) Next steps: call supplier.",
  );
  assert.equal(row.data.text, original);
  assert.equal(notice.createdAt, row.created_at);
  assert.equal("privateNote" in notice, false);
  const reason = "Published update. Restoration: 2026-10-19T16:30:00.000Z";
  const doc = {
    id: "guide",
    version: 1,
    cards: [{ action: "incident", reason }],
  };
  assert.equal(
    guidanceSafe(doc).cards[0].reason,
    "Published update. Restoration: 20 Oct 2026, 00:30 (Asia/Manila)",
  );
  assert.equal(doc.cards[0].reason, reason);
  assert.equal(
    generatedTimeText("Restoration: unknown", "Restoration"),
    "Restoration: unknown",
  );
  assert.equal(
    generatedTimeText("Appointment: 2026-99-99T99:00:00Z", "Appointment"),
    "Appointment: 2026-99-99T99:00:00Z",
  );
  assert.equal(
    generatedTimeText("Restoration: 2026-02-30T10:00:00Z", "Restoration"),
    "Restoration: 2026-02-30T10:00:00Z",
  );
  assert.equal(
    notificationSafe({ ...row, data: { ...row.data, targetType: "advisory" } })
      .text,
    original,
  );
});
