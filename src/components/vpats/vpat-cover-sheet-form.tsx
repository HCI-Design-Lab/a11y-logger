'use client';

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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

export interface VpatCoverSheetFormHandle {
  save: () => Promise<void>;
}

interface VpatCoverSheetFormProps {
  vpatId: string;
  readOnly?: boolean;
}

export const VpatCoverSheetForm = forwardRef<VpatCoverSheetFormHandle, VpatCoverSheetFormProps>(
  function VpatCoverSheetForm({ vpatId, readOnly = false }, ref) {
    const t = useTranslations('vpats.cover_sheet');
    const tToast = useTranslations('vpats.cover_sheet_toast');
    const [fields, setFields] = useState<CoverSheetFields>({});
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

    useImperativeHandle(ref, () => ({
      async save() {
        try {
          const res = await fetch(`/api/vpats/${vpatId}/cover-sheet`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fields),
          });
          const json = await res.json();
          if (!json.success) {
            toast.error(json.error ?? tToast('save_failed'));
          }
        } catch {
          toast.error(tToast('save_failed'));
        }
      },
    }));

    function handleChange(key: keyof CoverSheetFields, value: string) {
      setFields((prev) => ({ ...prev, [key]: value }));
    }

    if (isLoading) {
      return <p className="text-sm text-muted-foreground py-4">{t('loading')}</p>;
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('product_info_title')}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="product_name">{t('product_name_label')}</Label>
              <Input
                id="product_name"
                value={fields.product_name ?? ''}
                onChange={(e) => handleChange('product_name', e.target.value)}
                readOnly={readOnly}
                placeholder={t('product_name_placeholder')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="product_version">{t('product_version_label')}</Label>
              <Input
                id="product_version"
                value={fields.product_version ?? ''}
                onChange={(e) => handleChange('product_version', e.target.value)}
                readOnly={readOnly}
                placeholder={t('product_version_placeholder')}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="product_description">{t('product_description_label')}</Label>
              <Textarea
                id="product_description"
                value={fields.product_description ?? ''}
                onChange={(e) => handleChange('product_description', e.target.value)}
                readOnly={readOnly}
                rows={3}
                placeholder={t('product_description_placeholder')}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('vendor_info_title')}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="vendor_company">{t('vendor_company_label')}</Label>
              <Input
                id="vendor_company"
                value={fields.vendor_company ?? ''}
                onChange={(e) => handleChange('vendor_company', e.target.value)}
                readOnly={readOnly}
                placeholder={t('vendor_company_placeholder')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vendor_contact_name">{t('vendor_contact_name_label')}</Label>
              <Input
                id="vendor_contact_name"
                value={fields.vendor_contact_name ?? ''}
                onChange={(e) => handleChange('vendor_contact_name', e.target.value)}
                readOnly={readOnly}
                placeholder={t('vendor_contact_name_placeholder')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vendor_contact_email">{t('vendor_contact_email_label')}</Label>
              <Input
                id="vendor_contact_email"
                type="email"
                value={fields.vendor_contact_email ?? ''}
                onChange={(e) => handleChange('vendor_contact_email', e.target.value)}
                readOnly={readOnly}
                placeholder={t('vendor_contact_email_placeholder')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vendor_contact_phone">{t('vendor_contact_phone_label')}</Label>
              <Input
                id="vendor_contact_phone"
                type="tel"
                value={fields.vendor_contact_phone ?? ''}
                onChange={(e) => handleChange('vendor_contact_phone', e.target.value)}
                readOnly={readOnly}
                placeholder={t('vendor_contact_phone_placeholder')}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="vendor_website">{t('vendor_website_label')}</Label>
              <Input
                id="vendor_website"
                type="url"
                value={fields.vendor_website ?? ''}
                onChange={(e) => handleChange('vendor_website', e.target.value)}
                readOnly={readOnly}
                placeholder={t('vendor_website_placeholder')}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('report_details_title')}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="report_date">{t('report_date_label')}</Label>
              <Input
                id="report_date"
                type="date"
                value={fields.report_date ?? ''}
                onChange={(e) => handleChange('report_date', e.target.value)}
                readOnly={readOnly}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="evaluation_methods">{t('evaluation_methods_label')}</Label>
              <Textarea
                id="evaluation_methods"
                value={fields.evaluation_methods ?? ''}
                onChange={(e) => handleChange('evaluation_methods', e.target.value)}
                readOnly={readOnly}
                rows={3}
                placeholder={t('evaluation_methods_placeholder')}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="notes">{t('notes_label')}</Label>
              <Textarea
                id="notes"
                value={fields.notes ?? ''}
                onChange={(e) => handleChange('notes', e.target.value)}
                readOnly={readOnly}
                rows={3}
                placeholder={t('notes_placeholder')}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
);
