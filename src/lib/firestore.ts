// src/lib/firestore.ts
import { db } from "../../firebase/Client";
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "firebase/firestore";

export async function logAttendance({ uid, name, rollNo }: { uid: string; name: string; rollNo: string; }) {
  const docRef = await addDoc(collection(db, "attendance"), {
    uid,
    name,
    rollNo,
    timestamp: serverTimestamp(),
  });
  return docRef.id;
}

export async function getAttendance() {
  const q = query(collection(db, "attendance"), orderBy("timestamp", "desc"));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => {
    const data = doc.data() as { uid: string; name: string; rollNo: string; timestamp: unknown };
    const ts = data.timestamp;
    const timestamp = ts && typeof ts === 'object' && ts !== null && 'toDate' in ts && typeof (ts as { toDate: () => Date }).toDate === "function" ? (ts as { toDate: () => Date }).toDate().toISOString() : ts;
    return {
      id: doc.id,
      ...data,
      timestamp,
    };
  });
}
