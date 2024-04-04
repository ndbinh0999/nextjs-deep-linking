import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import CryptoJS from "crypto-js";
import Head from "next/head";
import axios from "axios";

export const convertPrefix: { [key: string]: string } = {
  trending: "trendings",
  learning_resource: "learning-resources",
  activity: "activity",
};

export enum caseHandle {
  trending = "trending",
  learning_resource = "learning_resource",
  activity = "activity",
}

const DeepLinkPage = () => {
  const router = useRouter();
  const { lang, type: prefix, id: encryptId } = router.query;
  const [data, setData] = useState<any>();

  const userAgent = typeof navigator !== "undefined" && navigator.userAgent;
  const redirectUrl = getAppStoreUrl(userAgent);
  const params = decrypt(
    encryptId as string,
    "e1342b084a6585295c7ade62c211f850"
  );

  console.table([params, encryptId]);

  function decrypt(valueStringHex: string, keyStringHex: string) {
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

  async function redirectBasedOnDevice() {
    let apiUrl;
    if (
      [caseHandle.trending, caseHandle.learning_resource].includes(
        prefix as caseHandle
      )
    ) {
      apiUrl = `${process.env.NEXT_PUBLIC_API_CMS_STRAPI}/api/${
        convertPrefix[prefix as string]
      }?filters[hyab_content_id]=${params}&populate[0]=banner`;
    }
    if (prefix === caseHandle.activity) {
      apiUrl = `${process.env.NEXT_PUBLIC_API_HOST_HYAB_ACTIVITY}/api/Activities/${params}`;
    }

    if (!apiUrl) return;

    axios
      .get(apiUrl)
      .then((response) => {
        if (response) {
          prefix === caseHandle.activity
            ? setData(response)
            : setData(response.data);
        }
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });

    if (redirectUrl) {
      try {
        const isFirefox = userAgent.indexOf("FxiOS") !== -1;
        const isChrome = userAgent.indexOf("CriOS") !== -1;
        const isEdge = userAgent.indexOf("EdgiOS") !== -1;
        const isOpera = userAgent.indexOf("OPT") !== -1;
        const isSafari = !isFirefox && !isChrome && !isEdge && !isOpera;
        const isFacebookMessenger =
          /FBAN|FBAV|FBMD|FBSN|FBSS|FBCR|FBID|FBLC|FBOP|FBRV|FB_IAB|FBBV|FBDM|FBFV/i.test(
            userAgent
          );

        if (
          /huawei/i.test(userAgent) ||
          /android/i.test(userAgent) ||
          (/iPad|iPhone/.test(userAgent) && !isSafari) ||
          isFacebookMessenger
        ) {
          window.location.replace(
            `hyab://youth/sharing/${prefix}/${encryptId}`
          );
        }

        setTimeout(() => {
          window.location.replace(redirectUrl);
        }, 2000);
      } catch (error) {
        console.error("Error during URL redirection:", error);
      }
    } else {
      alert(
        "Sorry, unable to open on desktop. Please open this link on your mobile app."
      );
    }
  }

  const getTitle = (): string => {
    if (prefix === caseHandle.trending) {
      return data?.data[0]?.attributes?.title;
    }
    if (prefix === caseHandle.learning_resource) {
      return data?.data[0]?.attributes?.TITLE;
    }
    if (prefix === caseHandle.activity) {
      return data?.data?.nameEN;
    }
    return "";
  };

  const getImage = (): string => {
    if (prefix === caseHandle.trending) {
      return `${process.env.NEXT_PUBLIC_API_CMS_STRAPI}/${data?.data[0]?.attributes.banner.data.attributes.url}`;
    }
    if (prefix === caseHandle.learning_resource) {
      return data?.data[0]?.attributes?.THUMB;
    }
    if (
      prefix === caseHandle.activity &&
      data?.data.activityPhotos.length !== 0
    ) {
      return `${process.env.NEXT_PUBLIC_API_HOST_HYAB_ACTIVITY}/api/Photos/${data?.data.activityPhotos[0].id}`;
    }
    return "";
  };

  function getAppStoreUrl(userAgent: string | undefined) {
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

  useEffect(() => {
    prefix && redirectBasedOnDevice();
  }, [prefix]);

  console.log("getTitle:", getTitle());
  console.log("getImage:", getImage());

  return (
    <div>
      <Head>
        {/* <title>{getTitle()}</title> */}
        <meta property="og:title" content={getTitle()} />
        <meta property="og:image" content={getImage()} />
      </Head>
      {getTitle()}
    </div>
  );
};

export default DeepLinkPage;
