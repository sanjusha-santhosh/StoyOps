# Copyright (c) 2026, Hotel PMS and contributors
# For license information, please see license.txt

import frappe
from frappe import _


def get_context(context):
    if frappe.session.user == "Guest":
        frappe.local.flags.redirect_location = "/login?redirect-to=/hotel_frontdesk"
        raise frappe.Redirect

    context.no_cache = 1
    context.show_sidebar = False
    context.title = _("Hotel Frontdesk")
    context.user = frappe.session.user
