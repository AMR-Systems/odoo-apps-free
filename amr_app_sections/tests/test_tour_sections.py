# Part of AMR App Sections. See LICENSE file for full copyright and licensing details.
import time

from odoo.tests import tagged
from odoo.tests.common import HttpCase


@tagged('post_install', '-at_install')
class TestSectionsTours(HttpCase):

    def _admin_layout(self):
        admin = self.env.ref('base.user_admin')
        settings = self.env['res.users.settings']._find_or_create_for_user(admin)
        return settings, settings.amr_app_sections_layout

    def test_t01_organize_then_restore(self):
        self.start_tour('/odoo', 'amr_app_sections.organize', login='admin')
        # The last saves of the tour run over RPC: give them a moment to land.
        layout = None
        for _ in range(40):
            self.env.cr.cache.clear()
            settings, layout = self._admin_layout()
            settings.invalidate_recordset()
            layout = settings.amr_app_sections_layout
            if layout and layout['sections'][0]['menuIds'] and layout['sections'][1]['collapsed']:
                break
            time.sleep(0.25)
        self.assertTrue(layout, "the tour should have saved a layout")
        self.assertEqual(len(layout['sections'][0]['menuIds']), 1,
                         "one app should have moved to the personal section")
        self.assertTrue(layout['sections'][1]['collapsed'],
                        "the catch-all section should be collapsed")
        # A fresh browser session restores the same layout from the server.
        self.start_tour('/odoo', 'amr_app_sections.persisted', login='admin')
