# Copyright (c) 2026, Hotel PMS and contributors
# For license information, please see license.txt

from typing import Optional

import frappe
from frappe import _

from stayops.services.availability import AvailabilityEngine


@frappe.whitelist()
def get_room_assignments(
    property_name: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
):
    """Return room assignments enriched with reservation and guest details."""
    RoomAssignment = frappe.qb.DocType("Room Assignment")
    Reservation = frappe.qb.DocType("Reservation")
    query = (
        frappe.qb.from_(RoomAssignment)
        .join(Reservation)
        .on(RoomAssignment.reservation == Reservation.name)
        .select(
            RoomAssignment.name,
            RoomAssignment.room,
            RoomAssignment.status,
            RoomAssignment.check_in,
            RoomAssignment.check_out,
            RoomAssignment.reservation,
            Reservation.guest_name,
            Reservation.room_type,
            Reservation.status.as_("reservation_status"),
        )
        .where(Reservation.status != "Cancelled")
    )

    if property_name:
        query = query.where(Reservation.property == property_name)
    if start_date and end_date:
        query = query.where(
            (RoomAssignment.check_in < end_date) & (RoomAssignment.check_out > start_date)
        )

    return query.run(as_dict=True)


@frappe.whitelist()
def get_available_rooms(
    check_in: str,
    check_out: str,
    property_name: Optional[str] = None,
    room_type: Optional[str] = None,
):
    engine = AvailabilityEngine(property_name=property_name)
    return engine.get_available_rooms(check_in, check_out, room_type=room_type)


@frappe.whitelist()
def get_availability_count(
    check_in: str,
    check_out: str,
    property_name: Optional[str] = None,
    room_type: Optional[str] = None,
):
    engine = AvailabilityEngine(property_name=property_name)
    return engine.get_availability_count(check_in, check_out, room_type=room_type)


@frappe.whitelist()
def check_room_available(
    room: str,
    check_in: str,
    check_out: str,
    exclude_reservation: Optional[str] = None,
):
    engine = AvailabilityEngine()
    return engine.is_room_available(room, check_in, check_out, exclude_reservation)
