// Part of AMR App Sections. See LICENSE file for full copyright and licensing details.
import { Component, t, useProps } from "@odoo/owl";
import { Dialog } from "@web/core/dialog/dialog";

export class AboutDialog extends Component {
    static template = "amr_app_sections.AboutDialog";
    static components = { Dialog };

    props = useProps({
        close: t.function(),
    });
}
