import { collection, addDoc, getDocs, doc, updateDoc, query, where, arrayUnion } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Parcel } from '@/types/parcel';
import uuid from 'react-native-uuid';

export const createParcel = async (parcelData: Omit<Parcel, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const parcel = {
    ...parcelData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  const docRef = await addDoc(collection(db, 'parcels'), parcel);
  return docRef.id;
};

export const getUserParcels = async (userId: string): Promise<Parcel[]> => {
  // Avoid composite index requirement by not ordering in the query; sort client-side instead
  const q = query(
    collection(db, 'parcels'),
    where('userId', '==', userId)
  );

  const querySnapshot = await getDocs(q);
  const parcels = querySnapshot.docs.map(d => ({
    id: d.id,
    ...d.data()
  })) as Parcel[];

  return parcels.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const updateParcelStatus = async (parcelId: string, status: string, location: string) => {
  const parcelRef = doc(db, 'parcels', parcelId);
  const entry = {
    status,
    timestamp: new Date().toISOString(),
    location
  };

  await updateDoc(parcelRef, {
    status,
    updatedAt: new Date().toISOString(),
    statusHistory: arrayUnion(entry)
  });
};

export const generateTrackingNumber = (): string => {
  return `TRK${uuid.v4().toString().substring(0, 8).toUpperCase()}`;
};

export { Parcel };
