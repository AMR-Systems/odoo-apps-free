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
    'assets': {
        'web.assets_backend': [
            'amr_app_sections/static/src/**/*',
        ],
        'web.assets_unit_tests': [
            'amr_app_sections/static/tests/**/*.test.js',
        ],
        'web.assets_tests': [
            'amr_app_sections/static/tests/tours/**/*.js',
        ],
    },
    'installable': True,
    'application': False,
    'auto_install': False,
    'support': 'support@amrsystems.pl',
}
