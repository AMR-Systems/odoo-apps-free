# Part of AMR App Sections. See LICENSE file for full copyright and licensing details.
from odoo.exceptions import AccessError
from odoo.tests import tagged

from .common import AppSectionsCommon


@tagged('post_install', '-at_install')
class TestUserIsolation(AppSectionsCommon):

    def test_t01_user_saves_own_layout(self):
        result = self.settings_a.with_user(self.user_a).amr_app_sections_save(
            self._layout(), 0)
        self.assertFalse(result['conflict'])
        self.assertEqual(result['layout']['rev'], 1)

    def test_t02_layouts_are_separate_per_user(self):
        layout_a = self._layout()
        layout_b = self._layout()
        layout_b['sections'][0]['name'] = 'B apps'
        self.settings_a.with_user(self.user_a).amr_app_sections_save(layout_a, 0)
        self.settings_b.with_user(self.user_b).amr_app_sections_save(layout_b, 0)
        self.assertEqual(
            self.settings_a.amr_app_sections_layout['sections'][0]['name'],
            'My apps')
        self.assertEqual(
            self.settings_b.amr_app_sections_layout['sections'][0]['name'],
            'B apps')

    def test_t03_cannot_read_another_users_layout(self):
        self.settings_a.write({'amr_app_sections_layout': self._layout()})
        with self.assertRaises(AccessError):
            self.settings_a.with_user(self.user_b).read(
                ['amr_app_sections_layout'])

    def test_t04_cannot_save_another_users_layout(self):
        # T16 from the spec: saving someone else's layout over RPC is refused.
        self.settings_a.write({'amr_app_sections_layout': self._layout()})
        before = self.settings_a.amr_app_sections_layout
        with self.assertRaises(AccessError):
            self.settings_a.with_user(self.user_b).amr_app_sections_save(
                self._layout(), before['rev'])
        self.assertEqual(self.settings_a.amr_app_sections_layout, before)

    def test_t05_cannot_reset_another_users_layout(self):
        self.settings_a.write({'amr_app_sections_layout': self._layout()})
        with self.assertRaises(AccessError):
            self.settings_a.with_user(self.user_b).amr_app_sections_reset()
        self.assertTrue(self.settings_a.amr_app_sections_layout)

    def test_t06_layout_is_in_the_session_payload(self):
        # Whatever browser the user signs in from loads the saved layout
        # through the standard settings payload.
        self.settings_a.write({'amr_app_sections_layout': self._layout()})
        formatted = self.settings_a.with_user(self.user_a)._res_users_settings_format()
        self.assertIn('amr_app_sections_layout', formatted)
        self.assertEqual(
            formatted['amr_app_sections_layout']['defaultSectionId'],
            's-other')
