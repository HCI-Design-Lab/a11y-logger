'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save } from 'lucide-react';

interface CoverSheetFields {
  product_name?: string | null;
  product_version?: string | null;
  product_description?: string | null;
  vendor_company?: string | null;
  vendor_contact_name?: string | null;
  vendor_contact_email?: string | null;
  vendor_contact_phone?: string | null;
  vendor_website?: string | null;
  report_date?: string | null;
  evaluation_methods?: string | null;
  notes?: string | null;
}

interface VpatCoverSheetFormProps {
  vpatId: string;
  readOnly?: boolean;
}

export function VpatCoverSheetForm({ vpatId, readOnly = false }: VpatCoverSheetFormProps) {
  const [fields, setFields] = useState<CoverSheetFields>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/vpats/${vpatId}/cover-sheet`);
        const json = await res.json();
        if (json.success && json.data) {
          setFields(json.data);
        }
      } catch {
        // non-fatal — form starts empty
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [vpatId]);

  function handleChange(key: keyof CoverSheetFields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/vpats/${vpatId}/cover-sheet`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? 'Failed to save cover sheet');
        return;
      }
      toast.success('Cover sheet saved');
    } catch {
      toast.error('Failed to save cover sheet');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-4">Loading…</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Product Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="product_name">Product Name</Label>
            <Input
              id="product_name"
              value={fields.product_name ?? ''}
              onChange={(e) => handleChange('product_name', e.target.value)}
              readOnly={readOnly}
              placeholder="e.g. My App 2.0"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="product_version">Version</Label>
            <Input
              id="product_version"
              value={fields.product_version ?? ''}
              onChange={(e) => handleChange('product_version', e.target.value)}
              readOnly={readOnly}
              placeholder="e.g. 2.4.1"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="product_description">Product Description</Label>
            <Textarea
              id="product_description"
              value={fields.product_description ?? ''}
              onChange={(e) => handleChange('product_description', e.target.value)}
              readOnly={readOnly}
              rows={3}
              placeholder="Brief description of the product"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vendor / Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="vendor_company">Company</Label>
            <Input
              id="vendor_company"
              value={fields.vendor_company ?? ''}
              onChange={(e) => handleChange('vendor_company', e.target.value)}
              readOnly={readOnly}
              placeholder="e.g. Acme Corp"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vendor_contact_name">Contact Name</Label>
            <Input
              id="vendor_contact_name"
              value={fields.vendor_contact_name ?? ''}
              onChange={(e) => handleChange('vendor_contact_name', e.target.value)}
              readOnly={readOnly}
              placeholder="e.g. Jane Smith"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vendor_contact_email">Contact Email</Label>
            <Input
              id="vendor_contact_email"
              type="email"
              value={fields.vendor_contact_email ?? ''}
              onChange={(e) => handleChange('vendor_contact_email', e.target.value)}
              readOnly={readOnly}
              placeholder="e.g. jane@acme.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vendor_contact_phone">Contact Phone</Label>
            <Input
              id="vendor_contact_phone"
              type="tel"
              value={fields.vendor_contact_phone ?? ''}
              onChange={(e) => handleChange('vendor_contact_phone', e.target.value)}
              readOnly={readOnly}
              placeholder="e.g. +1 555 000 0000"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="vendor_website">Website</Label>
            <Input
              id="vendor_website"
              type="url"
              value={fields.vendor_website ?? ''}
              onChange={(e) => handleChange('vendor_website', e.target.value)}
              readOnly={readOnly}
              placeholder="e.g. https://acme.com"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Report Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="report_date">Report Date</Label>
            <Input
              id="report_date"
              type="date"
              value={fields.report_date ?? ''}
              onChange={(e) => handleChange('report_date', e.target.value)}
              readOnly={readOnly}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="evaluation_methods">Evaluation Methods</Label>
            <Textarea
              id="evaluation_methods"
              value={fields.evaluation_methods ?? ''}
              onChange={(e) => handleChange('evaluation_methods', e.target.value)}
              readOnly={readOnly}
              rows={3}
              placeholder="Describe the testing methods used"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={fields.notes ?? ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              readOnly={readOnly}
              rows={3}
              placeholder="Additional notes"
            />
          </div>
        </CardContent>
      </Card>

      {!readOnly && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving…' : 'Save Cover Sheet'}
          </Button>
        </div>
      )}
    </div>
  );
}
