"use client";

import { useState } from "react";
import { Check, X, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./Card";

interface Permission {
  id: string;
  name: string;
  description: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Record<string, 'allow' | 'deny' | 'inherit'>;
}

interface PermissionMatrixProps {
  roles: Role[];
  permissions: Permission[];
  onPermissionChange?: (roleId: string, permissionId: string, value: 'allow' | 'deny' | 'inherit') => void;
  readonly?: boolean;
}

export function PermissionMatrix({ 
  roles, 
  permissions, 
  onPermissionChange,
  readonly = false 
}: PermissionMatrixProps) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const getPermissionIcon = (value: 'allow' | 'deny' | 'inherit') => {
    switch (value) {
      case 'allow':
        return <Check className="h-4 w-4 text-success" />;
      case 'deny':
        return <X className="h-4 w-4 text-danger" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getPermissionClass = (value: 'allow' | 'deny' | 'inherit') => {
    switch (value) {
      case 'allow':
        return 'bg-success/10 text-success';
      case 'deny':
        return 'bg-danger/10 text-danger';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const cyclePermission = (roleId: string, permissionId: string, currentValue: 'allow' | 'deny' | 'inherit') => {
    if (readonly || !onPermissionChange) return;
    
    const nextValue = currentValue === 'inherit' ? 'allow' : currentValue === 'allow' ? 'deny' : 'inherit';
    onPermissionChange(roleId, permissionId, nextValue);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permission Matrix</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Permission
                </th>
                {roles.map((role) => (
                  <th
                    key={role.id}
                    className={`
                      px-4 py-3 text-center text-xs font-medium uppercase tracking-wider cursor-pointer
                      ${selectedRole === role.id ? 'text-primary' : 'text-muted-foreground'}
                      hover:text-foreground
                    `}
                    onClick={() => setSelectedRole(selectedRole === role.id ? null : role.id)}
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <span>{role.name}</span>
                      <span className="text-xs font-normal normal-case">{role.description}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {permissions.map((permission) => (
                <tr key={permission.id} className="hover:bg-background">
                  <td className="px-4 py-3 text-sm">
                    <div>
                      <div className="font-medium text-foreground">{permission.name}</div>
                      <div className="text-xs text-muted-foreground">{permission.description}</div>
                    </div>
                  </td>
                  {roles.map((role) => {
                    const permissionValue = role.permissions[permission.id] || 'inherit';
                    return (
                      <td
                        key={role.id}
                        className="px-4 py-3 text-center"
                        onClick={() => cyclePermission(role.id, permission.id, permissionValue)}
                      >
                        <div
                          className={`
                            inline-flex items-center justify-center w-8 h-8 rounded-full border
                            ${getPermissionClass(permissionValue)}
                            ${!readonly && 'cursor-pointer hover:opacity-80'}
                          `}
                        >
                          {getPermissionIcon(permissionValue)}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {!readonly && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="font-medium text-foreground mb-2">How to use:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Click any permission cell to cycle through: Inherit → Allow → Deny</li>
              <li>• <Check className="inline h-3 w-3 text-success mx-1" />Allow: Explicitly grants permission</li>
              <li>• <X className="inline h-3 w-3 text-danger mx-1" />Deny: Explicitly denies permission</li>
              <li>• <Minus className="inline h-3 w-3 text-muted-foreground mx-1" />Inherit: Uses parent role permissions</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
