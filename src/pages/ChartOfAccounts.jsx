import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Book, Pencil, Trash2 } from "lucide-react";
import AccountForm from "../components/accounts/AccountForm";
import { useCompany } from "../components/auth/CompanyContext";

const categoryColors = {
  current_asset: "bg-blue-100 text-blue-800",
  fixed_asset: "bg-indigo-100 text-indigo-800",
  current_liability: "bg-red-100 text-red-800",
  long_term_liability: "bg-orange-100 text-orange-800",
  equity: "bg-purple-100 text-purple-800",
  operating_revenue: "bg-green-100 text-green-800",
  other_revenue: "bg-emerald-100 text-emerald-800",
  operating_expense: "bg-yellow-100 text-yellow-800",
  other_expense: "bg-amber-100 text-amber-800",
  cost_of_sales: "bg-pink-100 text-pink-800"
};

export default function ChartOfAccounts() {
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);

  const queryClient = useQueryClient();
  const { currentCompany } = useCompany();

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['accounts', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Account.filter({ company_id: currentCompany.id }, 'account_code') : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Account.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['accounts', currentCompany?.id]);
      setDeleteDialogOpen(false);
      setAccountToDelete(null);
    }
  });

  const filteredAccounts = accounts.filter(account =>
    account.account_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.account_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (account) => {
    setEditingAccount(account);
    setShowForm(true);
  };

  const handleDelete = (account) => {
    setAccountToDelete(account);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (accountToDelete) {
      deleteMutation.mutate(accountToDelete.id);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingAccount(null);
  };

  const groupedAccounts = filteredAccounts.reduce((groups, account) => {
    const type = account.account_type;
    if (!groups[type]) groups[type] = [];
    groups[type].push(account);
    return groups;
  }, {});

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Chart of Accounts</h1>
          <p className="text-gray-500 mt-1">Manage your account structure</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Account
        </Button>
      </div>

      {showForm && (
        <AccountForm
          account={editingAccount}
          onClose={handleFormClose}
        />
      )}

      <Card className="p-6">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    Loading accounts...
                  </TableCell>
                </TableRow>
              ) : Object.keys(groupedAccounts).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Book className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No accounts found</p>
                  </TableCell>
                </TableRow>
              ) : (
                Object.entries(groupedAccounts).map(([type, accts]) => (
                  <React.Fragment key={type}>
                    <TableRow className="bg-gray-50">
                      <TableCell colSpan={7} className="font-bold text-gray-700 uppercase text-sm">
                        {type.replace(/_/g, ' ')}
                      </TableCell>
                    </TableRow>
                    {accts.map((account) => (
                      <TableRow key={account.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{account.account_code}</TableCell>
                        <TableCell>{account.account_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {account.account_type?.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={categoryColors[account.account_category]}>
                            {account.account_category?.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          ${account.balance?.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge className={account.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                            {account.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(account)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(account)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete account "{accountToDelete?.account_name}"? 
              This action cannot be undone and may affect your financial reports.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}