# Copyright (c) 2026, Hotel PMS and contributors
# For license information, please see license.txt

"""End-to-end smoke test for the hotel management reservation flow."""

import frappe
from frappe.utils import add_days, today


def run_test():
    frappe.set_user("Administrator")

    # Clean up previous test data
    cleanup()

    try:
        _run_test_flow()
    finally:
        cleanup()


def _run_test_flow():
    # 1. Create Property
    property_doc = frappe.get_doc(
        {
            "doctype": "Property",
            "property_name": "Test Ocean View Hotel",
            "property_code": "TOVH",
            "address": "123 Beach Road",
            "city": "Miami",
            "country": "United States",
            "status": "Active",
        }
    )
    property_doc.insert(ignore_permissions=True)
    print(f"Created Property: {property_doc.name}")

    # 2. Create Room Type
    room_type = frappe.get_doc(
        {
            "doctype": "Room Type",
            "room_type_code": "DSV",
            "room_type_name": "Deluxe Sea View",
            "base_rate": 250,
            "max_adults": 2,
            "max_children": 1,
        }
    )
    room_type.insert(ignore_permissions=True)
    print(f"Created Room Type: {room_type.name}")

    # 3. Create Room
    room = frappe.get_doc(
        {
            "doctype": "Room",
            "room_number": "101",
            "property": property_doc.name,
            "room_type": room_type.name,
            "status": "Active",
            "operational_status": "Clean",
        }
    )
    room.insert(ignore_permissions=True)
    print(f"Created Room: {room.name}")

    # 4. Create Rate Plan
    rate_plan = frappe.get_doc(
        {
            "doctype": "Rate Plan",
            "rate_plan_code": "SUM-DEL",
            "rate_plan_name": "Summer Deluxe",
            "property": property_doc.name,
            "room_type": room_type.name,
            "rate": 275,
            "currency": "USD",
        }
    )
    rate_plan.insert(ignore_permissions=True)
    print(f"Created Rate Plan: {rate_plan.name}")

    # 5. Check availability
    check_in = add_days(today(), 1)
    check_out = add_days(today(), 3)

    from stayops.services.availability import AvailabilityEngine

    engine = AvailabilityEngine(property_name=property_doc.name)
    available = engine.get_available_rooms(check_in, check_out, room_type=room_type.name)
    print(f"Available rooms: {available}")
    assert room.name in available, "Room should be available"

    # 6. Create reservation (Draft)
    from stayops.api.reservation import create_reservation, confirm_reservation

    reservation_name = create_reservation(
        guest_name="John Doe",
        email="john@example.com",
        phone="1234567890",
        property_name=property_doc.name,
        room_type=room_type.name,
        check_in=check_in,
        check_out=check_out,
        adults=2,
        rate_plan=rate_plan.name,
    )
    print(f"Created Draft Reservation: {reservation_name}")

    reservation = frappe.get_doc("Reservation", reservation_name)
    assert reservation.status == "Draft"
    assert reservation.nights == 2
    assert float(reservation.total_amount) == 550.0, reservation.total_amount

    # 7. Confirm reservation
    result = confirm_reservation(reservation_name)
    print(f"Confirmed Reservation: {result}")

    reservation.reload()
    assert reservation.status == "Confirmed"
    assert reservation.sales_order, "Sales Order should be created"

    assignment = frappe.get_doc(
        "Room Assignment", {"reservation": reservation_name, "status": "Assigned"}
    )
    assert assignment.room == room.name, "Room should be assigned"
    print(f"Created Room Assignment: {assignment.name}")

    # 8. Check in
    from stayops.api.reservation import check_in_reservation

    check_in_result = check_in_reservation(reservation_name)
    print(f"Checked In: {check_in_result}")

    reservation.reload()
    assert reservation.status == "Checked In"
    assert frappe.db.get_value("Room", room.name, "operational_status") == "Dirty"

    # 9. Check out
    from stayops.api.reservation import check_out_reservation

    check_out_result = check_out_reservation(reservation_name)
    print(f"Checked Out: {check_out_result}")

    reservation.reload()
    assert reservation.status == "Checked Out"

    # 10. Sales Invoice
    from stayops.api.reservation import create_sales_invoice_from_reservation

    si_result = create_sales_invoice_from_reservation(reservation_name)
    print(f"Created Sales Invoice: {si_result}")

    reservation.reload()
    assert reservation.sales_invoice == si_result["sales_invoice"]

    print("\n✅ All E2E tests passed.")


def cleanup():
    """Remove test documents created by this script."""
    test_property_code = "TOVH"
    if not frappe.db.exists("Property", test_property_code):
        return

    property_doc = frappe.get_doc("Property", test_property_code)
    rooms = frappe.get_all("Room", filters={"property": property_doc.name}, pluck="name")
    rate_plans = frappe.get_all("Rate Plan", filters={"room_type": "DSV"}, pluck="name")
    room_types = ["DSV"]

    # Delete assignments before reservations so no orphans remain.
    assignments = frappe.get_all(
        "Room Assignment",
        filters={"reservation": ("in", frappe.get_all("Reservation", filters={"property": property_doc.name}, pluck="name"))},
        pluck="name",
    )
    for a in assignments:
        try:
            frappe.delete_doc("Room Assignment", a, force=True)
        except Exception:
            pass

    reservations = frappe.get_all(
        "Reservation", filters={"property": property_doc.name}, pluck="name"
    )
    for r in reservations:
        try:
            frappe.delete_doc("Reservation", r, force=True)
        except Exception:
            pass

    for rp in rate_plans:
        frappe.delete_doc("Rate Plan", rp, force=True)
    for rm in rooms:
        frappe.delete_doc("Room", rm, force=True)
    for rt in room_types:
        frappe.delete_doc("Room Type", rt, force=True)

    frappe.delete_doc("Property", property_doc.name, force=True)
    print("Cleaned up previous test data")


if __name__ == "__main__":
    run_test()
