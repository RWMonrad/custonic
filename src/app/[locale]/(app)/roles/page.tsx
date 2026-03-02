"use client";

import { AppLayout } from "@/shared/ui/AppLayout";
import { Button } from "@/shared/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/Card";
import { PermissionMatrix } from "@/shared/ui/PermissionMatrix";
import { SettingsRow } from "@/shared/ui/SettingsRow";
import { Edit, Plus, Shield, Trash2 } from "lucide-react";
import { useState } from "react";

interface Permission {
  id: string;
  name: string;
  description: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Record<string, "allow" | "deny" | "inherit">;
}

export default function RolesPage() {
  const [settings, setSettings] = useState({
    roleHierarchy: true,
    permissionInheritance: true,
    auditRoleChanges: true,
  });

  const [roles, setRoles] = useState<Role[]>([
    {
      id: "admin",
      name: "Admin",
      description: "Full system access",
      permissions: {
        view_contracts: "allow",
        edit_contracts: "allow",
        delete_contracts: "allow",
        manage_users: "allow",
        manage_roles: "allow",
        view_analytics: "allow",
        manage_settings: "allow",
        export_data: "allow",
      },
    },
    {
      id: "manager",
      name: "Manager",
      description: "Department management",
      permissions: {
        view_contracts: "allow",
        edit_contracts: "allow",
        delete_contracts: "deny",
        manage_users: "allow",
        manage_roles: "deny",
        view_analytics: "allow",
        manage_settings: "deny",
        export_data: "allow",
      },
    },
    {
      id: "member",
      name: "Member",
      description: "Standard user access",
      permissions: {
        view_contracts: "allow",
        edit_contracts: "allow",
        delete_contracts: "deny",
        manage_users: "deny",
        manage_roles: "deny",
        view_analytics: "allow",
        manage_settings: "deny",
        export_data: "deny",
      },
    },
    {
      id: "viewer",
      name: "Viewer",
      description: "Read-only access",
      permissions: {
        view_contracts: "allow",
        edit_contracts: "deny",
        delete_contracts: "deny",
        manage_users: "deny",
        manage_roles: "deny",
        view_analytics: "allow",
        manage_settings: "deny",
        export_data: "deny",
      },
    },
  ]);

  const permissions: Permission[] = [
    {
      id: "view_contracts",
      name: "View Contracts",
      description: "View contract details and analysis",
    },
    {
      id: "edit_contracts",
      name: "Edit Contracts",
      description: "Modify contract information",
    },
    {
      id: "delete_contracts",
      name: "Delete Contracts",
      description: "Remove contracts from system",
    },
    {
      id: "manage_users",
      name: "Manage Users",
      description: "Invite, edit, and remove users",
    },
    {
      id: "manage_roles",
      name: "Manage Roles",
      description: "Create and modify user roles",
    },
    {
      id: "view_analytics",
      name: "View Analytics",
      description: "Access reports and analytics",
    },
    {
      id: "manage_settings",
      name: "Manage Settings",
      description: "Modify organization settings",
    },
    {
      id: "export_data",
      name: "Export Data",
      description: "Export contracts and reports",
    },
  ];

  const handlePermissionChange = (
    roleId: string,
    permissionId: string,
    value: "allow" | "deny" | "inherit",
  ) => {
    setRoles((prev) =>
      prev.map((role) =>
        role.id === roleId
          ? {
              ...role,
              permissions: { ...role.permissions, [permissionId]: value },
            }
          : role,
      ),
    );
  };

  const handleAddRole = () => {
    // TODO: Open role creation modal
    console.log("Add new role");
  };

  const handleEditRole = (roleId: string) => {
    // TODO: Open role edit modal
    console.log("Edit role:", roleId);
  };

  const handleDeleteRole = (roleId: string) => {
    // TODO: Confirm and delete role
    console.log("Delete role:", roleId);
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Roles & Permissions
            </h1>
            <p className="text-muted-foreground">
              Configure user roles and their permissions
            </p>
          </div>
          <Button onClick={handleAddRole}>
            <Plus className="h-4 w-4 mr-2" />
            Add Role
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Permission Matrix */}
          <div className="lg:col-span-3">
            <PermissionMatrix
              roles={roles}
              permissions={permissions}
              onPermissionChange={handlePermissionChange}
            />
          </div>

          {/* Role Management */}
          <div className="space-y-6">
            {/* Roles List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Roles</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className="flex items-center justify-between p-3 bg-background rounded-lg border"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground text-sm">
                        {role.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {role.description}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditRole(role.id)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      {role.id !== "admin" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRole(role.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Permission Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Permission Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <SettingsRow
                  title="Role Hierarchy"
                  description="Higher roles inherit lower role permissions"
                  type="toggle"
                  value={settings.roleHierarchy}
                  onValueChange={(value) =>
                    setSettings((prev) => ({
                      ...prev,
                      roleHierarchy: value as boolean,
                    }))
                  }
                />
                <SettingsRow
                  title="Permission Inheritance"
                  description="Roles inherit permissions from parent roles"
                  type="toggle"
                  value={settings.permissionInheritance}
                  onValueChange={(value) =>
                    setSettings((prev) => ({
                      ...prev,
                      permissionInheritance: value as boolean,
                    }))
                  }
                />
                <SettingsRow
                  title="Audit Role Changes"
                  description="Log all role and permission modifications"
                  type="toggle"
                  value={settings.auditRoleChanges}
                  onValueChange={(value) =>
                    setSettings((prev) => ({
                      ...prev,
                      auditRoleChanges: value as boolean,
                    }))
                  }
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
