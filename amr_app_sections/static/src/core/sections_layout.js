// Part of AMR App Sections. See LICENSE file for full copyright and licensing details.

// Pure functions over the layout document:
// { schemaVersion, rev, defaultSectionId, sections: [{ id, name, collapsed, menuIds }] }
// Every function returns a new document and never mutates its input
// (jsonb values and Owl reactivity both want fresh objects).

export const SCHEMA_VERSION = 1;

export function newSectionId() {
    return "s-" + Math.random().toString(36).slice(2, 10);
}

/**
 * Initial layout when the user starts organizing: an empty personal section
 * on top and a catch-all section holding every app in its current order.
 */
export function seedLayout(apps, { myName, otherName }) {
    const otherId = newSectionId();
    return {
        schemaVersion: SCHEMA_VERSION,
        rev: 0,
        defaultSectionId: otherId,
        sections: [
            { id: newSectionId(), name: myName, collapsed: false, menuIds: [] },
            { id: otherId, name: otherName, collapsed: false, menuIds: apps.map((a) => a.id) },
        ],
    };
}

/**
 * Align the stored document with the apps the user can actually see:
 * menu ids without a matching available app are dropped (uninstalled apps,
 * lost permissions) and available apps assigned to no section are appended
 * to the default one (newly installed apps).
 *
 * @returns {{ layout: Object, changed: boolean }}
 */
export function reconcile(layout, apps) {
    const appIds = new Set(apps.map((a) => a.id));
    const assigned = new Set();
    let changed = false;
    const sections = layout.sections.map((section) => {
        const menuIds = section.menuIds.filter((menuId) => {
            if (!appIds.has(menuId) || assigned.has(menuId)) {
                changed = true;
                return false;
            }
            assigned.add(menuId);
            return true;
        });
        return menuIds.length === section.menuIds.length ? section : { ...section, menuIds };
    });
    const missingIds = apps.filter((a) => !assigned.has(a.id)).map((a) => a.id);
    if (missingIds.length) {
        changed = true;
        const index = sections.findIndex((s) => s.id === layout.defaultSectionId);
        sections[index] = {
            ...sections[index],
            menuIds: [...sections[index].menuIds, ...missingIds],
        };
    }
    return { layout: { ...layout, sections }, changed };
}

/**
 * Render model: sections with resolved app objects, whether each one is the
 * default section, and the flattened index of their first visible tile
 * (drives result_app_<n> ids and the keyboard focus arithmetic).
 */
export function buildView(layout, apps) {
    const appsById = new Map(apps.map((a) => [a.id, a]));
    let startIndex = 0;
    return layout.sections.map((section) => {
        const sectionApps = section.menuIds.map((id) => appsById.get(id)).filter(Boolean);
        const view = {
            id: section.id,
            name: section.name,
            collapsed: section.collapsed,
            isDefault: section.id === layout.defaultSectionId,
            apps: sectionApps,
            startIndex,
        };
        if (!section.collapsed) {
            startIndex += sectionApps.length;
        }
        return view;
    });
}

function updateSection(layout, sectionId, fn) {
    return {
        ...layout,
        sections: layout.sections.map((s) => (s.id === sectionId ? fn(s) : s)),
    };
}

export function toggleCollapsed(layout, sectionId) {
    return updateSection(layout, sectionId, (s) => ({ ...s, collapsed: !s.collapsed }));
}

export function renameSection(layout, sectionId, name) {
    return updateSection(layout, sectionId, (s) => ({ ...s, name }));
}

/**
 * New sections are inserted right before the default catch-all section so
 * that one always stays last.
 *
 * @returns {{ layout: Object, sectionId: string }}
 */
export function addSection(layout, name) {
    const sectionId = newSectionId();
    const section = { id: sectionId, name, collapsed: false, menuIds: [] };
    const index = layout.sections.findIndex((s) => s.id === layout.defaultSectionId);
    const sections = [...layout.sections];
    sections.splice(index, 0, section);
    return { layout: { ...layout, sections }, sectionId };
}

/**
 * The deleted section's apps join the end of the default section; deleting
 * the default section itself is not allowed.
 */
export function deleteSection(layout, sectionId) {
    if (sectionId === layout.defaultSectionId) {
        return layout;
    }
    const section = layout.sections.find((s) => s.id === sectionId);
    if (!section) {
        return layout;
    }
    const sections = layout.sections.filter((s) => s.id !== sectionId);
    const withApps = updateSection({ ...layout, sections }, layout.defaultSectionId, (s) => ({
        ...s,
        menuIds: [...s.menuIds, ...section.menuIds],
    }));
    return withApps;
}

/**
 * Move an app into a section, after a given app or at the start.
 *
 * @param {Object} layout
 * @param {number} menuId app to move
 * @param {string} targetSectionId
 * @param {number|null} afterMenuId app to insert after, null for first place
 */
export function moveApp(layout, menuId, targetSectionId, afterMenuId = null) {
    const sections = layout.sections.map((section) => {
        const menuIds = section.menuIds.filter((id) => id !== menuId);
        if (section.id === targetSectionId) {
            const index = afterMenuId === null ? 0 : menuIds.indexOf(afterMenuId) + 1;
            menuIds.splice(index, 0, menuId);
        }
        return { ...section, menuIds };
    });
    return { ...layout, sections };
}

/**
 * Move a whole section one step up or down.
 */
export function moveSectionBy(layout, sectionId, direction) {
    const index = layout.sections.findIndex((s) => s.id === sectionId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= layout.sections.length) {
        return layout;
    }
    const sections = [...layout.sections];
    const [section] = sections.splice(index, 1);
    sections.splice(target, 0, section);
    return { ...layout, sections };
}

/**
 * Reorder a section after another one (null puts it first).
 */
export function moveSectionAfter(layout, sectionId, afterSectionId) {
    if (sectionId === afterSectionId) {
        return layout;
    }
    const sections = layout.sections.filter((s) => s.id !== sectionId);
    const section = layout.sections.find((s) => s.id === sectionId);
    if (!section) {
        return layout;
    }
    const index = afterSectionId === null
        ? 0
        : sections.findIndex((s) => s.id === afterSectionId) + 1;
    sections.splice(index, 0, section);
    return { ...layout, sections };
}
