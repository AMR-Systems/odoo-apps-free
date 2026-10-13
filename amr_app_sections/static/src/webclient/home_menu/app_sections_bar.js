// Part of AMR App Sections. See LICENSE file for full copyright and licensing details.
import { Component, useEffect, useRef, useState } from "@odoo/owl";
import { ConfirmationDialog } from "@web/core/confirmation_dialog/confirmation_dialog";
import { Dropdown } from "@web/core/dropdown/dropdown";
import { DropdownItem } from "@web/core/dropdown/dropdown_item";
import { _t } from "@web/core/l10n/translation";
import { useService } from "@web/core/utils/hooks";
import { addSection } from "@amr_app_sections/core/sections_layout";
import { AboutDialog } from "./about_dialog";

export class AppSectionsBar extends Component {
    static template = "amr_app_sections.AppSectionsBar";
    static components = { Dropdown, DropdownItem };
    static props = {
        store: Object,
    };

    setup() {
        this.dialog = useService("dialog");
        this.state = useState({ adding: false, name: "" });
        this.inputRef = useRef("input");
        useEffect(
            () => {
                if (this.state.adding) {
                    this.inputRef.el?.focus();
                }
            },
            () => [this.state.adding],
        );
    }

    get active() {
        return Boolean(this.props.store.layout);
    }

    onAddClick() {
        if (!this.active) {
            // First use: seed "My apps" + the catch-all holding everything.
            this.props.store.enable({ myName: _t("My apps"), otherName: _t("Other") });
            return;
        }
        this.state.name = "";
        this.state.adding = true;
    }

    commitAdd() {
        if (!this.state.adding) {
            // Enter commits and removes the input, whose blur then fires:
            // only the first of the two may add the section.
            return;
        }
        const name = this.state.name.trim();
        this.state.adding = false;
        if (!name) {
            return;
        }
        this.props.store.mutate((layout) => addSection(layout, name).layout);
    }

    cancelAdd() {
        this.state.adding = false;
    }

    onInputKeydown(ev) {
        if (ev.key === "Enter") {
            this.commitAdd();
        } else if (ev.key === "Escape") {
            ev.stopPropagation();
            this.cancelAdd();
        }
    }

    onReset() {
        this.dialog.add(ConfirmationDialog, {
            title: _t("Restore default layout"),
            body: _t("Your sections will be removed and your apps will return to the standard layout."),
            confirmLabel: _t("Restore"),
            confirm: () => this.props.store.reset(),
            cancel: () => {},
        });
    }

    onAbout() {
        this.dialog.add(AboutDialog, {});
    }
}
