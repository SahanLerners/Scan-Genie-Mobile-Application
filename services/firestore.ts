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
  async addFavorite(userId: string, product: Product): Promise<void> {
    const favoritesRef = collection(db, 'favorites');
    await addDoc(favoritesRef, {
      userId,
      product,
      addedAt: Timestamp.now(),
    });
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
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      addedAt: doc.data().addedAt.toDate(),
    })) as UserFavorite[];
  },

  // Scan History
  async addScanToHistory(userId: string, product: Product): Promise<void> {
    const scansRef = collection(db, 'scans');
    await addDoc(scansRef, {
      userId,
      product,
      scannedAt: Timestamp.now(),
    });
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
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      scannedAt: doc.data().scannedAt.toDate(),
    })) as ScanHistory[];
  },

  // Analytics
  async getUserAnalytics(userId: string): Promise<UserAnalytics> {
    const scansRef = collection(db, 'scans');
    const favoritesRef = collection(db, 'favorites');
    
    const [scansSnapshot, favoritesSnapshot] = await Promise.all([
      getDocs(query(scansRef, where('userId', '==', userId))),
      getDocs(query(favoritesRef, where('userId', '==', userId)))
    ]);

    const scans = scansSnapshot.docs.map(doc => doc.data());
    const totalScans = scans.length;
    const favoriteCount = favoritesSnapshot.size;

    // Calculate categories scanned
    const categoriesScanned: { [key: string]: number } = {};
    scans.forEach(scan => {
      const category = scan.product.category || 'Unknown';
      categoriesScanned[category] = (categoriesScanned[category] || 0) + 1;
    });

    // Calculate monthly scans
    const monthlyScans: { [key: string]: number } = {};
    scans.forEach(scan => {
      const date = scan.scannedAt.toDate();
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