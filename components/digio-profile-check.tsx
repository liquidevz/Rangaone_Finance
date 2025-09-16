'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { get, put } from '@/lib/axios';

interface DigioProfileCheckProps {
  onComplete: () => void;
  onCancel?: () => void;
}

export default function DigioProfileCheck({ onComplete, onCancel }: DigioProfileCheckProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    fullName: '',
    dateOfBirth: '',
    phone: '',
    state: '',
    pandetails: ''
  });

  useEffect(() => {
    checkProfile();
  }, []);

  const checkProfile = async () => {
    try {
      const userProfile = await get('/api/user/profile');
      if (!userProfile.digioReady) {
        setProfile({
          fullName: userProfile.fullName || '',
          dateOfBirth: userProfile.dateOfBirth || '',
          phone: userProfile.phone || '',
          state: userProfile.state || '',
          pandetails: userProfile.pandetails || ''
        });
        setOpen(true);
      } else {
        onComplete();
      }
    } catch (error) {
      console.error('Error checking profile:', error);
      setOpen(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await put('/api/user/profile', profile);
      setOpen(false);
      onComplete();
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const states = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
    'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
    'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
    'Uttarakhand', 'West Bengal', 'Delhi'
  ];

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Your Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={profile.fullName}
              onChange={(e) => setProfile(prev => ({ ...prev, fullName: e.target.value }))}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={profile.dateOfBirth}
              onChange={(e) => setProfile(prev => ({ ...prev, dateOfBirth: e.target.value }))}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={profile.phone}
              onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="state">State</Label>
            <Select value={profile.state} onValueChange={(value) => setProfile(prev => ({ ...prev, state: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {states.map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="pandetails">PAN Card</Label>
            <Input
              id="pandetails"
              value={profile.pandetails}
              onChange={(e) => setProfile(prev => ({ ...prev, pandetails: e.target.value.toUpperCase() }))}
              placeholder="ABCDE1234F"
              pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
              required
            />
          </div>
          
          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Updating...' : 'Complete Profile'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}