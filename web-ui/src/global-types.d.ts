declare global {
  interface BloodBankDto { bloodBankId: number; bankName: string; district: string; }
  interface AuthResponseDto { token: string; user: Record<string, unknown>; }
  interface BankDashboardDto { totalUnits: number; incomingTransfers: number; pendingRequests: number; expiringSoon: number; lowStockGroups: string[]; }
  interface BloodUnitDto { bloodUnitId: number; unitCode: string; bloodGroup: string; collectionDate: string; expiryDate: string; status: string; storageLocation: string; }
  interface DonationTransferDto { transferId: number; transferCode: string; status: string; createdAt: string; dispatchedAt: string; receivedAt: string; receivedUnitCount: number; campTitle: string; committeeName: string; }
  interface HospitalRequestDto { requestId: number; requestCode: string; hospitalName: string; bloodGroup: string; unitsRequired: number; unitsAllocated: number; unitsFulfilled: number; neededBy: string; priority: string; status: string; }
  interface BankStaffDto { staffId: number; fullName: string; positionTitle: string; phone: string; email: string; assignedFrom: string; status: string; }
  interface CommitteeDashboardDto { totalCamps: number; upcomingCamps: number; totalDonations: number; activeTransfers: number; totalRegistrations: number; activeVenues: number; pendingTransfers: number; activeCamps: number; }
  interface VenueDto { venueId: number; venueName: string; address: string; district: string; contactPerson: string; contactPhone: string; hasParking: boolean; isActive: boolean; status: string; capacity: number; }
  interface DonationCampDto { campId: number; campTitle: string; campDescription: string; campDate: string; startTime: string; endTime: string; capacity: number; status: string; publicVisible: string; committeeId: number; venueId: number; venueName: string; isEligible: boolean; reason: string; }
  interface CampDto { donorId?: number;  campId: number; campTitle: string; campDescription: string; campDate: string; startTime: string; endTime: string; capacity: number; status: string; publicVisible: string; venueId: number; venueName: string; venueAddress: string; registrationId: number; fullName: string; nic: string; bloodGroup: string; hasDonated: boolean; attendanceStatus: string; registrationStatus: string; }
  interface CommitteeStaffDto { staffId: number; fullName: string; roleInCommittee: string; phone: string; email: string; assignedFrom: string; status: string; positionTitle: string; }
  interface DonorDashboardDto { totalDonations: number; upcomingCamps: number; lastDonationDate: string; isEligible: boolean; eligibilityReason: string; nextEligibleDate: string; }
  interface DonorDonationDto { donationId: number; donationDate: string; bloodGroup: string; unitsCollected: number; status: string; campId: number; campTitle: string; venueName: string; }
  interface DonorProfileDto { donorId: number; fullName: string; nic: string; dateOfBirth: string; gender: string; bloodGroup: string; phone: string; email: string; address: string; status: string; }
  interface DonorStatusHistoryDto { eventType: string; eventDate: string; eventTitle: string; status: string; details: string; }
  interface WebmasterDashboardDto { totalUsers: number; totalDonors: number; totalCamps: number; activeAppeals: number; }
  interface TopRatedCampDto { campId: number; averageRating: number; reviewCount: number; }
  interface SystemStatsDto { totalDonations: number; activeCamps: number; registeredDonors: number; livesSaved: number; }
  interface AwarenessMaterial { id: string; title: string; content: string; published: boolean; campId: number; }
  interface PromotionalMedia { id: string; title: string; mediaUrl: string; isActive: boolean; }
  interface MedicalGuideline { id: string; title: string; content: string; category: string; }
  interface EmergencyAppealDto { id: string; appealId: number; patientReference: string; bloodGroup: string; unitsRequired: number; urgency: string; location: string; neededBy: string; summary: string; patientName: string; hospitalName: string; contactPhone: string; urgencyLevel: string; }
  interface EmergencyBroadcast { id: string; message: string; severity: string; active: boolean; }
  interface NotificationDto { id: number; notificationId: number; title: string; message: string; isRead: boolean; createdAt: string; }
  interface ResourceDto { id?: string | number; description?: string; content?: string; targetAudience?: string; ruleType?: string; downloadUrl?: string; imageUrl?: string;  title: string; url: string; }
  interface CampFeedbackDto { feedbackId?: number; donorName?: string; createdAt?: string;  id: number; campId: number; donorId: number; rating: number; comment: string; submittedAt: string; isPublic: boolean; }
}
export {};

