# Part of AMR App Sections. See LICENSE file for full copyright and licensing details.
from odoo.tests import tagged

from .common import AppSectionsCommon


@tagged('post_install', '-at_install')
class TestConflictDetection(AppSectionsCommon):

    def test_t01_server_owns_the_revision(self):
        layout = self._layout(rev=55)  # client-sent rev is ignored
        result = self.settings_a.with_user(self.user_a).amr_app_sections_save(
            layout, 0)
        self.assertEqual(result['layout']['rev'], 1)

    def test_t02_stale_save_is_refused_and_keeps_the_stored_layout(self):
        # Tab 1 saves.
        self.settings_a.with_user(self.user_a).amr_app_sections_save(
            self._layout(), 0)
        stored = self.settings_a.amr_app_sections_layout
        # Tab 2, still on rev 0, tries to save a different layout.
        other = self._layout()
        other['sections'][0]['name'] = 'From the other tab'
        result = self.settings_a.with_user(self.user_a).amr_app_sections_save(
            other, 0)
        self.assertTrue(result['conflict'])
        self.assertEqual(result['layout'], stored)
        self.assertEqual(self.settings_a.amr_app_sections_layout, stored)

    def test_t03_sequential_saves_increment_the_revision(self):
        settings = self.settings_a.with_user(self.user_a)
        settings.amr_app_sections_save(self._layout(), 0)
        result = settings.amr_app_sections_save(self._layout(), 1)
        self.assertFalse(result['conflict'])
        self.assertEqual(result['layout']['rev'], 2)
