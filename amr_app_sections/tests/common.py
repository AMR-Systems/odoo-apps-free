# Part of AMR App Sections. See LICENSE file for full copyright and licensing details.
from odoo.tests.common import TransactionCase


class AppSectionsCommon(TransactionCase):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.user_a, cls.user_b = cls.env['res.users'].create([
            {
                'name': 'Sections User A',
                'login': 'amr_sections_user_a',
                'email': 'sections.a@example.com',
                'group_ids': [(4, cls.env.ref('base.group_user').id)],
            },
            {
                'name': 'Sections User B',
                'login': 'amr_sections_user_b',
                'email': 'sections.b@example.com',
                'group_ids': [(4, cls.env.ref('base.group_user').id)],
            },
        ])
        Settings = cls.env['res.users.settings']
        cls.settings_a = Settings._find_or_create_for_user(cls.user_a)
        cls.settings_b = Settings._find_or_create_for_user(cls.user_b)

    @staticmethod
    def _layout(**overrides):
        layout = {
            'schemaVersion': 1,
            'rev': 0,
            'defaultSectionId': 's-other',
            'sections': [
                {'id': 's-mine', 'name': 'My apps', 'collapsed': False,
                 'menuIds': [101, 205]},
                {'id': 's-other', 'name': 'Other', 'collapsed': True,
                 'menuIds': [309, 401]},
            ],
        }
        layout.update(overrides)
        return layout
