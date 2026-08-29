export type UserRole = "admin" | "user";
export type UserStatus = "active" | "inactive";

export interface SessionUser {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

export type MeetingStatus = "ONGOING" | "UPCOMING" | "COMPLETED" | "AVAILABLE";

export interface RoomData {
  id: string;
  roomName: string;
  roomNumber: string;
  location: string;
  capacity: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    meetings: number;
  };
}

export interface MeetingData {
  id: string;
  title: string;
  description?: string | null;
  organizer: string;
  organizerId?: string | null;
  roomId: string;
  meetingDate: string; // YYYY-MM-DD
  startTime: string;   // HH:mm
  endTime: string;     // HH:mm
  status?: MeetingStatus;
  createdAt: string;
  updatedAt: string;
  room?: RoomData;
}

export interface LiveRoomStatus {
  room: RoomData;
  currentMeeting: MeetingData | null;
  nextMeeting: MeetingData | null;
  status: MeetingStatus;
  todayMeetings: MeetingData[];
}
