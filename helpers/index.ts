import CryptoJS from "crypto-js";

export function decrypt(valueStringHex: string, keyStringHex: string) {
  if (!valueStringHex || valueStringHex.length === 0) {
    console.error("Invalid valueStringHex:", valueStringHex);
    return "";
  }
  const value = CryptoJS.enc.Hex.parse(valueStringHex);
  const key = CryptoJS.enc.Utf8.parse(keyStringHex);
  const ivvar = CryptoJS.enc.Utf8.parse("4a6585295c7ade62");
  const decryptedStringHex = CryptoJS.AES.decrypt(
    { ciphertext: value } as any,
    key,
    {
      iv: ivvar,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    }
  );
  return decryptedStringHex.toString(CryptoJS.enc.Utf8);
}

export function getAppStoreUrl(userAgent?: string) {
  if (/huawei/i.test(userAgent)) {
    return "https://appgallery.huawei.com/#/app/C110441477?appId=C110441477";
  }
  if (/android/i.test(userAgent)) {
    return "https://play.google.com/store/apps/details?id=hk.gov.youthapp";
  }
  if (/iPad|iPhone|iPod/.test(userAgent)) {
    return "https://apps.apple.com/app/HKYouth+/6478738189";
  }
  return null;
}
