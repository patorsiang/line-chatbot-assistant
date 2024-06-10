import * as logger from "firebase-functions/logger";
import {getFirestore, Timestamp} from "firebase-admin/firestore";
import {initializeApp} from "firebase-admin";

initializeApp();
const db = getFirestore();

export const getLastGoldPrice = () => {
  return db.doc("line/gold").get();
};

export const updateGoldPrice = async (priceCurrent: string) => {
  await db.doc("line/gold").set({price: priceCurrent});
};

export const updateUser = async (
  mode: string,
  user?: FirebaseFirestore.DocumentData
) => {
  if (user) {
    logger.log("updateUser");
    const userRef = db.collection("user").doc(user?.userId);
    user!.timestamp = Timestamp.now();
    user!.mode = mode;

    try {
      await userRef.set(user, {merge: true});
    } catch (error) {
      logger.error(error);
    }
  }
};

export const getUser = async (userId: string) => {
  logger.log("getUser");
  const userRef = db.collection("user").doc(userId);

  try {
    const doc = await userRef.get();
    if (!doc.exists) {
      logger.log("No such document!");
      return undefined;
    } else {
      return doc.data();
    }
  } catch (error) {
    logger.error(error);
    throw error; // throw the error again or return a default value here
  }
};
