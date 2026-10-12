// Part of AMR App Sections. See LICENSE file for full copyright and licensing details.
import { proxy } from "@odoo/owl";
import { _t } from "@web/core/l10n/translation";
import { user } from "@web/core/user";
import {
    buildView,
    reconcile,
    seedLayout,
} from "@amr_app_sections/core/sections_layout";

const SETTINGS_FIELD = "amr_app_sections_layout";
const MODEL = "res.users.settings";

/**
 * Holds the user's working copy of the layout and persists every change.
 *
 * Mutations apply optimistically, then save. A failed save restores the
 * last layout the server accepted and tells the user; a save refused as
 * stale (changed in another tab) adopts the server's layout instead. Saves
 * are serialized: while one is on the wire further changes coalesce into a
 * single follow-up save.
 */
export class SectionsStore {
    constructor({ orm, notification, getApps }) {
        this.orm = orm;
        this.notification = notification;
        this.getApps = getApps;
        const initial = user.settings?.[SETTINGS_FIELD] || null;
        this.state = proxy({ layout: initial });
        this._lastSaved = initial;
        this._saving = false;
        this._queued = false;
    }

    get layout() {
        return this.state.layout;
    }

    get view() {
        const { layout } = reconcile(this.state.layout, this.getApps());
        return buildView(layout, this.getApps());
    }

    /** Start organizing: seed the initial two sections and persist them. */
    enable(labels) {
        if (this.state.layout) {
            return;
        }
        this.state.layout = seedLayout(this.getApps(), labels);
        this._save();
    }

    /**
     * Apply a pure layout->layout function to the reconciled working copy
     * and persist the result.
     */
    mutate(fn) {
        if (!this.state.layout) {
            return;
        }
        const { layout } = reconcile(this.state.layout, this.getApps());
        this.state.layout = fn(layout);
        this._save();
    }

    async reset() {
        try {
            await this.orm.call(MODEL, "amr_app_sections_reset", [[user.settings.id]]);
        } catch {
            this.notification.add(
                _t("Your app layout could not be reset. Please try again."),
                { type: "danger" },
            );
            return;
        }
        this.state.layout = null;
        this._lastSaved = null;
        user.updateUserSettings(SETTINGS_FIELD, false);
    }

    async _save() {
        if (this._saving) {
            this._queued = true;
            return;
        }
        this._saving = true;
        try {
            const baseRev = this._lastSaved?.rev ?? 0;
            const result = await this.orm.call(MODEL, "amr_app_sections_save", [
                [user.settings.id],
                this.state.layout,
                baseRev,
            ]);
            if (result.conflict) {
                this.state.layout = result.layout || null;
                this._lastSaved = result.layout || null;
                this._queued = false;
                this.notification.add(
                    _t("Your app layout was changed in another tab, so the latest saved layout was loaded."),
                    { type: "warning" },
                );
            } else {
                this._lastSaved = result.layout;
                if (!this._queued) {
                    // Adopt the server document (it carries the new revision)
                    // only when no further change is waiting to be saved.
                    this.state.layout = result.layout;
                }
            }
            user.updateUserSettings(SETTINGS_FIELD, this._lastSaved);
        } catch (error) {
            this.state.layout = this._lastSaved;
            this._queued = false;
            const message = error?.data?.message;
            this.notification.add(
                message || _t("Your app layout could not be saved. Your previous layout was kept."),
                { type: "danger" },
            );
        } finally {
            this._saving = false;
            if (this._queued) {
                this._queued = false;
                this._save();
            }
        }
    }
}
