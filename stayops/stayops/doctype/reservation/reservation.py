# Copyright (c) 2026, Hotel PMS and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

from stayops.services.reservation import get_reservation_service


class Reservation(Document):
    def validate(self):
        service = get_reservation_service(self)
        service.validate()

    def before_save(self):
        service = get_reservation_service(self)
        service.before_save()

    def on_update(self):
        if self.status == "Confirmed" and not self.flags.get("confirmed_handled"):
            service = get_reservation_service(self)
            service.on_confirm()
            self.flags.confirmed_handled = True
