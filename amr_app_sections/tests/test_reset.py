# Part of AMR App Sections. See LICENSE file for full copyright and licensing details.
from odoo.tests import tagged

from .common import AppSectionsCommon


@tagged('post_install', '-at_install')
class TestReset(AppSectionsCommon):

    def test_t01_reset_clears_the_layout(self):
        settings = self.settings_a.with_user(self.user_a)
        settings.amr_app_sections_save(self._layout(), 0)
        settings.amr_app_sections_reset()
        self.assertFalse(self.settings_a.amr_app_sections_layout)

    def test_t02_reset_is_idempotent(self):
        settings = self.settings_a.with_user(self.user_a)
        settings.amr_app_sections_save(self._layout(), 0)
        settings.amr_app_sections_reset()
        settings.amr_app_sections_reset()
        self.assertFalse(self.settings_a.amr_app_sections_layout)

    def test_t03_reset_keeps_the_standard_app_order(self):
        # The stock home menu ordering (homemenu_config) must survive both
        # organizing apps into sections and resetting the layout.
        order = ['crm.crm_menu_root', 'sale.sale_menu_root']
        self.settings_a.write({'homemenu_config': order})
        settings = self.settings_a.with_user(self.user_a)
        settings.amr_app_sections_save(self._layout(), 0)
        settings.amr_app_sections_reset()
        self.assertEqual(self.settings_a.homemenu_config, order)

    def test_t04_saving_after_reset_starts_from_revision_zero(self):
        settings = self.settings_a.with_user(self.user_a)
        settings.amr_app_sections_save(self._layout(), 0)
        settings.amr_app_sections_reset()
        result = settings.amr_app_sections_save(self._layout(), 0)
        self.assertFalse(result['conflict'])
        self.assertEqual(result['layout']['rev'], 1)
