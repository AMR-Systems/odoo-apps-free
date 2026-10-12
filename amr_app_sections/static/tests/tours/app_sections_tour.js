// Part of AMR App Sections. See LICENSE file for full copyright and licensing details.
import { registry } from "@web/core/registry";

// First visit: start organizing, move an app into the personal section
// through its "Move to section" menu, collapse the catch-all section.
registry.category("web_tour.tours").add("amr_app_sections.organize", {
    steps: () => [
        {
            trigger: ".o_home_menu .o_apps .o_draggable",
        },
        {
            trigger: ".o_amr_add_button",
            run: "click",
        },
        {
            trigger: ".o_amr_sections .o_amr_section",
        },
        {
            // The move menu is revealed on hover (opacity), so the tour has
            // to accept it as "not visible".
            trigger: ".o_amr_section:nth-of-type(2) .o_draggable:first-child .o_amr_tile_menu:not(:visible)",
            run: "click",
        },
        {
            trigger: ".o-dropdown--menu .dropdown-item",
            run: "click",
        },
        {
            trigger: ".o_amr_section:nth-of-type(1) .o_draggable",
        },
        {
            trigger: ".o_amr_section:nth-of-type(2) .o_amr_section_toggle",
            run: "click",
        },
        {
            trigger: ".o_amr_section:nth-of-type(2) .o_amr_section_toggle[aria-expanded='false']",
        },
    ],
});

// Second visit (fresh browser): the layout saved on the server is restored,
// the collapsed section stays collapsed and apps still open.
registry.category("web_tour.tours").add("amr_app_sections.persisted", {
    steps: () => [
        {
            trigger: ".o_amr_sections",
        },
        {
            trigger: ".o_amr_section:nth-of-type(1) .o_draggable",
        },
        {
            trigger: ".o_amr_section:nth-of-type(2) .o_amr_section_toggle[aria-expanded='false']",
        },
        {
            trigger: ".o_amr_section:nth-of-type(1) .o_draggable a.o_app",
            run: "click",
        },
        {
            trigger: "body:not(:has(.o_home_menu))",
        },
    ],
});
