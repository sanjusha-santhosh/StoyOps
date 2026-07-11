# Copyright (c) 2026, Hotel PMS and contributors
# For license information, please see license.txt

from typing import Optional

import frappe
from frappe import _


@frappe.whitelist()
def create_housekeeping_task(
    room: str,
    scheduled_date: str,
    task_type: str = "Cleaning",
    assigned_to: Optional[str] = None,
    notes: Optional[str] = None,
):
    doc = frappe.get_doc(
        {
            "doctype": "Housekeeping",
            "room": room,
            "scheduled_date": scheduled_date,
            "task_type": task_type,
            "status": "Scheduled",
            "assigned_to": assigned_to,
            "notes": notes,
        }
    )
    doc.insert()
    return {"name": doc.name}


@frappe.whitelist()
def update_housekeeping_status(name: str, status: str):
    valid = ["Scheduled", "In Progress", "Cleaned", "Verified"]
    if status not in valid:
        frappe.throw(_("Invalid status. Must be one of: {0}").format(", ".join(valid)))

    doc = frappe.get_doc("Housekeeping", name)
    doc.status = status
    if status == "In Progress" and not doc.started_at:
        doc.started_at = frappe.utils.now()
    if status in ("Cleaned", "Verified") and not doc.completed_at:
        doc.completed_at = frappe.utils.now()
    doc.save()
    return {"name": doc.name, "status": doc.status}


@frappe.whitelist()
def create_maintenance(
    room: str,
    start_date: str,
    maintenance_type: str = "Repair",
    end_date: Optional[str] = None,
    reason: Optional[str] = None,
):
    doc = frappe.get_doc(
        {
            "doctype": "Maintenance",
            "room": room,
            "maintenance_type": maintenance_type,
            "start_date": start_date,
            "end_date": end_date,
            "reason": reason,
            "status": "Scheduled",
        }
    )
    doc.insert()
    return {"name": doc.name}


@frappe.whitelist()
def update_maintenance_status(name: str, status: str):
    valid = ["Scheduled", "In Progress", "Completed", "Cancelled"]
    if status not in valid:
        frappe.throw(_("Invalid status. Must be one of: {0}").format(", ".join(valid)))

    doc = frappe.get_doc("Maintenance", name)
    doc.status = status
    doc.save()
    return {"name": doc.name, "status": doc.status}


@frappe.whitelist()
def create_room_move(
    reservation_name: str,
    from_room: str,
    to_room: str,
    move_time: Optional[str] = None,
    reason: Optional[str] = None,
):
    if not move_time:
        move_time = frappe.utils.now()

    assignment = frappe.db.get_value(
        "Room Assignment",
        {"reservation": reservation_name, "status": ("in", ["Assigned", "Checked In"])},
        ["name", "room"],
        as_dict=True,
    )
    if not assignment:
        frappe.throw(_("No active room assignment found for this reservation."))
    if assignment.room != from_room:
        frappe.throw(_("From room does not match the current assignment."))

    move = frappe.get_doc(
        {
            "doctype": "Room Move",
            "reservation": reservation_name,
            "room_assignment": assignment.name,
            "from_room": from_room,
            "to_room": to_room,
            "move_time": move_time,
            "reason": reason,
        }
    )
    move.insert()

    frappe.db.set_value("Room Assignment", assignment.name, "room", to_room)

    active_check_in = frappe.db.exists(
        "Check In",
        {"reservation": reservation_name, "room": from_room},
    )
    if active_check_in:
        frappe.db.set_value("Check In", active_check_in, "room", to_room)

    return {"name": move.name, "new_room": to_room}


@frappe.whitelist()
def update_room_operational_status(room: str, operational_status: str):
    valid = ["Clean", "Dirty", "Inspection", "Maintenance"]
    if operational_status not in valid:
        frappe.throw(_("Invalid operational status."))

    frappe.db.set_value("Room", room, "operational_status", operational_status)
    return {"room": room, "operational_status": operational_status}
