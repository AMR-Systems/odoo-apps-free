# Part of AMR App Sections. See LICENSE file for full copyright and licensing details.
from odoo.exceptions import ValidationError
from odoo.tests import tagged

from .common import AppSectionsCommon


@tagged('post_install', '-at_install')
class TestLayoutValidation(AppSectionsCommon):

    def _assert_rejected(self, layout):
        with self.assertRaises(ValidationError):
            self.settings_a.write({'amr_app_sections_layout': layout})

    def test_t01_valid_layout_accepted(self):
        self.settings_a.write({'amr_app_sections_layout': self._layout()})
        self.assertEqual(
            self.settings_a.amr_app_sections_layout['defaultSectionId'],
            's-other')

    def test_t02_empty_layout_means_not_configured(self):
        self.settings_a.write({'amr_app_sections_layout': False})
        self.assertFalse(self.settings_a.amr_app_sections_layout)

    def test_t03_rejects_non_dict(self):
        self._assert_rejected(['not', 'a', 'dict'])

    def test_t04_rejects_wrong_schema_version(self):
        self._assert_rejected(self._layout(schemaVersion=2))
        self._assert_rejected({k: v for k, v in self._layout().items()
                               if k != 'schemaVersion'})

    def test_t05_rejects_bad_rev(self):
        self._assert_rejected(self._layout(rev=-1))
        self._assert_rejected(self._layout(rev='7'))
        self._assert_rejected(self._layout(rev=True))

    def test_t06_rejects_empty_sections(self):
        self._assert_rejected(self._layout(sections=[]))
        self._assert_rejected(self._layout(sections='nope'))

    def test_t07_rejects_too_many_sections(self):
        sections = [
            {'id': 's-%d' % i, 'name': 'Section %d' % i, 'collapsed': False,
             'menuIds': []}
            for i in range(101)
        ]
        self._assert_rejected(self._layout(
            sections=sections, defaultSectionId='s-0'))

    def test_t08_accepts_maximum_sections(self):
        sections = [
            {'id': 's-%d' % i, 'name': 'Section %d' % i, 'collapsed': False,
             'menuIds': []}
            for i in range(100)
        ]
        self.settings_a.write({'amr_app_sections_layout': self._layout(
            sections=sections, defaultSectionId='s-0')})
        self.assertEqual(
            len(self.settings_a.amr_app_sections_layout['sections']), 100)

    def test_t09_rejects_duplicate_section_ids(self):
        layout = self._layout()
        layout['sections'][1]['id'] = layout['sections'][0]['id']
        layout['defaultSectionId'] = layout['sections'][0]['id']
        self._assert_rejected(layout)

    def test_t10_rejects_bad_section_id(self):
        layout = self._layout()
        layout['sections'][0]['id'] = ''
        self._assert_rejected(layout)
        layout = self._layout()
        layout['sections'][0]['id'] = 'x' * 65
        self._assert_rejected(layout)

    def test_t11_rejects_empty_or_long_name(self):
        for bad_name in ('', '   ', None, 42):
            layout = self._layout()
            layout['sections'][0]['name'] = bad_name
            self._assert_rejected(layout)
        layout = self._layout()
        layout['sections'][0]['name'] = 'x' * 101
        self._assert_rejected(layout)

    def test_t12_rejects_bad_collapsed(self):
        layout = self._layout()
        layout['sections'][0]['collapsed'] = 'yes'
        self._assert_rejected(layout)

    def test_t13_rejects_duplicate_menu_ids_across_sections(self):
        layout = self._layout()
        layout['sections'][1]['menuIds'] = [205, 309]  # 205 already in s-mine
        self._assert_rejected(layout)

    def test_t14_rejects_bad_menu_ids(self):
        for bad_ids in ('nope', [1, 'two'], [True]):
            layout = self._layout()
            layout['sections'][0]['menuIds'] = bad_ids
            self._assert_rejected(layout)

    def test_t15_rejects_unknown_default_section(self):
        self._assert_rejected(self._layout(defaultSectionId='s-missing'))

    def test_t16_rejects_oversized_layout(self):
        layout = self._layout()
        layout['sections'][0]['name'] = 'x' * 100
        layout['padding'] = 'x' * 100_001
        self._assert_rejected(layout)

    def test_t17_generic_settings_path_is_validated_too(self):
        # set_res_users_settings must not bypass the checks.
        with self.assertRaises(ValidationError):
            self.settings_a.with_user(self.user_a).set_res_users_settings(
                {'amr_app_sections_layout': {'schemaVersion': 99}})
