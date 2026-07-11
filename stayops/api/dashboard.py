# Copyright (c) 2026, Hotel PMS and contributors
# For license information, please see license.txt

from typing import Optional

import frappe
from frappe.utils import get_datetime, nowdate, today


@frappe.whitelist()
def get_today_stats(property_name: Optional[str] = None):
    today_date = today()
    start_of_day = f"{today_date} 00:00:00"
    end_of_day = f"{today_date} 23:59:59"

    filters = {}
    if property_name:
        filters["property"] = property_name

    arrivals = frappe.db.count(
        "Reservation",
        filters={**filters, "check_in": ["between", [start_of_day, end_of_day]], "status": ["!=", "Cancelled"]},
    )
    departures = frappe.db.count(
        "Reservation",
        filters={**filters, "check_out": ["between", [start_of_day, end_of_day]], "status": ["!=", "Cancelled"]},
    )

    Room = frappe.qb.DocType("Room")
    room_query = frappe.qb.from_(Room).select(Room.name)
    if property_name:
        room_query = room_query.where(Room.property == property_name)
    total_rooms = len(room_query.run())

    occupied = frappe.db.count(
        "Room Assignment",
        filters={
            "status": "Checked In",
            "check_in": ["<=", end_of_day],
            "check_out": [">", start_of_day],
        },
    )

    revenue = frappe.db.sql(
        """
        SELECT COALESCE(SUM(total_amount), 0)
        FROM `tabReservation`
        WHERE status NOT IN ('Draft', 'Cancelled')
        AND DATE(check_in) <= %s AND DATE(check_out) >= %s
        """,
        (today_date, today_date),
    )[0][0]

    return {
        "arrivals": arrivals,
        "departures": departures,
        "total_rooms": total_rooms,
        "occupied": occupied,
        "vacant": total_rooms - occupied,
        "revenue": revenue,
    }
