# Copyright (c) 2026, Hotel PMS and contributors
# For license information, please see license.txt

from typing import Optional

import frappe
from frappe.query_builder import Criterion
from frappe.utils import get_datetime


class AvailabilityEngine:
    """Dynamic availability engine for hotel rooms and room types.

    Availability is computed using the overlap rule:
        existing.check_in < new.check_out AND existing.check_out > new.check_in
    """

    def __init__(self, property_name: Optional[str] = None):
        self.property = property_name

    def get_available_rooms(
        self,
        check_in,
        check_out,
        room_type: Optional[str] = None,
        exclude_reservation: Optional[str] = None,
    ) -> list:
        """Return list of Room names available in the given window."""
        check_in_dt = get_datetime(check_in)
        check_out_dt = get_datetime(check_out)

        occupied_rooms = self._get_occupied_room_names(
            check_in_dt, check_out_dt, exclude_reservation=exclude_reservation
        )
        maintenance_rooms = self._get_maintenance_room_names(check_in_dt, check_out_dt)
        unavailable = set(occupied_rooms + maintenance_rooms)

        Room = frappe.qb.DocType("Room")
        query = frappe.qb.from_(Room).select(Room.name).where(Room.status == "Active")

        if self.property:
            query = query.where(Room.property == self.property)
        if room_type:
            query = query.where(Room.room_type == room_type)

        rooms = query.run(as_dict=True)
        return [r.name for r in rooms if r.name not in unavailable]

    def get_availability_count(
        self,
        check_in,
        check_out,
        room_type: Optional[str] = None,
        exclude_reservation: Optional[str] = None,
    ) -> dict:
        """Return availability counts grouped by room type."""
        available_rooms = self.get_available_rooms(
            check_in, check_out, room_type=room_type, exclude_reservation=exclude_reservation
        )

        Room = frappe.qb.DocType("Room")
        query = (
            frappe.qb.from_(Room)
            .select(Room.room_type, Room.name)
            .where(Room.name.isin(available_rooms))
            .where(Room.status == "Active")
        )
        if self.property:
            query = query.where(Room.property == self.property)
        if room_type:
            query = query.where(Room.room_type == room_type)

        rows = query.run(as_dict=True)
        counts: dict = {}
        for row in rows:
            counts.setdefault(row.room_type, 0)
            counts[row.room_type] += 1
        return counts

    def is_room_available(
        self,
        room: str,
        check_in,
        check_out,
        exclude_reservation: Optional[str] = None,
    ) -> bool:
        """Check if a specific room is available in the given window."""
        available = self.get_available_rooms(
            check_in, check_out, exclude_reservation=exclude_reservation
        )
        return room in available

    def _get_occupied_room_names(
        self, check_in, check_out, exclude_reservation: Optional[str] = None
    ) -> list:
        """Return room names blocked by reservations, check-ins and check-outs."""
        occupied = []

        # Room assignments tied to active reservations
        RoomAssignment = frappe.qb.DocType("Room Assignment")
        Reservation = frappe.qb.DocType("Reservation")
        ra_query = (
            frappe.qb.from_(RoomAssignment)
            .join(Reservation)
            .on(RoomAssignment.reservation == Reservation.name)
            .select(RoomAssignment.room)
            .where(
                Criterion.all(
                    [
                        RoomAssignment.check_in < check_out,
                        RoomAssignment.check_out > check_in,
                        RoomAssignment.status != "Cancelled",
                        Reservation.status != "Cancelled",
                    ]
                )
            )
        )
        if exclude_reservation:
            ra_query = ra_query.where(Reservation.name != exclude_reservation)
        if self.property:
            ra_query = ra_query.where(Reservation.property == self.property)

        occupied += [r.room for r in ra_query.run(as_dict=True) if r.room]

        # Maintenance blocking the window
        Maintenance = frappe.qb.DocType("Maintenance")
        maint_query = (
            frappe.qb.from_(Maintenance)
            .select(Maintenance.room)
            .where(
                Criterion.all(
                    [
                        Maintenance.start_date < check_out,
                        Criterion.any(
                            [
                                Maintenance.end_date.isnull(),
                                Maintenance.end_date > check_in,
                            ]
                        ),
                        Maintenance.status != "Cancelled",
                    ]
                )
            )
        )
        if self.property:
            Room2 = frappe.qb.DocType("Room")
            maint_query = (
                maint_query.join(Room2)
                .on(Maintenance.room == Room2.name)
                .where(Room2.property == self.property)
            )

        occupied += [r.room for r in maint_query.run(as_dict=True) if r.room]

        return occupied

    def _get_maintenance_room_names(self, check_in, check_out) -> list:
        """Convenience wrapper for maintenance-only blockers."""
        return []


def get_availability(
    check_in,
    check_out,
    property_name: Optional[str] = None,
    room_type: Optional[str] = None,
):
    engine = AvailabilityEngine(property_name=property_name)
    return {
        "available_rooms": engine.get_available_rooms(check_in, check_out, room_type=room_type),
        "counts": engine.get_availability_count(check_in, check_out, room_type=room_type),
    }
