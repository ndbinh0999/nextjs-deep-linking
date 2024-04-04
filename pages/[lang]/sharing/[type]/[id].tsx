import Head from "next/head";
import { getAppStoreUrl } from "../../../../helpers";
import { NextResponse } from "next/server";

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

type Props = {
  metadata: {
    image: string;
    title: string;
  };
};

export async function getServerSideProps(context) {
  const { type: prefix, id: encryptId } = context.query;
  const headers = context.req.headers;
  const userAgent = headers["user-agent"];
  let redirectUrl = getAppStoreUrl(userAgent);
  // TODO: move baseUrl to .env
  const baseUrl = "http://localhost:3000";
  const apiUrl = `${baseUrl}/api/sharing/${prefix}/${encryptId}`;

  const { metadata } = await fetch(apiUrl).then((res) => res.json());

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
        redirectUrl = `hyab://youth/sharing/${prefix}/${encryptId}`;
      }
    } catch (error) {
      console.error("Error during URL redirection:", error);
    }
  } else {
    alert(
      "Sorry, unable to open on desktop. Please open this link on your mobile app."
    );
  }

  const propsData = {
    props: {
      metadata,
    },
  };

  if (redirectUrl) {
    propsData["redirect"] = {
      permanent: false,
      destination: redirectUrl,
    };
  }

  return propsData;
}

const DeepLinkPage = ({ metadata }: Props) => {
  return (
    <div>
      <Head>
        <title>{metadata.title}</title>

        <meta property="og:title" content={metadata.title} />
        <meta property="og:image" content={metadata.image} />
        <meta
          property="og:image"
          content="https://example.com/images/cool-page.jpg"
        />
      </Head>
      {metadata.title}
    </div>
  );
};

export default DeepLinkPage;
