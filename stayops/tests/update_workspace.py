import json

import frappe


def update():
    frappe.set_user("Administrator")
    if not frappe.db.exists("Workspace", "StayOps"):
        print("Workspace not found")
        return

    content = [
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

    doc = frappe.get_doc("Workspace", "StayOps")
    doc.content = json.dumps(content)
    doc.module = "stayops"
    doc.save()
    frappe.db.commit()
    print("Workspace updated")


if __name__ == "__main__":
    update()
