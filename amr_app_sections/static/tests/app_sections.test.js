// Part of AMR App Sections. See LICENSE file for full copyright and licensing details.
import { describe, expect, test } from "@odoo/hoot";
import {
    addSection,
    buildView,
    deleteSection,
    moveApp,
    moveSectionAfter,
    moveSectionBy,
    reconcile,
    renameSection,
    seedLayout,
    toggleCollapsed,
} from "@amr_app_sections/core/sections_layout";

const app = (id) => ({ id, xmlid: "app_" + id, label: "App " + id });

function layoutOf(sections, defaultSectionId) {
    return { schemaVersion: 1, rev: 0, defaultSectionId, sections };
}

function section(id, menuIds, extra = {}) {
    return { id, name: id, collapsed: false, menuIds, ...extra };
}

describe("seedLayout", () => {
    test("creates an empty personal section and a catch-all with every app", () => {
        const layout = seedLayout([app(1), app(2)], { myName: "Mine", otherName: "Other" });
        expect(layout.schemaVersion).toBe(1);
        expect(layout.sections).toHaveLength(2);
        expect(layout.sections[0].menuIds).toEqual([]);
        expect(layout.sections[1].menuIds).toEqual([1, 2]);
        expect(layout.defaultSectionId).toBe(layout.sections[1].id);
        expect(layout.sections[0].id).not.toBe(layout.sections[1].id);
    });
});

describe("reconcile", () => {
    test("appends unassigned apps to the default section", () => {
        const layout = layoutOf([section("a", [1]), section("b", [2])], "b");
        const result = reconcile(layout, [app(1), app(2), app(3)]);
        expect(result.changed).toBe(true);
        expect(result.layout.sections[1].menuIds).toEqual([2, 3]);
    });

    test("drops menu ids with no matching app", () => {
        const layout = layoutOf([section("a", [1, 99]), section("b", [2])], "b");
        const result = reconcile(layout, [app(1), app(2)]);
        expect(result.changed).toBe(true);
        expect(result.layout.sections[0].menuIds).toEqual([1]);
    });

    test("drops duplicated menu ids, keeping the first occurrence", () => {
        const layout = layoutOf([section("a", [1]), section("b", [1, 2])], "b");
        const result = reconcile(layout, [app(1), app(2)]);
        expect(result.layout.sections[0].menuIds).toEqual([1]);
        expect(result.layout.sections[1].menuIds).toEqual([2]);
    });

    test("reports no change for an aligned layout and keeps input intact", () => {
        const layout = layoutOf([section("a", [1]), section("b", [2])], "b");
        const result = reconcile(layout, [app(1), app(2)]);
        expect(result.changed).toBe(false);
        expect(layout.sections[0].menuIds).toEqual([1]);
    });
});

describe("buildView", () => {
    test("resolves apps, flags the default section and indexes visible tiles", () => {
        const layout = layoutOf(
            [section("a", [2, 1]), section("b", [3], { collapsed: true }), section("c", [4])],
            "c",
        );
        const apps = [app(1), app(2), app(3), app(4)];
        const view = buildView(layout, apps);
        expect(view[0].apps.map((a) => a.id)).toEqual([2, 1]);
        expect(view[0].startIndex).toBe(0);
        expect(view[1].apps).toHaveLength(1);
        expect(view[2].isDefault).toBe(true);
        // collapsed section b contributes no visible tiles
        expect(view[2].startIndex).toBe(2);
    });

    test("stays consistent with hundreds of apps", () => {
        const apps = Array.from({ length: 120 }, (_, i) => app(i + 1));
        const layout = seedLayout(apps, { myName: "Mine", otherName: "Other" });
        const view = buildView(layout, apps);
        expect(view[1].apps).toHaveLength(120);
    });
});

describe("mutations", () => {
    test("moveApp moves between sections at the requested position", () => {
        const layout = layoutOf([section("a", [1, 2]), section("b", [3])], "b");
        const moved = moveApp(layout, 1, "b", 3);
        expect(moved.sections[0].menuIds).toEqual([2]);
        expect(moved.sections[1].menuIds).toEqual([3, 1]);
        const movedFirst = moveApp(layout, 1, "b", null);
        expect(movedFirst.sections[1].menuIds).toEqual([1, 3]);
    });

    test("moveApp reorders within a section", () => {
        const layout = layoutOf([section("a", [1, 2, 3])], "a");
        const moved = moveApp(layout, 1, "a", 2);
        expect(moved.sections[0].menuIds).toEqual([2, 1, 3]);
    });

    test("addSection inserts before the default section", () => {
        const layout = layoutOf([section("a", []), section("b", [1])], "b");
        const { layout: withNew, sectionId } = addSection(layout, "New");
        expect(withNew.sections.map((s) => s.id)).toEqual(["a", sectionId, "b"]);
        expect(withNew.sections[1].name).toBe("New");
    });

    test("deleteSection moves its apps to the default section", () => {
        const layout = layoutOf([section("a", [1, 2]), section("b", [3])], "b");
        const result = deleteSection(layout, "a");
        expect(result.sections).toHaveLength(1);
        expect(result.sections[0].menuIds).toEqual([3, 1, 2]);
    });

    test("deleteSection refuses to delete the default section", () => {
        const layout = layoutOf([section("a", [1])], "a");
        expect(deleteSection(layout, "a")).toBe(layout);
    });

    test("renameSection and toggleCollapsed touch only their section", () => {
        const layout = layoutOf([section("a", []), section("b", [])], "b");
        const renamed = renameSection(layout, "a", "Named");
        expect(renamed.sections[0].name).toBe("Named");
        expect(renamed.sections[1].name).toBe("b");
        const toggled = toggleCollapsed(layout, "b");
        expect(toggled.sections[1].collapsed).toBe(true);
    });

    test("moveSectionBy clamps at the edges", () => {
        const layout = layoutOf([section("a", []), section("b", []), section("c", [])], "c");
        expect(moveSectionBy(layout, "a", -1)).toBe(layout);
        expect(moveSectionBy(layout, "a", 1).sections.map((s) => s.id)).toEqual(["b", "a", "c"]);
    });

    test("moveSectionAfter reorders and supports moving first", () => {
        const layout = layoutOf([section("a", []), section("b", []), section("c", [])], "c");
        expect(moveSectionAfter(layout, "c", null).sections.map((s) => s.id))
            .toEqual(["c", "a", "b"]);
        expect(moveSectionAfter(layout, "a", "b").sections.map((s) => s.id))
            .toEqual(["b", "a", "c"]);
    });
});
