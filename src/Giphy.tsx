import { type FC, useState } from "react";
import { Grid } from "@giphy/react-components";
import { GiphyFetch, type GifsResult } from "@giphy/js-fetch-api";
import { type IGif } from "@giphy/js-types";
import BasicInput from "./InputsCmp/BasicInput";

const giphy = new GiphyFetch("k2t5saGwngWNYetDGiaBi6TgtsxpYDaX");

interface IGiphy {
  selectGiphyImage: (imageUrl: IGif) => void;
  maxWidth: number;
  onClose: () => void;
}

const Giphy: FC<IGiphy> = ({
  selectGiphyImage,
  maxWidth,
  onClose,
}: IGiphy) => {

  const [query, setQuery] = useState("wedding");
  const [categoryOpen, setCategoryOpen] = useState(true);

  const fetchGifs = async (offset: number): Promise<GifsResult> => {
    return await giphy.search(query, { offset, limit: 10 });
  };

  return (
    <div
      style={{
        backgroundColor: "#f0f0f0",
        padding: 4,
        borderRadius: "26px"
      }}
    >

      <div
        //  gap={4}
        style={{
          display: 'flex',
          alignItems: 'center',
          borderRadius: "26px",
          // padding:4
        }}
      >
        <div
          onClick={onClose}
          style={{
            width: "28px",
            height: "28px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            cursor: "pointer",
            borderRadius: "50%",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="17"
            height="17"
            viewBox="0 0 17 17"
            fill="none"
          >
            <path d="M16.5 8.5H1.5" stroke="black" />
            <path d="M8.5 16L1 8.5L8.5 1" stroke="black" />
          </svg>
        </div>
        <BasicInput
          placeholder="Search for gif"
          value={query}
          color={"#787878"}
          fontSize={"16px"}
          textAlign={"left"}
          borderBottomColor={"#787878"}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
          className="giphy-input"
        />
      </div>
      <div
        style={{
          display: 'flex',
          position: "relative",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: "3px",
          paddingTop: "1rem",
          height: "365.578px",
          overflowY: "auto",
        }}
        className="no-scrollbar"
      >
        <Grid
          noLink={true}
          onGifClick={selectGiphyImage}
          columns={2}
          width={maxWidth}
          gutter={6}
          fetchGifs={fetchGifs}
          key={query}
          onGifsFetched={() => {
            setCategoryOpen(false);
          }}
        />
      </div>
    </div>
  );
};

export default Giphy;
