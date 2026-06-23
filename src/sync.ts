import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import { 
  CustomerType, 
  CustomerInfo, 
  Warehouse, 
  SaleRep, 
  Item, 
  SaleOrder, 
  Invoice, 
  DMSConfig 
} from './types';

export interface UserSyncState {
  customerTypes: CustomerType[];
  customers: CustomerInfo[];
  warehouses: Warehouse[];
  saleReps: SaleRep[];
  items: Item[];
  saleOrders: SaleOrder[];
  invoices: Invoice[];
  config: DMSConfig;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const SYNC_DOC_PATH = (userId: string) => `users/${userId}/state/data`;

/**
 * Loads user data from Firestore. Returns null if no document exists.
 */
export async function loadUserDataFromCloud(userId: string): Promise<UserSyncState | null> {
  const path = SYNC_DOC_PATH(userId);
  try {
    const docRef = doc(db, path);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as UserSyncState;
    }
  } catch (err: any) {
    if (err?.code === 'permission-denied' || String(err).includes('permission')) {
      handleFirestoreError(err, OperationType.GET, path);
    } else {
      console.error('Error loading data from cloud:', err);
    }
  }
  return null;
}

/**
 * Saves a specific piece of user data to Firestore.
 * This is called incrementally to ensure that changes sync automatically.
 */
export async function saveUserDataFieldToCloud<K extends keyof UserSyncState>(
  userId: string,
  key: K,
  value: UserSyncState[K]
): Promise<void> {
  const path = SYNC_DOC_PATH(userId);
  try {
    const docRef = doc(db, path);
    await setDoc(docRef, { [key]: value }, { merge: true });
  } catch (err: any) {
    if (err?.code === 'permission-denied' || String(err).includes('permission')) {
      handleFirestoreError(err, OperationType.WRITE, path);
    } else {
      console.error(`Error saving field "${key}" to cloud:`, err);
    }
  }
}

/**
 * Saves the entire state to Firestore.
 */
export async function saveFullUserDataToCloud(userId: string, state: UserSyncState): Promise<void> {
  const path = SYNC_DOC_PATH(userId);
  try {
    const docRef = doc(db, path);
    await setDoc(docRef, state);
  } catch (err: any) {
    if (err?.code === 'permission-denied' || String(err).includes('permission')) {
      handleFirestoreError(err, OperationType.WRITE, path);
    } else {
      console.error('Error saving full state to cloud:', err);
    }
  }
}
