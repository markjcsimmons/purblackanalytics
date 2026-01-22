'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tag, Loader2, CheckCircle } from 'lucide-react';

interface PromotionEntryFormProps {
  weekId?: number;
  onSuccess?: () => void;
}

export function PromotionEntryForm({ weekId, onSuccess }: PromotionEntryFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    offer: '',
    startDate: '',
    endDate: '',
    grossSales: '',
    netSales: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    // Validation
    if (!formData.name || !formData.offer || !formData.startDate || !formData.endDate) {
      setError('Please fill in all required fields (Name, Offer, Start Date, End Date)');
      setIsSubmitting(false);
      return;
    }

    // Validate dates
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    if (endDate < startDate) {
      setError('End date must be after start date');
      setIsSubmitting(false);
      return;
    }

    // Validate sales numbers
    const grossSales = formData.grossSales ? parseFloat(formData.grossSales) : null;
    const netSales = formData.netSales ? parseFloat(formData.netSales) : null;
    
    if (grossSales !== null && isNaN(grossSales)) {
      setError('Gross sales must be a valid number');
      setIsSubmitting(false);
      return;
    }
    
    if (netSales !== null && isNaN(netSales)) {
      setError('Net sales must be a valid number');
      setIsSubmitting(false);
      return;
    }

    if (grossSales !== null && netSales !== null && netSales > grossSales) {
      setError('Net sales cannot be greater than gross sales');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/promotions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weekId: weekId || null,
          name: formData.name,
          offer: formData.offer,
          startDate: formData.startDate,
          endDate: formData.endDate,
          grossSales: grossSales,
          netSales: netSales,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save promotion data');
      }

      // Reset form
      setFormData({
        name: '',
        offer: '',
        startDate: '',
        endDate: '',
        grossSales: '',
        netSales: '',
      });
      setSuccess(true);
      
      if (onSuccess) {
        onSuccess();
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save promotion data');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-2 border-green-100">
      <CardHeader className="bg-gradient-to-r from-green-50 to-green-100/50 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500 rounded-lg">
            <Tag className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl">Add Promotion Data</CardTitle>
            <CardDescription>Enter promotion details for the current week</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Promotion Name *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., New Year Sale"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="offer">Offer *</Label>
              <Input
                id="offer"
                name="offer"
                type="text"
                value={formData.offer}
                onChange={handleChange}
                placeholder="e.g., 20% off, Buy 2 Get 1 Free"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="grossSales">Gross Sales ($)</Label>
              <Input
                id="grossSales"
                name="grossSales"
                type="number"
                step="0.01"
                min="0"
                value={formData.grossSales}
                onChange={handleChange}
                placeholder="0.00"
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">Total sales before discounts</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="netSales">Net Sales ($)</Label>
              <Input
                id="netSales"
                name="netSales"
                type="number"
                step="0.01"
                min="0"
                value={formData.netSales}
                onChange={handleChange}
                placeholder="0.00"
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">Sales after discounts</p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-800 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Promotion data saved successfully!
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Tag className="h-4 w-4 mr-2" />
                Save Promotion Data
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
