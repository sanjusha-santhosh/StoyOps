# Copyright (c) 2026, Hotel PMS and contributors
# For license information, please see license.txt

from typing import Optional

import frappe
from frappe.utils import add_days, flt, get_datetime, time_diff_in_hours

from stayops.services.availability import AvailabilityEngine


class ReservationService:
    def __init__(self, reservation_doc):
        self.doc = reservation_doc

    def validate(self):
        self._validate_dates()
        self._calculate_nights()
        self._calculate_total()

    def before_save(self):
        self.validate()

    def on_confirm(self):
        """Called when a reservation is confirmed. Creates/updates Sales Order."""
        if not self.doc.customer:
            self.doc.db_set("customer", self._ensure_customer(), update_modified=False)

        if not self.doc.sales_order:
            sales_order = self._create_sales_order()
            self.doc.db_set("sales_order", sales_order.name, update_modified=False)
            self.doc.sales_order = sales_order.name
        else:
            self._update_sales_order()

        self._create_room_assignment()

    def _validate_dates(self):
        check_in = get_datetime(self.doc.check_in)
        check_out = get_datetime(self.doc.check_out)
        if check_out <= check_in:
            frappe.throw(frappe._("Check-out must be after check-in."))

        if self.doc.is_new():
            if self.doc.status == "Confirmed":
                self._ensure_room_type_available()

    def _calculate_nights(self):
        check_in = get_datetime(self.doc.check_in)
        check_out = get_datetime(self.doc.check_out)
        self.doc.nights = max(1, (check_out.date() - check_in.date()).days)

    def _calculate_total(self):
        rate = flt(self._resolve_rate())
        self.doc.total_amount = rate * flt(self.doc.nights)

    def _resolve_rate(self) -> float:
        if self.doc.rate_plan:
            return frappe.db.get_value("Rate Plan", self.doc.rate_plan, "rate") or 0
        if self.doc.room_type:
            return frappe.db.get_value("Room Type", self.doc.room_type, "base_rate") or 0
        return 0

    def _ensure_room_type_available(self):
        engine = AvailabilityEngine(property_name=self.doc.property)
        available = engine.get_available_rooms(
            self.doc.check_in,
            self.doc.check_out,
            room_type=self.doc.room_type,
        )
        if not available:
            frappe.throw(
                frappe._("No rooms available for the selected room type and dates.")
            )

    def _ensure_customer(self) -> str:
        """Find or create a Customer for the guest."""
        customer_name = frappe.db.get_value(
            "Customer", {"customer_name": self.doc.guest_name}, "name"
        )
        if customer_name:
            return customer_name

        customer = frappe.get_doc(
            {
                "doctype": "Customer",
                "customer_name": self.doc.guest_name,
                "customer_type": "Individual",
                "customer_group": "Individual",
                "territory": "All Territories",
                "email_id": self.doc.email,
                "mobile_no": self.doc.phone,
            }
        )
        customer.insert(ignore_permissions=True)
        return customer.name

    def _create_sales_order(self):
        items = [
            {
                "item_code": self._get_room_item(),
                "qty": self.doc.nights,
                "rate": flt(self.doc.total_amount) / max(1, flt(self.doc.nights)),
                "delivery_date": get_datetime(self.doc.check_out).date(),
                "description": f"Room: {self.doc.room_type} | Guest: {self.doc.guest_name}",
            }
        ]

        so = frappe.get_doc(
            {
                "doctype": "Sales Order",
                "customer": self.doc.customer,
                "transaction_date": frappe.utils.today(),
                "delivery_date": get_datetime(self.doc.check_out).date(),
                "items": items,
                "company": frappe.defaults.get_user_default("Company")
                or frappe.db.get_single_value("Global Defaults", "default_company"),
            }
        )
        so.insert(ignore_permissions=True)
        so.submit()
        return so

    def _update_sales_order(self):
        if not self.doc.sales_order:
            return
        so = frappe.get_doc("Sales Order", self.doc.sales_order)
        if so.docstatus == 1:
            # Cannot amend a submitted SO directly; create amendment or skip
            return
        for item in so.items:
            item.qty = self.doc.nights
            item.rate = flt(self.doc.total_amount) / max(1, flt(self.doc.nights))
        so.save(ignore_permissions=True)

    def _create_room_assignment(self):
        if frappe.db.exists(
            "Room Assignment",
            {"reservation": self.doc.name, "status": ("!=", "Cancelled")},
        ):
            return

        engine = AvailabilityEngine(property_name=self.doc.property)
        available_rooms = engine.get_available_rooms(
            self.doc.check_in, self.doc.check_out, room_type=self.doc.room_type
        )
        if not available_rooms:
            frappe.throw(frappe._("No rooms available for assignment."))

        assignment = frappe.get_doc(
            {
                "doctype": "Room Assignment",
                "reservation": self.doc.name,
                "room": available_rooms[0],
                "check_in": self.doc.check_in,
                "check_out": self.doc.check_out,
                "status": "Assigned",
            }
        )
        assignment.insert(ignore_permissions=True)

    def _get_room_item(self) -> str:
        """Return an ERPNext Item to use on Sales Order lines."""
        item_code = f"Room-{self.doc.room_type}"
        if frappe.db.exists("Item", item_code):
            return item_code

        item_group = frappe.db.get_value("Item Group", {"name": "Services"}, "name")
        if not item_group:
            item_group = "All Item Groups"

        item = frappe.get_doc(
            {
                "doctype": "Item",
                "item_code": item_code,
                "item_name": f"Room - {self.doc.room_type}",
                "item_group": item_group,
                "is_stock_item": 0,
                "is_sales_item": 1,
                "standard_rate": flt(self._resolve_rate()),
            }
        )
        item.insert(ignore_permissions=True)
        return item.name


def get_reservation_service(reservation_doc) -> ReservationService:
    return ReservationService(reservation_doc)
