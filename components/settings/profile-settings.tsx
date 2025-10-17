"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Save, AlertCircle, CheckCircle, User, Mail, Phone, Calendar, MapPin, Shield, Edit3 } from "lucide-react"
import { userService, UserProfile } from "@/services/user.service"
import { Badge } from "@/components/ui/badge"

export default function ProfileSettings() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const { toast } = useToast()

  const maskPAN = (pan: string): string => {
    if (!pan || pan === "Not provided" || pan.length < 3) return pan
    return pan.charAt(0) + 'X'.repeat(pan.length - 2) + pan.charAt(pan.length - 1)
  }

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      try {
        const data = await userService.getProfile()
        setProfile(data)
      } catch (error) {
        console.error("Failed to fetch profile:", error)
        toast({
          title: "Error",
          description: "Failed to load profile information. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfile((prev) => ({
      ...prev!,
      [name]: value,
    }))
  }

  const getDateOfBirth = () => {
    if (!profile?.dateOfBirth) return ""
    const date = new Date(profile.dateOfBirth)
    return date.toISOString().split('T')[0]
  }

  const handleSave = async () => {
    if (!profile) return
    
    setSaving(true)
    try {
      const updatedProfile = await userService.updateProfile({
        fullName: profile.fullName,
        phone: profile.phone,
        dateOfBirth: getDateOfBirth(),
        state: profile.state,
      })
      
      setProfile(updatedProfile)
      setIsEditing(false)
      
      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated successfully.",
      })
    } catch (error) {
      console.error("Failed to update profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile information. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="p-4 bg-indigo-50 rounded-full mb-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
        <p className="text-gray-600 font-medium">Loading profile information...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-1">Manage your personal information and account details</p>
        </div>
        <Button
          variant={isEditing ? "outline" : "default"}
          onClick={() => setIsEditing(!isEditing)}
          className={`flex items-center gap-2 ${isEditing ? 'border-gray-300 hover:bg-gray-50' : 'bg-indigo-600 hover:bg-indigo-700'}`}
        >
          <Edit3 className="w-4 h-4" />
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </Button>
      </div>
        
      {/* Profile Completion Status */}
      <div className="mb-6">
        <div className={`p-4 rounded-xl border-2 ${profile?.profileComplete ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
          <div className="flex items-center gap-3">
            {profile?.profileComplete ? (
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            ) : (
              <div className="p-2 bg-orange-100 rounded-full">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">
                Profile {profile?.profileComplete ? 'Complete' : 'Incomplete'}
              </h3>
              {!profile?.profileComplete && profile?.missingFields && profile.missingFields.length > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  Missing: {profile.missingFields.join(', ')}
                </p>
              )}
            </div>
            <Badge variant={profile?.profileComplete ? 'default' : 'secondary'} className={`${profile?.profileComplete ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
              {profile?.profileComplete ? 'Complete' : 'Incomplete'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/3">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="h-28 w-28 rounded-2xl overflow-hidden border-4 border-white shadow-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">
                    {profile?.fullName?.charAt(0) || profile?.username?.charAt(0) || "U"}
                  </span>
                </div>
                <div className="absolute -bottom-2 -right-2 p-2 bg-white rounded-full shadow-lg border-2 border-indigo-100">
                  <User className="w-4 h-4 text-indigo-600" />
                </div>
              </div>
              <div className="space-y-3 w-full">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{profile?.fullName}</h3>
                  <p className="text-sm text-gray-600">@{profile?.username}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{profile?.email}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>Member since {new Date(profile?.createdAt || '').toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  <Badge variant={profile?.emailVerified ? 'default' : 'secondary'} className="text-xs bg-green-100 text-green-800">
                    <Mail className="w-3 h-3 mr-1" />
                    Email Verified
                  </Badge>
                  {profile?.panVerified && (
                    <Badge className="text-xs bg-blue-100 text-blue-800">
                      <Shield className="w-3 h-3 mr-1" />
                      PAN Verified
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:w-2/3 space-y-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-100 rounded-xl">
                <User className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name *
                </Label>
                <Input 
                  id="fullName" 
                  name="fullName" 
                  value={profile?.fullName || ""} 
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`h-11 ${profile?.missingFields?.includes('fullName') ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'} ${!isEditing ? 'bg-gray-50' : 'bg-white'} rounded-xl`}
                />
                {profile?.missingFields?.includes('fullName') && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Full name is required
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={profile?.email || ""}
                  disabled
                  className="bg-gray-50 border-gray-200 h-11 rounded-xl"
                />
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Email cannot be changed
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-100 rounded-xl">
                <Phone className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Contact Details</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number *
                </Label>
                <Input 
                  id="phone" 
                  name="phone" 
                  value={profile?.phone || ""} 
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  disabled={!isEditing}
                  className={`h-11 ${profile?.missingFields?.includes('phone') ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'} ${!isEditing ? 'bg-gray-50' : 'bg-white'} rounded-xl`}
                />
                {profile?.missingFields?.includes('phone') && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Phone number is required
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date of Birth *
                </Label>
                <Input 
                  id="dateOfBirth" 
                  name="dateOfBirth" 
                  type="date"
                  value={getDateOfBirth()} 
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`h-11 ${profile?.missingFields?.includes('dateOfBirth') ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'} ${!isEditing ? 'bg-gray-50' : 'bg-white'} rounded-xl`}
                />
                {profile?.missingFields?.includes('dateOfBirth') && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Date of birth is required
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-xl">
                <MapPin className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="state" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  State
                </Label>
                <Input 
                  id="state" 
                  name="state" 
                  value={profile?.state || ""} 
                  onChange={handleChange}
                  placeholder="Select your state"
                  disabled={!isEditing}
                  className={`h-11 border-gray-200 focus:border-indigo-500 ${!isEditing ? 'bg-gray-50' : 'bg-white'} rounded-xl`}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Username
                  </Label>
                  <Input
                    id="username"
                    name="username"
                    value={profile?.username || ""}
                    disabled
                    className="bg-gray-50 border-gray-200 h-11 rounded-xl"
                  />
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Username cannot be changed
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pandetails" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    PAN Details
                  </Label>
                  <div className="relative">
                    <Input 
                      id="pandetails" 
                      name="pandetails" 
                      value={maskPAN(profile?.pandetails || "Not provided")} 
                      disabled
                      className="bg-gray-50 border-gray-200 h-11 rounded-xl pr-20"
                    />
                    {profile?.panVerified && (
                      <Badge className="absolute right-2 top-2 text-xs bg-green-100 text-green-800 border-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    PAN cannot be changed
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gray-200 rounded-xl">
                <Shield className="w-5 h-5 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-xl border border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-2">Provider</p>
                <p className="text-sm text-gray-900 font-medium capitalize">{profile?.provider}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-2">Account Created</p>
                <p className="text-sm text-gray-900 font-medium">{new Date(profile?.createdAt || '').toLocaleDateString()}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-2">Last Updated</p>
                <p className="text-sm text-gray-900 font-medium">{new Date(profile?.updatedAt || '').toLocaleDateString()}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-3">Verification Status</p>
                <div className="flex flex-wrap gap-2">
                  <Badge className={`text-xs ${profile?.emailVerified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    <Mail className="w-3 h-3 mr-1" />
                    Email {profile?.emailVerified ? 'Verified' : 'Pending'}
                  </Badge>
                  <Badge className={`text-xs ${profile?.panVerified ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                    <Shield className="w-3 h-3 mr-1" />
                    PAN {profile?.panVerified ? 'Verified' : 'Pending'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                  className="w-full sm:w-auto border-gray-300 hover:bg-gray-50 h-11 rounded-xl"
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-11 rounded-xl shadow-lg">
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}