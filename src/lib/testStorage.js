import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase.js";

export const uploadTest = async () => {
    try {
        const testRef = ref(storage, 'test.txt');
        await uploadString(testRef, 'hello world');
        const url = await getDownloadURL(testRef);
        console.log("Upload Success: ", url);
        return url;
    } catch(e) {
        console.error("Upload Error: ", e);
        return false;
    }
}
