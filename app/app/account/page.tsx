"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Users,
  Sliders,
  Shield,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Save,
  Loader2,
  AlertCircle,
  Lock,
  ArrowLeft,
  KeyRound,
  Mail,
  User as UserIcon,
} from "lucide-react";

function AccountManagementContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState<"restaurant" | "users" | "operations">("users");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authContext, setAuthContext] = useState<any>(null);

  // Sync tab with URL query parameter
  useEffect(() => {
    if (tabParam === "team" || tabParam === "users") {
      setActiveTab("users");
    } else if (tabParam === "profile" || tabParam === "restaurant") {
      setActiveTab("restaurant");
    } else if (tabParam === "shifts" || tabParam === "operations") {
      setActiveTab("operations");
    }
  }, [tabParam]);

  // Restaurant details state
  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [currency, setCurrency] = useState("INR");

  // Users state
  const [usersList, setUsersList] = useState<any[]>([]);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // New user form state
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "staff">("staff");
  const [newUserCanManageSop, setNewUserCanManageSop] = useState(false);
  const [userModalError, setUserModalError] = useState("");

  // Edit user form state
  const [editUserName, setEditUserName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editUserRole, setEditUserRole] = useState<"admin" | "staff">("staff");
  const [editUserStatus, setEditUserStatus] = useState<"active" | "inactive">("active");
  const [editUserCanManageSop, setEditUserCanManageSop] = useState(false);
  const [editUserNewPassword, setEditUserNewPassword] = useState("");
  const [editUserModalError, setEditUserModalError] = useState("");

  // Operational settings state
  const [shiftsEnabled, setShiftsEnabled] = useState(false);
  const [shiftNames, setShiftNames] = useState<string[]>(["Morning", "Evening"]);
  const [newShiftInput, setNewShiftInput] = useState("");
  const [responsibleAreas, setResponsibleAreas] = useState<string[]>([
    "Kitchen",
    "Bar",
    "Bakery",
    "Service",
    "Storage",
    "Other",
  ]);
  const [newAreaInput, setNewAreaInput] = useState("");

  const [successToast, setSuccessToast] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 3500);
  };

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [authRes, usersRes, settingsRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/users"),
        fetch("/api/settings"),
      ]);

      const authData = await authRes.json();
      setAuthContext(authData);

      if (authData?.restaurant) {
        setBusinessName(authData.restaurant.businessName || "");
        setContactName(authData.restaurant.contactName || "");
        setPhone(authData.restaurant.phone || "");
        setAddress(authData.restaurant.address || "");
        setTimezone(authData.restaurant.timezone || "Asia/Kolkata");
        setCurrency(authData.restaurant.currency || "INR");
        setShiftsEnabled(authData.restaurant.shiftsEnabled || false);
        if (authData.restaurant.shiftNames) setShiftNames(authData.restaurant.shiftNames);
        if (authData.restaurant.responsibleAreas) setResponsibleAreas(authData.restaurant.responsibleAreas);
      }

      const usersData = await usersRes.json();
      if (usersData?.users) setUsersList(usersData.users);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRestaurantDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          contactName,
          phone,
          address,
          timezone,
          currency,
          shiftsEnabled,
          shiftNames,
          responsibleAreas,
        }),
      });
      if (res.ok) {
        showToast("Restaurant details updated successfully");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserModalError("");
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
          canManageChecklists: newUserRole === "admin" ? true : newUserCanManageSop,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setUserModalError(data.error || "Failed to add user");
        return;
      }

      showToast("Team member added successfully");
      setIsAddUserModalOpen(false);
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole("staff");
      setNewUserCanManageSop(false);
      fetchInitialData();
    } catch (err: any) {
      setUserModalError(err.message || "Failed to create user");
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setEditUserModalError("");

    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editUserName,
          email: editUserEmail,
          role: editUserRole,
          status: editUserStatus,
          canManageChecklists: editUserRole === "admin" ? true : editUserCanManageSop,
          password: editUserNewPassword || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setEditUserModalError(data.error || "Failed to update user");
        return;
      }

      showToast("User details & permissions updated successfully");
      setIsEditUserModalOpen(false);
      fetchInitialData();
    } catch (e: any) {
      setEditUserModalError(e.message || "Failed to update user");
    }
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Remove Team Member",
      message: `Are you sure you want to permanently remove ${userName} from your restaurant workspace?`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
          const data = await res.json();
          if (!res.ok) {
            showToast(data.error || "Failed to remove user");
            return;
          }
          showToast(`${userName} was removed successfully`);
          fetchInitialData();
        } catch (e) {
          console.error(e);
        } finally {
          setConfirmDialog({ isOpen: false, title: "", message: "", onConfirm: () => {} });
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-700 mb-2" />
        <span className="text-xs font-semibold text-slate-600">Loading Account Details...</span>
      </div>
    );
  }

  const isAdmin = authContext?.user?.role === "admin";

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Toast */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl animate-in zoom-in-95 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">{confirmDialog.title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{confirmDialog.message}</p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog({ isOpen: false, title: "", message: "", onConfirm: () => {} })}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. TOP HEADER & CUSTOM BACK BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Link
              href="/app"
              className="p-2 rounded-xl bg-white border border-[#bed6c2] hover:bg-emerald-50 text-slate-700 shadow-xs transition group flex items-center justify-center shrink-0"
              title="Back to Operations Hub"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
            </Link>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Account & Team Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-300">
              {isAdmin ? "Admin Access" : "Staff View"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Manage your restaurant workspace, team members, login credentials, SOP permissions, and operational settings.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 bg-white/80 p-1.5 rounded-2xl border border-[#bed6c2] self-start sm:self-auto shadow-xs">
          <button
            onClick={() => {
              setActiveTab("users");
              router.replace("/app/account?tab=users");
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              activeTab === "users"
                ? "bg-emerald-700 text-white shadow-sm font-extrabold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Team & Permissions</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("restaurant");
              router.replace("/app/account?tab=restaurant");
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              activeTab === "restaurant"
                ? "bg-emerald-700 text-white shadow-sm font-extrabold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Restaurant Profile</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("operations");
              router.replace("/app/account?tab=operations");
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              activeTab === "operations"
                ? "bg-emerald-700 text-white shadow-sm font-extrabold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Operational Config</span>
          </button>
        </div>
      </div>

      {/* 2. TAB: TEAM USERS & PERMISSIONS */}
      {activeTab === "users" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Restaurant Team Members</h2>
              <p className="text-xs text-slate-500">
                Staff can fill daily checklists & log wastage. Admins have full control to edit credentials and delete accounts.
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={() => {
                  setUserModalError("");
                  setIsAddUserModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 flex items-center gap-2 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Team Member</span>
              </button>
            )}
          </div>

          <div className="bg-white rounded-3xl border border-[#bed6c2] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-5">Name & Email</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">SOP Template Editor</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Last Active</th>
                    {isAdmin && <th className="py-3.5 px-4 text-right">Admin Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersList.map((user) => {
                    const isSelf = user.id === authContext?.user?.id;
                    const canEditTemplates = user.role === "admin" || user.canManageChecklists;

                    return (
                      <tr key={user.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-900 font-bold flex items-center justify-center text-xs">
                              {user.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block text-sm">
                                {user.name} {isSelf && <span className="text-[10px] text-emerald-700 font-extrabold">(You)</span>}
                              </span>
                              <span className="text-slate-500 text-xs flex items-center gap-1">
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span>{user.email}</span>
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                              user.role === "admin"
                                ? "bg-emerald-50 text-emerald-900 border border-emerald-300"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            <Shield className="w-3 h-3" />
                            <span className="capitalize">{user.role}</span>
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {canEditTemplates ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Can create & edit SOPs</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                              <Lock className="w-3.5 h-3.5 text-slate-400" />
                              <span>Daily fill only</span>
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-block w-2 h-2 rounded-full mr-2 ${
                              user.status === "active" ? "bg-emerald-500" : "bg-slate-300"
                            }`}
                          />
                          <span className="font-semibold capitalize text-slate-700">{user.status}</span>
                        </td>
                        <td className="py-4 px-4 text-slate-400">
                          {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString("en-IN") : "Never"}
                        </td>
                        {isAdmin && (
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setEditUserName(user.name);
                                  setEditUserEmail(user.email);
                                  setEditUserRole(user.role);
                                  setEditUserStatus(user.status);
                                  setEditUserCanManageSop(user.canManageChecklists || false);
                                  setEditUserNewPassword("");
                                  setEditUserModalError("");
                                  setIsEditUserModalOpen(true);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                                title="Edit user details, email & password"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                              {!isSelf && (
                                <button
                                  onClick={() => handleDeleteUser(user.id, user.name)}
                                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer"
                                  title="Delete user"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. TAB: RESTAURANT PROFILE DETAILS */}
      {activeTab === "restaurant" && (
        <form onSubmit={handleSaveRestaurantDetails} className="bg-white rounded-3xl border border-[#bed6c2] p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Restaurant & Outlet Information</h2>
            <p className="text-xs text-slate-500">Core business info that displays on reports and daily checklists.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Business / Restaurant Name
              </label>
              <input
                type="text"
                required
                disabled={!isAdmin}
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Primary Contact Person
              </label>
              <input
                type="text"
                required
                disabled={!isAdmin}
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Phone Number
              </label>
              <input
                type="text"
                required
                disabled={!isAdmin}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Timezone
              </label>
              <select
                disabled={!isAdmin}
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold focus:border-emerald-500 focus:outline-hidden bg-white"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST +4:00)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="America/New_York">America/New_York (EST/EDT)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Physical Address
              </label>
              <textarea
                rows={2}
                disabled={!isAdmin}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {isAdmin && (
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 flex items-center gap-2 cursor-pointer transition"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Restaurant Details</span>
              </button>
            </div>
          )}
        </form>
      )}

      {/* 4. TAB: OPERATIONAL CONFIG */}
      {activeTab === "operations" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-[#bed6c2] p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Operational Shifts & Work Areas</h2>
              <p className="text-xs text-slate-500">Configure shifts and stations across your restaurant operations.</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="font-bold text-sm text-slate-900 block">Enable Shift Tracking</span>
                  <span className="text-xs text-slate-500">Tag daily wastage and checklist records by shift</span>
                </div>
                <input
                  type="checkbox"
                  disabled={!isAdmin}
                  checked={shiftsEnabled}
                  onChange={(e) => setShiftsEnabled(e.target.checked)}
                  className="w-5 h-5 rounded text-emerald-700 focus:ring-emerald-600 cursor-pointer"
                />
              </div>

              {shiftsEnabled && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Shift Names
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {shiftNames.map((s, idx) => (
                      <span key={idx} className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold flex items-center gap-2">
                        {s}
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => setShiftNames(shiftNames.filter((_, i) => i !== idx))}
                            className="text-slate-400 hover:text-rose-600"
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2 max-w-sm">
                      <input
                        type="text"
                        placeholder="Add shift name (e.g. Afternoon)"
                        value={newShiftInput}
                        onChange={(e) => setNewShiftInput(e.target.value)}
                        className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newShiftInput.trim()) {
                            setShiftNames([...shiftNames, newShiftInput.trim()]);
                            setNewShiftInput("");
                          }
                        }}
                        className="px-3.5 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold"
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Responsible Work Areas & Stations
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {responsibleAreas.map((area, idx) => (
                    <span key={idx} className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold flex items-center gap-2">
                      {area}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => setResponsibleAreas(responsibleAreas.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                {isAdmin && (
                  <div className="flex gap-2 max-w-sm">
                    <input
                      type="text"
                      placeholder="Add station / area (e.g. Pastry Line)"
                      value={newAreaInput}
                      onChange={(e) => setNewAreaInput(e.target.value)}
                      className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newAreaInput.trim()) {
                          setResponsibleAreas([...responsibleAreas, newAreaInput.trim()]);
                          setNewAreaInput("");
                        }
                      }}
                      className="px-3.5 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            </div>

            {isAdmin && (
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveRestaurantDetails}
                  disabled={saving}
                  className="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 flex items-center gap-2 cursor-pointer transition"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Operational Settings</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Add User */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Add New Team Member</h3>
            <p className="text-xs text-slate-500 mb-5">Create a login for a manager, chef, barista, or line cook.</p>

            {userModalError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{userModalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Email Address (Login)
                </label>
                <input
                  type="email"
                  required
                  placeholder="rahul@restaurant.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Role
                </label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-semibold bg-white"
                >
                  <option value="staff">Staff (Operational User)</option>
                  <option value="admin">Admin (Full Workspace Manager)</option>
                </select>
              </div>

              {newUserRole === "staff" && (
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-emerald-950 block">SOP / Checklist Template Editor</span>
                    <span className="text-[11px] text-emerald-700">Allow this staff user to create and edit SOP templates</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={newUserCanManageSop}
                    onChange={(e) => setNewUserCanManageSop(e.target.checked)}
                    className="w-5 h-5 rounded text-emerald-700 focus:ring-emerald-600 cursor-pointer"
                  />
                </div>
              )}

              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit User (Full Control Over Name, Email, Password, Role, Status) */}
      {isEditUserModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Edit User: {selectedUser.name}</h3>
            <p className="text-xs text-slate-500 mb-5">Update login credentials, permissions, or account status.</p>

            {editUserModalError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editUserModalError}</span>
              </div>
            )}

            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editUserName}
                  onChange={(e) => setEditUserName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Email Address (Login Username)
                </label>
                <input
                  type="email"
                  required
                  value={editUserEmail}
                  onChange={(e) => setEditUserEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Account Status
                </label>
                <select
                  value={editUserStatus}
                  onChange={(e) => setEditUserStatus(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-semibold bg-white"
                >
                  <option value="active">Active (Access Enabled)</option>
                  <option value="inactive">Inactive (Access Blocked)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Role
                </label>
                <select
                  value={editUserRole}
                  onChange={(e) => setEditUserRole(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-semibold bg-white"
                >
                  <option value="staff">Staff (Operational User)</option>
                  <option value="admin">Admin (Full Workspace Manager)</option>
                </select>
              </div>

              {editUserRole === "staff" && (
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-emerald-950 block">SOP / Checklist Template Editor</span>
                    <span className="text-[11px] text-emerald-700">Allow this staff user to create and edit SOP templates</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={editUserCanManageSop}
                    onChange={(e) => setEditUserCanManageSop(e.target.checked)}
                    className="w-5 h-5 rounded text-emerald-700 focus:ring-emerald-600 cursor-pointer"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Reset Password (Leave empty to keep current)
                </label>
                <input
                  type="password"
                  placeholder="Enter new password (min. 6 characters)"
                  value={editUserNewPassword}
                  onChange={(e) => setEditUserNewPassword(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditUserModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AccountManagementPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-700 mb-2" />
          <span className="text-xs font-semibold text-slate-600">Loading Account Details...</span>
        </div>
      }
    >
      <AccountManagementContent />
    </Suspense>
  );
}
