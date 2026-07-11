#!/usr/bin/env python3
"""Generate StayOps DocType JSON files."""

import json
import os
from pathlib import Path

BASE = Path(__file__).parent / "stayops" / "stayops" / "doctype"


def scrub(name: str) -> str:
    """Convert DocType name to snake_case folder/file name."""
    return name.lower().replace(" ", "_").replace("-", "_")


def write_doctype(name: str, data: dict):
    folder_name = scrub(name)
    folder = BASE / folder_name
    folder.mkdir(parents=True, exist_ok=True)

    # DocType JSON
    json_path = folder / f"{folder_name}.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")

    # __init__.py
    init_path = folder / "__init__.py"
    init_path.touch(exist_ok=True)

    # controller .py
    py_path = folder / f"{folder_name}.py"
    if not py_path.exists():
        class_name = "".join(part.title() for part in name.split(" "))
        with open(py_path, "w", encoding="utf-8") as f:
            f.write(
                f"""import frappe
from frappe.model.document import Document


class {class_name}(Document):
\tpass
"""
            )

    # test file
    test_path = folder / f"test_{folder_name}.py"
    if not test_path.exists():
        class_name = "".join(part.title() for part in name.split(" "))
        with open(test_path, "w", encoding="utf-8") as f:
            f.write(
                f"""# Copyright (c) 2026, Hotel PMS and Contributors
# See license.txt

# import frappe
from frappe.tests.utils import FrappeTestCase


class Test{class_name}(FrappeTestCase):
\tpass
"""
            )


def field(
    fieldname,
    fieldtype,
    label=None,
    options=None,
    reqd=False,
    default=None,
    read_only=False,
    in_list_view=False,
    in_standard_filter=False,
    in_global_search=False,
    search_index=False,
    hidden=False,
    depends_on=None,
    description=None,
):
    f = {
        "fieldname": fieldname,
        "fieldtype": fieldtype,
        "label": label or fieldname.replace("_", " ").title(),
    }
    if options:
        f["options"] = options
    if reqd:
        f["reqd"] = 1
    if default is not None:
        f["default"] = default
    if read_only:
        f["read_only"] = 1
    if in_list_view:
        f["in_list_view"] = 1
    if in_standard_filter:
        f["in_standard_filter"] = 1
    if in_global_search:
        f["in_global_search"] = 1
    if search_index:
        f["search_index"] = 1
    if hidden:
        f["hidden"] = 1
    if depends_on:
        f["depends_on"] = depends_on
    if description:
        f["description"] = description
    return f


def section(label, fieldname=None):
    return field(
        fieldname or f"section_break_{label.lower().replace(' ', '_')}",
        "Section Break",
        label=label,
    )


def column(label, fieldname=None):
    return field(
        fieldname or f"column_break_{label.lower().replace(' ', '_')}",
        "Column Break",
        label=label,
    )


def base_permissions():
    roles = ["System Manager", "Hotel Manager", "Hotel Receptionist", "Hotel Housekeeping"]
    perms = []
    for role in roles:
        perms.append(
            {
                "role": role,
                "permlevel": 0,
                "read": 1,
                "write": 1 if role in ["System Manager", "Hotel Manager"] else 0,
                "create": 1 if role in ["System Manager", "Hotel Manager"] else 0,
                "delete": 1 if role == "System Manager" else 0,
                "submit": 0,
                "cancel": 0,
                "amend": 0,
                "report": 1,
                "export": 1,
                "import": 1 if role == "System Manager" else 0,
                "share": 1,
                "print": 1,
                "email": 1,
            }
        )
    return perms


