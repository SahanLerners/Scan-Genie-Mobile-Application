import { 
  collection, 
  doc, 
  addDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/firebase';
import { Product, UserFavorite, ScanHistory, UserAnalytics } from '@/types';

export const FirestoreService = {
  // Favorites
  async addFavorite(userId: string, product: Product): Promise<string> {
    const favoritesRef = collection(db, 'favorites');
    const docRef = await addDoc(favoritesRef, {
      userId,
      product,
      addedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  async removeFavorite(favoriteId: string): Promise<void> {
    const favoriteRef = doc(db, 'favorites', favoriteId);
    await deleteDoc(favoriteRef);
  },

  async getFavorites(userId: string): Promise<UserFavorite[]> {
    const favoritesRef = collection(db, 'favorites');
    const q = query(
      favoritesRef, 
      where('userId', '==', userId),
      orderBy('addedAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(d => {
      const data: any = d.data();
      return {
        id: d.id,
        userId: data.userId,
        product: data.product,
        addedAt: data.addedAt ? data.addedAt.toDate() : new Date()
      } as UserFavorite;
    });
  },

  // Scan History
  async addScanToHistory(userId: string, product: Product): Promise<string> {
    const scansRef = collection(db, 'scans');
    const docRef = await addDoc(scansRef, {
      userId,
      product,
      scannedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  async getScanHistory(userId: string, limitCount: number = 50): Promise<ScanHistory[]> {
    const scansRef = collection(db, 'scans');
    const q = query(
      scansRef,
      where('userId', '==', userId),
      orderBy('scannedAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(d => {
      const data: any = d.data();
      return {
        id: d.id,
        userId: data.userId,
        product: data.product,
        scannedAt: data.scannedAt ? data.scannedAt.toDate() : new Date()
      } as ScanHistory;
    });
  },

  // Analytics
  async getUserAnalytics(userId: string): Promise<UserAnalytics> {
    const scansRef = collection(db, 'scans');
    const favoritesRef = collection(db, 'favorites');
    
    const [scansSnapshot, favoritesSnapshot] = await Promise.all([
      getDocs(query(scansRef, where('userId', '==', userId))),
      getDocs(query(favoritesRef, where('userId', '==', userId)))
    ]);

    const scans = scansSnapshot.docs.map(d => d.data());
    const totalScans = scans.length;
    const favoriteCount = favoritesSnapshot.size;

    const categoriesScanned: { [key: string]: number } = {};
    scans.forEach((scan: any) => {
      const category = (scan.product?.category) || 'Unknown';
      categoriesScanned[category] = (categoriesScanned[category] || 0) + 1;
    });

    const monthlyScans: { [key: string]: number } = {};
    scans.forEach((scan: any) => {
      const ts = scan.scannedAt;
      const date = ts?.toDate ? ts.toDate() : (ts ? new Date(ts) : new Date());
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyScans[monthKey] = (monthlyScans[monthKey] || 0) + 1;
    });

    return {
      totalScans,
      categoriesScanned,
      monthlyScans,
      favoriteCount,
    };
  },
};
