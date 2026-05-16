import React, { useState, useEffect } from 'react';
import { useRecordVersion } from './RecordLockManager';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { History, Eye, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';

export default function VersionHistory({ entityName, recordId, onRestore }) {
  const { getVersions } = useRecordVersion();
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open && recordId) {
      loadVersions();
    }
  }, [open, recordId]);

  const loadVersions = async () => {
    setLoading(true);
    const data = await getVersions(entityName, recordId);
    setVersions(data);
    setLoading(false);
  };

  const handleRestore = (version) => {
    if (window.confirm(`Restore to version ${version.version_number}? This will overwrite current data.`)) {
      onRestore(version.record_data);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="w-4 h-4 mr-2" />
          Version History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Version History - {entityName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-gray-500">Loading versions...</div>
        ) : versions.length === 0 ? (
          <div className="py-8 text-center text-gray-500">No version history available</div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Changed By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {versions.map((version) => (
                  <TableRow key={version.id}>
                    <TableCell className="font-semibold">v{version.version_number}</TableCell>
                    <TableCell>{version.changed_by_user_name}</TableCell>
                    <TableCell>{format(new Date(version.timestamp), 'MMM d, yyyy h:mm a')}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {version.change_description || 'No description'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedVersion(version)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRestore(version)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {selectedVersion && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-3">Version {selectedVersion.version_number} Data:</h3>
                  <pre className="bg-gray-50 p-4 rounded text-xs overflow-auto max-h-96">
                    {JSON.stringify(selectedVersion.record_data, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}