def base_doc(name: str, fields: list, **kwargs):
    data = {
        "actions": [],
        "allow_rename": 1,
        "autoname": kwargs.get("autoname", "field:name"),
        "istable": kwargs.get("istable", 0),
        "creation": "2026-07-11 00:00:00.000000",
        "doctype": "DocType",
        "editable_grid": 1,
        "engine": "InnoDB",
        "field_order": [f["fieldname"] for f in fields],
        "fields": fields,
        "index_web_pages_for_search": 1,
        "is_submittable": kwargs.get("is_submittable", 0),
        "links": kwargs.get("links", []),
        "modified": "2026-07-11 00:00:00.000000",
        "modified_by": "Administrator",
        "module": "stayops",
        "name": name,
        "naming_rule": kwargs.get("naming_rule", "By fieldname"),
        "owner": "Administrator",
        "permissions": kwargs.get("permissions", base_permissions()),
        "sort_field": "modified",
        "sort_order": "DESC",
        "states": [],
        "track_changes": 1,
        "track_seen": 1,
        "track_views": 1,
    }
    if "default_view" in kwargs:
        data["default_view"] = kwargs["default_view"]
    return data


# ------------------ MASTERS ------------------

PROPERTY = base_doc(
    "Property",
    [
        field("property_code", "Data", reqd=True, in_list_view=1, search_index=1),
        field("property_name", "Data", reqd=True, in_list_view=1, in_global_search=1),
        section("Address & Contact"),
        field("address", "Text"),
        field("city", "Data", in_list_view=1),
        field("country", "Link", options="Country"),
        field("postal_code", "Data"),
        field("phone", "Data"),
        field("email", "Data"),
        section("Configuration"),
        field("default_checkin_time", "Time", default="14:00:00"),
        field("default_checkout_time", "Time", default="11:00:00"),
        field("timezone", "Data", default="Asia/Dubai"),
        field("status", "Select", options="Active\nInactive", default="Active", in_list_view=1, in_standard_filter=1),
    ],
    autoname="field:property_code",
)

BUILDING = base_doc(
    "Building",
    [
        field("property", "Link", options="Property", reqd=True, in_list_view=1, in_standard_filter=1),
        field("building_code", "Data", reqd=True, in_list_view=1, search_index=1),
        field("building_name", "Data", reqd=True, in_list_view=1),
        field("status", "Select", options="Active\nInactive", default="Active", in_list_view=1),
    ],
    autoname="field:building_code",
)

FLOOR = base_doc(
    "Floor",
    [
        field("building", "Link", options="Building", reqd=True, in_list_view=1, in_standard_filter=1),
        field("floor_code", "Data", reqd=True, in_list_view=1, search_index=1),
        field("floor_name", "Data", reqd=True, in_list_view=1),
        field("status", "Select", options="Active\nInactive", default="Active", in_list_view=1),
    ],
    autoname="field:floor_code",
)

AMENITY = base_doc(
    "Amenity",
    [
        field("amenity_name", "Data", reqd=True, in_list_view=1, in_global_search=1),
        field("category", "Select", options="General\nRoom\nBathroom\nTechnology\nSafety\nAccessibility", default="General", in_list_view=1, in_standard_filter=1),
        field("description", "Text"),
    ],
    autoname="field:amenity_name",
)

ROOM_TYPE = base_doc(
    "Room Type",
    [
        field("room_type_code", "Data", reqd=True, in_list_view=1, search_index=1),
        field("room_type_name", "Data", reqd=True, in_list_view=1, in_global_search=1),
        field("base_rate", "Currency", reqd=True, in_list_view=1),
        field("max_adults", "Int", default=2, reqd=True),
        field("max_children", "Int", default=0),
        field("description", "Text"),
        field("amenities", "Table MultiSelect", options="Room Type Amenity"),
    ],
    autoname="field:room_type_code",
)

ROOM_TYPE_AMENITY = base_doc(
    "Room Type Amenity",
    [
        field("amenity", "Link", options="Amenity", reqd=True, in_list_view=1),
        field("quantity", "Int", default=1),
    ],
    autoname="hash",
    naming_rule="Random",
    istable=1,
)

