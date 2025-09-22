export interface Parcel {
  id: string;
  trackingNumber: string;
  title: string;
  description: string;
  status: 'pending' | 'in-transit' | 'delivered' | 'cancelled';
  sender: string;
  recipient: string;
  recipientAddress: string;
  weight: string;
  dimensions: string;
  photos: string[];
  paymentInfo: {
    amount: string;
    method: string;
    status: string;
  };
  createdAt: string;
  updatedAt: string;
  userId: string;
  statusHistory: {
    status: string;
    timestamp: string;
    location: string;
  }[];
}

export interface ParcelStatus {
  status: 'pending' | 'in-transit' | 'delivered' | 'cancelled';
  timestamp: string;
  location: string;
}