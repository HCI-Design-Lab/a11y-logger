'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CoverSheetData {
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

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="space-y-0.5">
      <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}

export function VpatCoverSheetView({ vpatId }: { vpatId: string }) {
  const [data, setData] = useState<CoverSheetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/vpats/${vpatId}/cover-sheet`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) setData(json.data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [vpatId]);

  if (isLoading) return <p className="text-sm text-muted-foreground py-4">Loading…</p>;

  if (!data) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No cover sheet information has been added yet.
      </p>
    );
  }

  const hasProduct = data.product_name || data.product_version || data.product_description;
  const hasVendor =
    data.vendor_company ||
    data.vendor_contact_name ||
    data.vendor_contact_email ||
    data.vendor_contact_phone ||
    data.vendor_website;
  const hasReport = data.report_date || data.evaluation_methods || data.notes;

  if (!hasProduct && !hasVendor && !hasReport) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No cover sheet information has been added yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {hasProduct && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Product Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Product Name" value={data.product_name} />
              <Field label="Version" value={data.product_version} />
              {data.product_description && (
                <div className="space-y-0.5 sm:col-span-2">
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Description
                  </dt>
                  <dd className="text-sm whitespace-pre-wrap">{data.product_description}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {hasVendor && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Vendor / Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Company" value={data.vendor_company} />
              <Field label="Contact" value={data.vendor_contact_name} />
              <Field label="Email" value={data.vendor_contact_email} />
              <Field label="Phone" value={data.vendor_contact_phone} />
              {data.vendor_website && (
                <div className="space-y-0.5 sm:col-span-2">
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Website
                  </dt>
                  <dd className="text-sm">
                    <a
                      href={data.vendor_website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {data.vendor_website}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {hasReport && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Report Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Report Date" value={data.report_date} />
              {data.evaluation_methods && (
                <div className="space-y-0.5 sm:col-span-2">
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Evaluation Methods
                  </dt>
                  <dd className="text-sm whitespace-pre-wrap">{data.evaluation_methods}</dd>
                </div>
              )}
              {data.notes && (
                <div className="space-y-0.5 sm:col-span-2">
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Notes
                  </dt>
                  <dd className="text-sm whitespace-pre-wrap">{data.notes}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