ROOM = base_doc(
    "Room",
    [
        field("property", "Link", options="Property", reqd=True, in_list_view=1, in_standard_filter=1),
        field("building", "Link", options="Building", in_list_view=1, in_standard_filter=1),
        field("floor", "Link", options="Floor", in_list_view=1, in_standard_filter=1),
        field("room_type", "Link", options="Room Type", reqd=True, in_list_view=1, in_standard_filter=1),
        field("room_number", "Data", reqd=True, in_list_view=1, search_index=1),
        field("room_name", "Data"),
        field("bed_type", "Select", options="Single\nDouble\nQueen\nKing\nTwin\nSuite", default="Double"),
        field("is_smoking", "Check"),
        field("status", "Select", options="Active\nInactive", default="Active", in_list_view=1, in_standard_filter=1),
        field("operational_status", "Select", options="Clean\nDirty\nInspection\nMaintenance", default="Clean", in_list_view=1, in_standard_filter=1),
        field("description", "Text"),
    ],
    autoname="field:room_number",
    links=[
        {"group": "Reservations", "link_doctype": "Room Assignment", "link_fieldname": "room"},
        {"group": "Housekeeping", "link_doctype": "Housekeeping", "link_fieldname": "room"},
        {"group": "Maintenance", "link_doctype": "Maintenance", "link_fieldname": "room"},
    ],
)

SEASON = base_doc(
    "Season",
    [
        field("season_name", "Data", reqd=True, in_list_view=1, in_global_search=1),
        field("start_date", "Date", reqd=True, in_list_view=1),
        field("end_date", "Date", reqd=True, in_list_view=1),
        field("is_active", "Check", default=1, in_list_view=1),
    ],
    autoname="field:season_name",
)

RATE_PLAN = base_doc(
    "Rate Plan",
    [
        field("rate_plan_code", "Data", reqd=True, in_list_view=1, search_index=1),
        field("rate_plan_name", "Data", reqd=True, in_list_view=1),
        field("room_type", "Link", options="Room Type", reqd=True, in_list_view=1, in_standard_filter=1),
        field("season", "Link", options="Season", in_list_view=1, in_standard_filter=1),
        field("rate", "Currency", reqd=True, in_list_view=1),
        field("breakfast_included", "Check"),
        field("cancellation_policy", "Text"),
        field("is_active", "Check", default=1, in_list_view=1),
    ],
    autoname="field:rate_plan_code",
)

# ------------------ TRANSACTIONS ------------------

RESERVATION = base_doc(
    "Reservation",
    [
        field("naming_series", "Select", options="RES-.YYYY.-", default="RES-.YYYY.-", reqd=True),
        field("reservation_number", "Data", read_only=True, in_list_view=1, search_index=1),
        field("property", "Link", options="Property", reqd=True, in_list_view=1, in_standard_filter=1),
        field("status", "Select", options="Draft\nConfirmed\nChecked In\nChecked Out\nCancelled\nNo Show", default="Draft", in_list_view=1, in_standard_filter=1),
        section("Guest Information"),
        field("guest_type", "Select", options="Individual\nCompany\nTravel Agent", default="Individual"),
        field("customer", "Link", options="Customer"),
        field("guest_name", "Data", reqd=True, in_list_view=1, in_global_search=1),
        field("email", "Data"),
        field("phone", "Data"),
        field("adults", "Int", default=1, reqd=True),
        field("children", "Int", default=0),
        section("Stay Details"),
        field("room_type", "Link", options="Room Type", reqd=True, in_list_view=1, in_standard_filter=1),
        field("rate_plan", "Link", options="Rate Plan"),
        field("check_in", "Datetime", reqd=True, in_list_view=1),
        field("check_out", "Datetime", reqd=True, in_list_view=1),
        field("nights", "Int", read_only=True),
        field("special_requests", "Text"),
        section("ERPNext Integration"),
        field("sales_order", "Link", options="Sales Order", read_only=True),
        field("sales_invoice", "Link", options="Sales Invoice", read_only=True),
        field("total_amount", "Currency", read_only=True, in_list_view=1),
    ],
    autoname="naming_series:",
    naming_rule='By "Naming Series" (separated by -)',
)

ROOM_ASSIGNMENT = base_doc(
    "Room Assignment",
    [
        field("reservation", "Link", options="Reservation", reqd=True, in_list_view=1, in_standard_filter=1),
        field("room", "Link", options="Room", reqd=True, in_list_view=1, in_standard_filter=1),
        field("status", "Select", options="Assigned\nChecked In\nChecked Out\nCancelled", default="Assigned", in_list_view=1, in_standard_filter=1),
        field("check_in", "Datetime", reqd=True, in_list_view=1),
        field("check_out", "Datetime", reqd=True, in_list_view=1),
    ],
    autoname="hash",
    naming_rule="Random",
)

