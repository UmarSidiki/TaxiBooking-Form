export type DashboardBookingStatus = "completed" | "upcoming" | "canceled";

export type DashboardRecentBooking = {
  id: string;
  customer: string;
  date: string;
  status: DashboardBookingStatus;
  amount: number;
};

export type DashboardDestination = {
  name: string;
  count: number;
  percentage: number;
};

export type DashboardStats = {
  totalBookings: number;
  completedBookings: number;
  upcomingBookings: number;
  canceledBookings: number;
  totalRevenue: number;
  monthlyRevenue: number;
  monthlyChange: number;
  monthlyBookings: number;
  monthlyBookingsChange: number;
  recentBookings?: DashboardRecentBooking[];
  topDestinations?: DashboardDestination[];
};
