# Copyright (c) 2026, Hotel PMS and contributors
# For license information, please see license.txt

import frappe
from frappe import _


def get_context(context):
	context.no_cache = 1
	context.show_sidebar = False
	context.title = _("Hotel Frontdesk")
