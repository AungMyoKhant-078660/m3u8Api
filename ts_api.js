const express = require("express");
const app = express();
const https = require("https");
const { VK } = require("vk-io");
const axios = require("axios");
require("dotenv").config();

const vk = new VK({
  token: process.env.token,
});

const getComments = async () => {
  return await vk.api.board.getComments({
    group_id: process.env.group_id,
    topic_id: process.env.topic_id,
    // start_comment_id: 11,
  });
};

const getTs = (data) => {
  return new Promise((resolve, reject) => {
    https.get(data, (res) => {
      const link = res.headers.location;
      if (!link) {
        reject("error");
      }
      resolve(link);
    });
  });
};

const getM3u8 = async (m_link) => {
  try {
    const response = await axios.get(m_link);
    return response.data;
  } catch (error) {
    console.error(error);
  }
};

const mainData = async () => {
  //calling vk-api to get message from topics
  const comments = await getComments();
  //first array of link url
  const vid_links = comments.items[1]?.attachments;
  const m3u8 = vid_links[0].doc.url;
  //calling function to get .m3u8 from first 0 array
  let res_m3u8 = await getM3u8(m3u8);
  let flag = -1;
  for await (vid of vid_links) {
    //looping to get all real url
    if (flag >= 0) {
      //calling function from https api to get real location
      const ts_link = await getTs(vid.doc.url);
      res_m3u8 = res_m3u8.replace(`output${flag}.ts`, ts_link);
    }
    flag++;
  }
  return res_m3u8;
};

app.get("/video/m3u8", async (req, res) => {
  //here
  const data = await mainData();

  res
    .status(200)
    .set({
      "Content-Type": "application/x-mpegurl",
      "Content-Disposition": "attachment; filename=index.m3u8",
    })
    .send(data);
  return;

  // res.end();
});

app.get("/", async (req, res) => {
  res.status(200).sendFile(`${__dirname}/index.html`);
  return;
});

let port = process.env.PORT || 2000;
app.listen(port, () => {
  console.log(`Listenig on localhost ${localhost}`);
});
