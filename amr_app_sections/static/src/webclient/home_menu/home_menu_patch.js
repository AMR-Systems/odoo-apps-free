// Part of AMR App Sections. See LICENSE file for full copyright and licensing details.
import { patch } from "@web/core/utils/patch";
import { useService } from "@web/core/utils/hooks";
import { useSortable } from "@web/core/utils/sortable_owl";
import { HomeMenu } from "@web_enterprise/webclient/home_menu/home_menu";
import { Dropdown } from "@web/core/dropdown/dropdown";
import { DropdownItem } from "@web/core/dropdown/dropdown_item";
import {
    moveApp,
    moveSectionAfter,
    toggleCollapsed,
} from "@amr_app_sections/core/sections_layout";
import { AppSectionsBar } from "./app_sections_bar";
import { AppSectionHeader } from "./app_section_header";
import { SectionsStore } from "./sections_store";

// StudioHomeMenu extends HomeMenu without redefining static components, so
// this reaches it too; its template never renders them (amrActive is false
// there because Studio passes no reorderApps prop).
Object.assign(HomeMenu.components, { AppSectionsBar, AppSectionHeader, Dropdown, DropdownItem });

patch(HomeMenu.prototype, {
    setup() {
        // The stock useSortable receives `enable: this._enableAppsSorting`
        // and invokes it unbound, so patching the prototype method cannot
        // reach component state. Shadow it with a bound instance property
        // before super.setup() reads it, delegating to whatever the
        // prototype chain provides (web_studio turns sorting off there).
        const enableAppsSorting = this._enableAppsSorting;
        this._enableAppsSorting = () => !this.amrActive && enableAppsSorting.call(this);
        const orm = useService("orm");
        const notification = useService("notification");
        super.setup();
        this.amrSections = new SectionsStore({
            orm,
            notification,
            getApps: () => this.props.apps,
        });
        // Tiles: drag within and between sections (the stock sortable is
        // disabled whenever amrActive, so these never run together).
        useSortable({
            enable: () => this.amrActive,
            ref: this.rootRef,
            // The sortable prefixes the group selector itself: the effective
            // selector becomes ".o_amr_section_apps .o_draggable".
            elements: ".o_draggable",
            groups: ".o_amr_section_apps",
            connectGroups: true,
            cursor: "move",
            delay: 500,
            tolerance: 10,
            placeholderClasses: ["o_amr_drop_placeholder"],
            onWillStartDrag: (params) => this._sortStart(params),
            onGroupEnter: ({ group }) =>
                group.closest(".o_amr_section")?.classList.add("o_amr_drop_target"),
            onGroupLeave: ({ group }) =>
                group.closest(".o_amr_section")?.classList.remove("o_amr_drop_target"),
            onDragEnd: () => this._amrClearDropTargets(),
            onDrop: (params) => this._amrAppDrop(params),
        });
        // Whole sections: reorder by dragging their header.
        useSortable({
            enable: () => this.amrActive,
            ref: this.rootRef,
            elements: ".o_amr_section",
            handle: ".o_amr_section_header",
            cursor: "move",
            delay: 500,
            tolerance: 10,
            placeholderClasses: ["o_amr_drop_placeholder"],
            onDrop: (params) => this._amrSectionDrop(params),
        });
    },

    _amrClearDropTargets() {
        for (const el of this.rootRef()?.querySelectorAll(".o_amr_drop_target") || []) {
            el.classList.remove("o_amr_drop_target");
        }
    },

    _amrAppByXmlid(element) {
        const xmlid = element?.children[0]?.dataset.menuXmlid;
        return this.props.apps.find((app) => app.xmlid === xmlid);
    },

    /**
     * @param {Object} params
     * @param {HTMLElement} params.element dragged tile
     * @param {HTMLElement} params.previous tile before the drop position
     * @param {HTMLElement} params.parent group the placeholder landed in
     *      (params.group would be the group the drag STARTED in)
     */
    _amrAppDrop({ element, previous, parent }) {
        this._amrClearDropTargets();
        const sectionId = parent?.dataset.sectionId;
        const app = this._amrAppByXmlid(element);
        if (!sectionId || !app) {
            return;
        }
        const previousApp = previous ? this._amrAppByXmlid(previous) : null;
        if (previousApp && previousApp.id === app.id) {
            return;
        }
        this.amrSections.mutate((layout) =>
            moveApp(layout, app.id, sectionId, previousApp ? previousApp.id : null));
    },

    /**
     * @param {Object} params
     * @param {HTMLElement} params.element dragged section
     * @param {HTMLElement} params.previous section before the drop position
     */
    _amrSectionDrop({ element, previous }) {
        const sectionId = element.dataset.sectionId;
        const afterSectionId = previous ? previous.dataset.sectionId : null;
        if (!sectionId || sectionId === afterSectionId) {
            return;
        }
        this.amrSections.mutate((layout) => moveSectionAfter(layout, sectionId, afterSectionId));
    },

    /**
     * Whether the sectioned home menu is rendered. StudioHomeMenu never
     * passes reorderApps: our sections must never render inside Studio.
     *
     * @returns {boolean}
     */
    get amrActive() {
        return Boolean(this.props.reorderApps) && this.amrSections.layout !== null;
    },

    /**
     * Whether the bar (with its "Add section" entry point) is shown even
     * though no layout exists yet.
     *
     * @returns {boolean}
     */
    get amrShowBar() {
        return Boolean(this.props.reorderApps);
    },

    /**
     * Sections with resolved apps, re-indexed over the mixed focus list
     * (headers included): headerIndex for the header entry, startIndex for
     * the first visible tile. Drives result_app_<n> ids, o_focused and the
     * keyboard arithmetic.
     *
     * @returns {Object[]}
     */
    get amrSectionsView() {
        const view = this.amrSections.view;
        let index = 0;
        for (const section of view) {
            section.headerIndex = index++;
            if (!section.collapsed) {
                section.startIndex = index;
                index += section.apps.length;
            } else {
                section.startIndex = null;
            }
        }
        return view;
    },

    /**
     * @override the keyboard focus list. When sections are active it mixes
     * section headers (entries with amrSection) with the visible apps, in
     * on-screen order, so Tab/arrows/Enter operate on what the user sees.
     */
    get displayedApps() {
        if (!this.amrActive) {
            return super.displayedApps;
        }
        const entries = [];
        for (const section of this.amrSections.view) {
            entries.push({ amrSection: section.id, id: "amr-header-" + section.id });
            if (!section.collapsed) {
                entries.push(...section.apps);
            }
        }
        return entries;
    },

    /**
     * @override Enter on a focused section header toggles it instead of
     * opening an app.
     */
    _openMenu(menu) {
        if (menu && menu.amrSection) {
            const sectionId = menu.amrSection;
            this.amrSections.mutate((layout) => toggleCollapsed(layout, sectionId));
            return;
        }
        return super._openMenu(...arguments);
    },

    /**
     * @override keyboard navigation over the mixed focus list: each header
     * is a full-width row, each expanded section's apps form rows of
     * maxIconNumber tiles.
     */
    _updateFocusedIndex(mode) {
        if (!this.amrActive) {
            return super._updateFocusedIndex(...arguments);
        }
        const total = this.displayedApps.length;
        if (!total) {
            return;
        }
        // Rows of focus-list indexes, in on-screen order.
        const rows = [];
        for (const section of this.amrSectionsView) {
            rows.push([section.headerIndex]);
            if (!section.collapsed) {
                for (let i = 0; i < section.apps.length; i += this.maxIconNumber) {
                    const count = Math.min(this.maxIconNumber, section.apps.length - i);
                    rows.push(Array.from({ length: count }, (_, j) => section.startIndex + i + j));
                }
            }
        }
        const current = this.state.focusedIndex;
        if (current === null || current >= total) {
            this.state.focusedIndex = mode === "previousElem" || mode === "previousLine" ? total - 1 : 0;
            return;
        }
        const rowIndex = rows.findIndex((row) => row.includes(current));
        const colIndex = rows[rowIndex].indexOf(current);
        let next = current;
        switch (mode) {
            case "nextElem":
            case "nextColumn":
                next = (current + 1) % total;
                break;
            case "previousElem":
            case "previousColumn":
                next = (current - 1 + total) % total;
                break;
            case "nextLine": {
                const row = rows[(rowIndex + 1) % rows.length];
                next = row[Math.min(colIndex, row.length - 1)];
                break;
            }
            case "previousLine": {
                const row = rows[(rowIndex - 1 + rows.length) % rows.length];
                next = row[Math.min(colIndex, row.length - 1)];
                break;
            }
        }
        this.state.focusedIndex = next;
    },

    /**
     * "Move to section" menu on a tile: the app joins the end of the chosen
     * section.
     */
    amrMoveAppToSection(app, sectionId) {
        this.amrSections.mutate((layout) => {
            const section = layout.sections.find((s) => s.id === sectionId);
            if (!section || section.menuIds.includes(app.id)) {
                return layout;
            }
            const last = section.menuIds[section.menuIds.length - 1] ?? null;
            return moveApp(layout, app.id, sectionId, last);
        });
    },
});
