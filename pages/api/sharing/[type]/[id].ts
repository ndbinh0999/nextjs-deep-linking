import axios from "axios";
import type { NextApiRequest, NextApiResponse } from "next";
import { decrypt } from "../../../../helpers";

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

type ResponseData = {
  response: unknown;
  metadata: {
    image: string;
    title: string;
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const { type: prefix, id: encryptId } = req.query;

  const params = decrypt(
    encryptId as string,
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
    }?filters[hyab_content_id]=${params}&populate[0]=banner`;
  }
  if (prefix === caseHandle.activity) {
    apiUrl = `${process.env.NEXT_PUBLIC_API_HOST_HYAB_ACTIVITY}/api/Activities/${params}`;
  }

  if (!apiUrl) return;

  const { data } = await axios.get(apiUrl);
  const response = prefix === caseHandle.activity ? data.data : data;
  const metadata = getMetadata(prefix as string, response);
  res.status(200).json({
    response,
    metadata,
  });
}

const getMetadata = (
  prefix: string,
  response: any
): { image: string; title: string } => {
  const metadata = { image: "", title: "" };
  switch (prefix) {
    case caseHandle.trending:
      metadata.title = response?.data?.[0]?.attributes?.title;
      metadata.image = `${process.env.NEXT_PUBLIC_API_CMS_STRAPI}/${response?.data?.[0]?.attributes.banner.data.attributes.url}`;
      break;

    case caseHandle.learning_resource:
      metadata.title = response?.data?.[0]?.attributes?.TITLE;
      metadata.image = response?.data?.[0]?.attributes?.THUMB;
      break;

    case caseHandle.activity:
      metadata.title = response?.data?.nameEN;
      metadata.image =
        response?.data.activityPhotos.length !== 0
          ? `${process.env.NEXT_PUBLIC_API_HOST_HYAB_ACTIVITY}/api/Photos/${response?.data?.activityPhotos?.[0]?.id}`
          : "";
      break;
    default:
      break;
  }
  return metadata;
};
