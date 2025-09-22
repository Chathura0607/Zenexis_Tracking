import { collection, addDoc, getDocs, doc, updateDoc, query, where, orderBy } from 'firebase/firestore';
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
  const q = query(
    collection(db, 'parcels'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Parcel[];
};

export const updateParcelStatus = async (parcelId: string, status: string, location: string) => {
  const parcelRef = doc(db, 'parcels', parcelId);
  
  await updateDoc(parcelRef, {
    status,
    updatedAt: new Date().toISOString(),
    statusHistory: [
      {
        status,
        timestamp: new Date().toISOString(),
        location
      }
    ]
  });
};

export const generateTrackingNumber = (): string => {
  return `TRK${uuid.v4().toString().substring(0, 8).toUpperCase()}`;
};

export { Parcel };
