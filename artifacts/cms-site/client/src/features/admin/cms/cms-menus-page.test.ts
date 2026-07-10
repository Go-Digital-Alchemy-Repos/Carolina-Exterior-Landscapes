import { describe, expect, it } from "vitest";
import type { MenuItem } from "@shared/schema";
import { reorderMenuItems } from "./cms-menus-page";

function item(id: string): MenuItem {
  return {
    id,
    label: id.toUpperCase(),
    url: `/${id}`,
    openInNewTab: false,
    children: [],
  };
}

describe("menu item drag reordering", () => {
  it("moves the dragged item to the dropped item position", () => {
    const items = [item("home"), item("about"), item("gallery"), item("contact")];

    expect(reorderMenuItems(items, "contact", "about").map((entry) => entry.id)).toEqual([
      "home",
      "contact",
      "about",
      "gallery",
    ]);
    expect(items.map((entry) => entry.id)).toEqual(["home", "about", "gallery", "contact"]);
  });

  it("returns the same list for missing or unchanged drop targets", () => {
    const items = [item("home"), item("about")];

    expect(reorderMenuItems(items, "home", "home")).toBe(items);
    expect(reorderMenuItems(items, "missing", "about")).toBe(items);
    expect(reorderMenuItems(items, "home", "missing")).toBe(items);
  });
});
