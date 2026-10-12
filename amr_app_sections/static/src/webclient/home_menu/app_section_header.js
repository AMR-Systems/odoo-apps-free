// Part of AMR App Sections. See LICENSE file for full copyright and licensing details.
import { Component, proxy, signal, t, useEffect, useProps } from "@odoo/owl";
import { ConfirmationDialog } from "@web/core/confirmation_dialog/confirmation_dialog";
import { Dropdown } from "@web/core/dropdown/dropdown";
import { DropdownItem } from "@web/core/dropdown/dropdown_item";
import { _t } from "@web/core/l10n/translation";
import { useService } from "@web/core/utils/hooks";
import {
    deleteSection,
    moveSectionBy,
    renameSection,
    toggleCollapsed,
} from "@amr_app_sections/core/sections_layout";

export class AppSectionHeader extends Component {
    static template = "amr_app_sections.AppSectionHeader";
    static components = { Dropdown, DropdownItem };

    props = useProps({
        section: t.object(),
        store: t.object(),
        focused: t.boolean().optional(),
    });

    setup() {
        this.dialog = useService("dialog");
        this.state = proxy({ renaming: false, name: "" });
        this.inputRef = signal.ref();
        useEffect(
            () => {
                if (this.state.renaming) {
                    this.inputRef()?.focus();
                    this.inputRef()?.select();
                }
            },
            () => [this.state.renaming],
        );
    }

    onToggle() {
        this.props.store.mutate((layout) => toggleCollapsed(layout, this.props.section.id));
    }

    onRename() {
        this.state.name = this.props.section.name;
        this.state.renaming = true;
    }

    commitRename() {
        if (!this.state.renaming) {
            // Enter commits and removes the input, whose blur then fires:
            // only the first of the two may rename.
            return;
        }
        const name = this.state.name.trim();
        this.state.renaming = false;
        if (!name || name === this.props.section.name) {
            return;
        }
        this.props.store.mutate((layout) => renameSection(layout, this.props.section.id, name));
    }

    cancelRename() {
        this.state.renaming = false;
    }

    onInputKeydown(ev) {
        if (ev.key === "Enter") {
            this.commitRename();
        } else if (ev.key === "Escape") {
            ev.stopPropagation();
            this.cancelRename();
        }
    }

    onMoveUp() {
        this.props.store.mutate((layout) => moveSectionBy(layout, this.props.section.id, -1));
    }

    onMoveDown() {
        this.props.store.mutate((layout) => moveSectionBy(layout, this.props.section.id, 1));
    }

    onDelete() {
        const defaultSection = this.props.store.view.find((s) => s.isDefault);
        this.dialog.add(ConfirmationDialog, {
            title: _t("Delete section"),
            body: _t('Apps from this section will move to "%s".', defaultSection.name),
            confirmLabel: _t("Delete"),
            confirm: () =>
                this.props.store.mutate((layout) => deleteSection(layout, this.props.section.id)),
            cancel: () => {},
        });
    }
}
