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

const DeepLinkPage = ({
  title,
  imageUrl,
}: {
  title: string;
  imageUrl: string;
}) => {
  const router = useRouter();
  const { lang, type: prefix, id: encryptId } = router.query;
  const [data, setData] = useState<any>();
  const params = decrypt(
    encryptId as string,
    "e1342b084a6585295c7ade62c211f850"
  );

  console.log("params", params);

  useEffect(() => {
    if (!prefix) return;

    const fetchData = async () => {
      try {
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

        const response = await axios.get(apiUrl);
        if (response && response.data) {
          prefix === caseHandle.activity
            ? setData(response)
            : setData(response.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();

    const redirectBasedOnDevice = () => {
      const userAgent = typeof navigator !== "undefined" && navigator.userAgent;
      const redirectUrl = getAppStoreUrl(userAgent);
      if (!redirectUrl) {
        alert(
          "Sorry, unable to open on desktop. Please open this link on your mobile app."
        );
        return;
      }

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
            /iPad|iPhone/.test(userAgent) ||
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
    };

    redirectBasedOnDevice();
  }, [prefix]);
  return (
    <div>
      <Head>
        <title>{title}</title>
        <meta property="og:title" content={title} />
        <meta property="og:image" content={imageUrl} />
      </Head>
      <div>{title}</div>
      <img src={imageUrl} alt="Image" />
    </div>
  );
};

export async function getServerSideProps(context: any) {
  const { params } = context;
  const { type, id: encryptId } = params;
  const prefix = type as string;
  const paramsDecrypted = decrypt(
    encryptId,
    "e1342b084a6585295c7ade62c211f850"
  );

  let apiUrl;
  if (
    [caseHandle.trending, caseHandle.learning_resource].includes(
      prefix as caseHandle
    )
  ) {
    apiUrl = `${process.env.NEXT_PUBLIC_API_CMS_STRAPI}/api/${
      convertPrefix[prefix as string]
    }?filters[hyab_content_id]=${paramsDecrypted}&populate[0]=banner`;
  }
  if (prefix === caseHandle.activity) {
    apiUrl = `${process.env.NEXT_PUBLIC_API_HOST_HYAB_ACTIVITY}/api/Activities/${paramsDecrypted}`;
  }

  try {
    const response = await axios.get(apiUrl);
    let title = "";
    let imageUrl = "";
    if (response && response.data) {
      const responseData = response.data;
      if (prefix === caseHandle.trending) {
        title = responseData?.data[0]?.attributes?.title || "";
        imageUrl = `${process.env.NEXT_PUBLIC_API_CMS_STRAPI}/${responseData?.data[0]?.attributes.banner.data.attributes.url}`;
      } else if (prefix === caseHandle.learning_resource) {
        title = responseData?.data[0]?.attributes?.TITLE || "";
        imageUrl = responseData?.data[0]?.attributes?.THUMB || "";
      } else if (prefix === caseHandle.activity) {
        title = responseData?.data?.nameEN || "";
        if (responseData?.data.activityPhotos.length !== 0) {
          imageUrl = `${process.env.NEXT_PUBLIC_API_HOST_HYAB_ACTIVITY}/api/Photos/${responseData?.data.activityPhotos[0].id}`;
        }
      }
    }
    return {
      props: { title, imageUrl },
    };
  } catch (error) {
    console.error("Error fetching data:", error);
    return {
      props: { title: "", imageUrl: "" },
    };
  }
}

export default DeepLinkPage;

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

function getAppStoreUrl(userAgent: any) {
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
