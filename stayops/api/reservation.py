# Copyright (c) 2026, Hotel PMS and contributors
# For license information, please see license.txt

from typing import Optional

import frappe
from frappe import _


@frappe.whitelist()
def create_reservation(
    guest_name: str,
    email: Optional[str],
    phone: Optional[str],
    property_name: str,
    room_type: str,
    check_in: str,
    check_out: str,
    adults: int = 1,
    children: int = 0,
    rate_plan: Optional[str] = None,
    special_requests: Optional[str] = None,
):
    reservation = frappe.get_doc(
        {
            "doctype": "Reservation",
            "guest_name": guest_name,
            "email": email,
            "phone": phone,
            "property": property_name,
            "room_type": room_type,
            "check_in": check_in,
            "check_out": check_out,
            "adults": adults,
            "children": children,
            "rate_plan": rate_plan,
            "special_requests": special_requests,
            "status": "Draft",
        }
    )
    reservation.insert()
    return reservation.name


@frappe.whitelist()
def confirm_reservation(reservation_name: str):
    reservation = frappe.get_doc("Reservation", reservation_name)
    if reservation.status != "Draft":
        frappe.throw(_("Only Draft reservations can be confirmed."))
    reservation.status = "Confirmed"
    reservation.save()
    return {"name": reservation.name, "status": reservation.status}


@frappe.whitelist()
def check_in_reservation(
    reservation_name: str,
    room: Optional[str] = None,
    check_in_time: Optional[str] = None,
):
    reservation = frappe.get_doc("Reservation", reservation_name)
    if reservation.status != "Confirmed":
        frappe.throw(_("Reservation must be confirmed before check-in."))

    if not check_in_time:
        check_in_time = frappe.utils.now()

    assignment = frappe.db.get_value(
        "Room Assignment",
        {"reservation": reservation_name, "status": "Assigned"},
        ["name", "room", "check_out"],
        as_dict=True,
    )
    if not assignment:
        frappe.throw(_("No active room assignment found for this reservation."))

    assigned_room = room or assignment.room

    check_in_doc = frappe.get_doc(
        {
            "doctype": "Check In",
            "reservation": reservation_name,
            "room_assignment": assignment.name,
            "room": assigned_room,
            "check_in_time": check_in_time,
            "expected_check_out": assignment.check_out,
            "received_by": frappe.session.user,
        }
    )
    check_in_doc.insert()

    frappe.db.set_value("Room Assignment", assignment.name, "status", "Checked In")
    frappe.db.set_value("Reservation", reservation_name, "status", "Checked In")
    frappe.db.set_value("Room", assigned_room, "operational_status", "Dirty")

    return {"name": check_in_doc.name, "room": assigned_room}


@frappe.whitelist()
def check_out_reservation(
    reservation_name: str,
    room: Optional[str] = None,
    check_out_time: Optional[str] = None,
):
    reservation = frappe.get_doc("Reservation", reservation_name)
    if reservation.status != "Checked In":
        frappe.throw(_("Reservation must be checked in before check-out."))

    if not check_out_time:
        check_out_time = frappe.utils.now()

    filters = {"reservation": reservation_name, "status": "Checked In"}
    if room:
        filters["room"] = room

    assignment = frappe.db.get_value(
        "Room Assignment",
        filters,
        ["name", "room"],
        as_dict=True,
    )
    if not assignment:
        frappe.throw(_("No checked-in room assignment found."))

    check_out_doc = frappe.get_doc(
        {
            "doctype": "Check Out",
            "reservation": reservation_name,
            "room_assignment": assignment.name,
            "room": assignment.room,
            "check_out_time": check_out_time,
            "checked_out_by": frappe.session.user,
        }
    )
    check_out_doc.insert()

    frappe.db.set_value("Room Assignment", assignment.name, "status", "Checked Out")
    frappe.db.set_value("Reservation", reservation_name, "status", "Checked Out")
    frappe.db.set_value("Room", assignment.room, "operational_status", "Dirty")

    return {"name": check_out_doc.name, "room": assignment.room}


@frappe.whitelist()
def create_sales_invoice_from_reservation(reservation_name: str):
    reservation = frappe.get_doc("Reservation", reservation_name)
    if not reservation.sales_order:
        frappe.throw(_("No Sales Order linked to this reservation."))

    so = frappe.get_doc("Sales Order", reservation.sales_order)
    si = frappe.get_doc(
        {
            "doctype": "Sales Invoice",
            "customer": so.customer,
            "company": so.company,
            "items": [
                {
                    "item_code": item.item_code,
                    "qty": item.qty,
                    "rate": item.rate,
                    "description": item.description,
                }
                for item in so.items
            ],
        }
    )
    si.insert()
    si.submit()

    reservation.sales_invoice = si.name
    reservation.save()

    return {"sales_invoice": si.name}
