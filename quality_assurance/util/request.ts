import { BASE } from "../constants/url";
import { Query } from "../../types/http";

const Url = (url: string, queries?: Query[]) =>
  `${BASE}/${url}${
    queries
      ? `?${queries
          .map(({ predicate, value }) => `${predicate}=${value}`)
          .join("&")}`
      : ""
  }`;

export default Url;
