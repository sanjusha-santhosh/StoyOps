# Copyright (c) 2026, Hotel PMS and contributors
# For license information, please see license.txt

import json

import frappe
from frappe import _


def after_install():
    create_roles()
    create_workspace()


def create_roles():
    roles = [
        {"role_name": "Hotel Manager", "desk_access": 1},
        {"role_name": "Hotel Receptionist", "desk_access": 1},
        {"role_name": "Hotel Housekeeping", "desk_access": 1},
    ]
    for role in roles:
        if not frappe.db.exists("Role", role["role_name"]):
            doc = frappe.get_doc({"doctype": "Role", **role})
            doc.insert(ignore_permissions=True)


def create_workspace():
    workspace_name = "StayOps"
    if frappe.db.exists("Workspace", workspace_name):
        return

    workspace = frappe.get_doc(
        {
            "doctype": "Workspace",
            "name": workspace_name,
            "label": workspace_name,
            "title": workspace_name,
            "module": "stayops",
            "is_standard": 1,
            "public": 1,
            "for_user": "",
            "app": "stayops",
            "content": json.dumps(
                [
                    {
                        "type": "header",
                        "data": {"text": '<span class="h4"><b>StayOps</b></span>'},
                    },
                    {
                        "type": "paragraph",
                        "data": {"text": "Manage properties, rooms, reservations and operations."},
                    },
                    {
                        "type": "shortcut",
                        "data": {"shortcut_name": "Frontdesk", "icon": "dashboard", "route": "/hotel_frontdesk"},
                    },
                ]
            ),
            "shortcuts": [
                {
                    "type": "DocType",
                    "label": "Reservation",
                    "doc_type": "Reservation",
                    "icon": "calendar",
                },
                {
                    "type": "DocType",
                    "label": "Room",
                    "doc_type": "Room",
                    "icon": "home",
                },
                {
                    "type": "DocType",
                    "label": "Housekeeping",
                    "doc_type": "Housekeeping",
                    "icon": "cleaning",
                },
                {
                    "type": "DocType",
                    "label": "Maintenance",
                    "doc_type": "Maintenance",
                    "icon": "tool",
                },
            ],
            "links": [
                {
                    "type": "Card Break",
                    "label": "Masters",
                    "icon": "setting",
                },
                {
                    "type": "Link",
                    "label": "Property",
                    "doc_type": "Property",
                },
                {
                    "type": "Link",
                    "label": "Building",
                    "doc_type": "Building",
                },
                {
                    "type": "Link",
                    "label": "Floor",
                    "doc_type": "Floor",
                },
                {
                    "type": "Link",
                    "label": "Room Type",
                    "doc_type": "Room Type",
                },
                {
                    "type": "Link",
                    "label": "Amenity",
                    "doc_type": "Amenity",
                },
                {
                    "type": "Link",
                    "label": "Rate Plan",
                    "doc_type": "Rate Plan",
                },
                {
                    "type": "Link",
                    "label": "Season",
                    "doc_type": "Season",
                },
                {
                    "type": "Card Break",
                    "label": "Operations",
                    "icon": "calendar",
                },
                {
                    "type": "Link",
                    "label": "Reservation",
                    "doc_type": "Reservation",
                },
                {
                    "type": "Link",
                    "label": "Room Assignment",
                    "doc_type": "Room Assignment",
                },
                {
                    "type": "Link",
                    "label": "Check In",
                    "doc_type": "Check In",
                },
                {
                    "type": "Link",
                    "label": "Check Out",
                    "doc_type": "Check Out",
                },
                {
                    "type": "Link",
                    "label": "Room Move",
                    "doc_type": "Room Move",
                },
                {
                    "type": "Card Break",
                    "label": "Housekeeping & Maintenance",
                    "icon": "cleaning",
                },
                {
                    "type": "Link",
                    "label": "Housekeeping",
                    "doc_type": "Housekeeping",
                },
                {
                    "type": "Link",
                    "label": "Maintenance",
                    "doc_type": "Maintenance",
                },
            ],
        }
    )
    workspace.insert(ignore_permissions=True)
