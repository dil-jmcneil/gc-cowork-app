import { ATTENTION_ITEMS } from "./attentionItems";
import { attentionView, nextMonday, useAttentionStore } from "./attentionStore";

const [item] = ATTENTION_ITEMS;
const TUESDAY = new Date(2026, 10, 3, 9, 30); // Tue Nov 3, 2026

beforeEach(() => useAttentionStore.setState({ snoozedUntil: {}, backFromSnooze: {}, dismissed: {} }));

const view = (now = TUESDAY) => attentionView(ATTENTION_ITEMS, useAttentionStore.getState(), now);

test("snoozes resurface at 8 am next Monday, and a Monday snooze waits a full week", () => {
  expect(nextMonday(TUESDAY)).toEqual(new Date(2026, 10, 9, 8, 0));
  expect(nextMonday(new Date(2026, 10, 9, 9, 0))).toEqual(new Date(2026, 10, 16, 8, 0));
});

test("a snoozed item leaves the list until its date, then comes back marked", () => {
  useAttentionStore.getState().snooze(item.id, TUESDAY);
  expect(view().active).toHaveLength(0);
  expect(view().snoozed.map((s) => s.item.id)).toEqual([item.id]);

  const afterMonday = new Date(2026, 10, 9, 9, 0);
  expect(view(afterMonday).active).toEqual([{ item, backFromSnooze: true }]);
});

test("unsnoozing brings it back marked, and opening it clears the mark", () => {
  const store = useAttentionStore.getState();
  store.snooze(item.id, TUESDAY);
  store.unsnooze(item.id);
  expect(view().active).toEqual([{ item, backFromSnooze: true }]);
  useAttentionStore.getState().markSeen(item.id);
  expect(view().active).toEqual([{ item, backFromSnooze: false }]);
});

test("dismiss removes an item, even a snoozed one, and restore brings it back", () => {
  const store = useAttentionStore.getState();
  store.snooze(item.id, TUESDAY);
  store.dismiss(item.id);
  expect(view()).toEqual({ active: [], snoozed: [] });
  useAttentionStore.getState().restore(item.id);
  expect(view().active).toEqual([{ item, backFromSnooze: false }]);
});