CHECK_IN = base_doc(
    "Check In",
    [
        field("reservation", "Link", options="Reservation", reqd=True, in_list_view=1, in_standard_filter=1),
        field("room_assignment", "Link", options="Room Assignment", reqd=True, in_list_view=1),
        field("room", "Link", options="Room", reqd=True, in_list_view=1),
        field("check_in_time", "Datetime", reqd=True, in_list_view=1),
        field("expected_check_out", "Datetime", reqd=True),
        field("actual_check_out", "Datetime"),
        field("received_by", "Link", options="User"),
        field("notes", "Text"),
    ],
    autoname="hash",
    naming_rule="Random",
)

CHECK_OUT = base_doc(
    "Check Out",
    [
        field("reservation", "Link", options="Reservation", reqd=True, in_list_view=1, in_standard_filter=1),
        field("room_assignment", "Link", options="Room Assignment", reqd=True, in_list_view=1),
        field("room", "Link", options="Room", reqd=True, in_list_view=1),
        field("check_out_time", "Datetime", reqd=True, in_list_view=1),
        field("late_checkout_charges", "Currency", default=0),
        field("additional_charges", "Currency", default=0),
        field("checked_out_by", "Link", options="User"),
        field("notes", "Text"),
    ],
    autoname="hash",
    naming_rule="Random",
)

ROOM_MOVE = base_doc(
    "Room Move",
    [
        field("reservation", "Link", options="Reservation", reqd=True, in_list_view=1, in_standard_filter=1),
        field("room_assignment", "Link", options="Room Assignment", reqd=True),
        field("from_room", "Link", options="Room", reqd=True, in_list_view=1),
        field("to_room", "Link", options="Room", reqd=True, in_list_view=1),
        field("move_time", "Datetime", reqd=True, in_list_view=1),
        field("reason", "Text"),
    ],
    autoname="hash",
    naming_rule="Random",
)

HOUSEKEEPING = base_doc(
    "Housekeeping",
    [
        field("room", "Link", options="Room", reqd=True, in_list_view=1, in_standard_filter=1),
        field("scheduled_date", "Date", reqd=True, in_list_view=1, in_standard_filter=1),
        field("task_type", "Select", options="Cleaning\nTurndown\nDeep Clean\nInspection", default="Cleaning"),
        field("status", "Select", options="Scheduled\nIn Progress\nCleaned\nVerified", default="Scheduled", in_list_view=1, in_standard_filter=1),
        field("assigned_to", "Link", options="User"),
        field("started_at", "Datetime"),
        field("completed_at", "Datetime"),
        field("notes", "Text"),
    ],
    autoname="hash",
    naming_rule="Random",
)

MAINTENANCE = base_doc(
    "Maintenance",
    [
        field("room", "Link", options="Room", reqd=True, in_list_view=1, in_standard_filter=1),
        field("maintenance_type", "Select", options="Repair\nRenovation\nPreventive\nInspection", default="Repair"),
        field("start_date", "Datetime", reqd=True, in_list_view=1),
        field("end_date", "Datetime"),
        field("reason", "Text"),
        field("status", "Select", options="Scheduled\nIn Progress\nCompleted\nCancelled", default="Scheduled", in_list_view=1, in_standard_filter=1),
        field("requested_by", "Link", options="User"),
    ],
    autoname="hash",
    naming_rule="Random",
)

DOCTYPES = [
    PROPERTY,
    BUILDING,
    FLOOR,
    AMENITY,
    ROOM_TYPE,
    ROOM_TYPE_AMENITY,
    ROOM,
    SEASON,
    RATE_PLAN,
    RESERVATION,
    ROOM_ASSIGNMENT,
    CHECK_IN,
    CHECK_OUT,
    ROOM_MOVE,
    HOUSEKEEPING,
    MAINTENANCE,
]

for dt in DOCTYPES:
    write_doctype(dt["name"], dt)
    print(f"Created DocType: {dt['name']}")

print("Done.")
