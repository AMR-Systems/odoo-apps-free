# Part of AMR App Sections. See LICENSE file for full copyright and licensing details.
import json

from odoo import api, fields, models
from odoo.exceptions import ValidationError

MAX_SECTIONS = 100
MAX_SECTION_ID_LENGTH = 64
MAX_SECTION_NAME_LENGTH = 100
MAX_LAYOUT_SIZE = 100_000  # serialized bytes; far above any realistic layout
SCHEMA_VERSION = 1


class ResUsersSettings(models.Model):
    _inherit = 'res.users.settings'

    # One document per user describing their home menu sections.
    # False/NULL means the user has not organized their apps: the home
    # menu then behaves exactly like standard Odoo.
    # readonly like homemenu_config: written through dedicated methods only.
    amr_app_sections_layout = fields.Json(string="Home Menu Sections", readonly=True)

    @api.constrains('amr_app_sections_layout')
    def _check_amr_app_sections_layout(self):
        for settings in self:
            layout = settings.amr_app_sections_layout
            if not layout:
                continue
            self._amr_validate_layout(layout)

    @api.model
    def _amr_validate_layout(self, layout):
        # Guards every write path, including the generic
        # set_res_users_settings. Messages for user-triggerable cases are
        # user-facing; structural cases get one generic message because a
        # well-behaved client never produces them.
        generic = self.env._("This apps layout cannot be saved.")
        if not isinstance(layout, dict):
            raise ValidationError(generic)
        if layout.get('schemaVersion') != SCHEMA_VERSION:
            raise ValidationError(generic)
        rev = layout.get('rev', 0)
        if not isinstance(rev, int) or isinstance(rev, bool) or rev < 0:
            raise ValidationError(generic)
        sections = layout.get('sections')
        if not isinstance(sections, list) or not sections:
            raise ValidationError(generic)
        if len(sections) > MAX_SECTIONS:
            raise ValidationError(
                self.env._("You have reached the maximum number of sections."))
        section_ids = set()
        all_menu_ids = set()
        for section in sections:
            if not isinstance(section, dict):
                raise ValidationError(generic)
            section_id = section.get('id')
            if (not isinstance(section_id, str) or not section_id
                    or len(section_id) > MAX_SECTION_ID_LENGTH
                    or section_id in section_ids):
                raise ValidationError(generic)
            section_ids.add(section_id)
            name = section.get('name')
            if not isinstance(name, str) or not name.strip():
                raise ValidationError(
                    self.env._("A section name cannot be empty."))
            if len(name) > MAX_SECTION_NAME_LENGTH:
                raise ValidationError(
                    self.env._("A section name is too long."))
            if not isinstance(section.get('collapsed'), bool):
                raise ValidationError(generic)
            menu_ids = section.get('menuIds')
            if not isinstance(menu_ids, list):
                raise ValidationError(generic)
            for menu_id in menu_ids:
                if (not isinstance(menu_id, int) or isinstance(menu_id, bool)
                        or menu_id in all_menu_ids):
                    raise ValidationError(generic)
                all_menu_ids.add(menu_id)
        if layout.get('defaultSectionId') not in section_ids:
            raise ValidationError(generic)
        if len(json.dumps(layout)) > MAX_LAYOUT_SIZE:
            raise ValidationError(generic)

    def amr_app_sections_save(self, layout, expected_rev):
        """Save the user's layout, refusing stale writes.

        The caller sends the revision it loaded; when it no longer matches
        the stored one (the layout changed in another tab), nothing is
        written and the current document is returned instead.
        """
        self.ensure_one()
        if not isinstance(layout, dict):
            raise ValidationError(self.env._("This apps layout cannot be saved."))
        current = self.amr_app_sections_layout
        current_rev = current.get('rev', 0) if isinstance(current, dict) else 0
        if expected_rev != current_rev:
            return {'conflict': True, 'layout': current}
        # The server owns the revision counter: never trust the client's.
        new_layout = dict(layout, rev=current_rev + 1)
        self.write({'amr_app_sections_layout': new_layout})
        return {'conflict': False, 'layout': new_layout}

    def amr_app_sections_reset(self):
        """Forget the user's layout: the home menu returns to standard Odoo."""
        self.ensure_one()
        self.write({'amr_app_sections_layout': False})
