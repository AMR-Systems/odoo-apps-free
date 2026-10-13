# Part of AMR App Sections. See LICENSE file for full copyright and licensing details.
{
    'name': 'AMR App Sections',
    'summary': 'Organize Odoo apps into collapsible sections',
    'description': """
AMR App Sections
================
Organize application tiles on the home menu into custom, collapsible
sections. Drag and drop apps, rearrange sections, and keep rarely used
applications out of sight without changing permissions. Each user has
their own saved layout.
""",
    'author': 'AMR Systems',
    'website': 'https://amrsystems.pl',
    'category': 'Productivity',
    'version': '18.0.1.0.0',
    'license': 'LGPL-3',
    # First entry = the store cover image
    'images': ['static/description/cover.png'],
    'depends': ['web_enterprise'],
    'data': [],
    # No glob wildcards here: base_import_module (zip install / Odoo.sh)
    # rejects manifests whose asset paths contain * or **.
    'assets': {
        'web.assets_backend': [
            'amr_app_sections/static/src/core/sections_layout.js',
            'amr_app_sections/static/src/webclient/home_menu/about_dialog.js',
            'amr_app_sections/static/src/webclient/home_menu/about_dialog.xml',
            'amr_app_sections/static/src/webclient/home_menu/app_section_header.js',
            'amr_app_sections/static/src/webclient/home_menu/app_section_header.xml',
            'amr_app_sections/static/src/webclient/home_menu/app_sections.scss',
            'amr_app_sections/static/src/webclient/home_menu/app_sections_bar.js',
            'amr_app_sections/static/src/webclient/home_menu/app_sections_bar.xml',
            'amr_app_sections/static/src/webclient/home_menu/app_tile.xml',
            'amr_app_sections/static/src/webclient/home_menu/home_menu_patch.js',
            'amr_app_sections/static/src/webclient/home_menu/home_menu_patch.xml',
            'amr_app_sections/static/src/webclient/home_menu/sections_store.js',
        ],
        'web.assets_unit_tests': [
            'amr_app_sections/static/tests/app_sections.test.js',
        ],
        'web.assets_tests': [
            'amr_app_sections/static/tests/tours/app_sections_tour.js',
        ],
    },
    'installable': True,
    'application': False,
    'auto_install': False,
    'support': 'support@amrsystems.pl',
}
