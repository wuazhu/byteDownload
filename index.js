const Koa = require("koa");
const Router = require("koa-router");
const logger = require("koa-logger");
const bodyParser = require("koa-bodyparser");
const fs = require("fs");
const path = require("path");
// // const { init: initDB, Counter } = require("./db");
const axios = require('axios')
const cors = require('koa2-cors');


let token = null

const router = new Router();

const homePage = fs.readFileSync(path.join(__dirname, "index.html"), "utf-8");

// 首页
router.get("/", async (ctx) => {
  ctx.body = homePage;
});


async function getToken() {
  return await  axios({
    baseURL: 'https://api-v2.douyin.wtf',
    method: 'post',
    url: '/token',
    data: {
      username: 'test',
      password: 'test',
      grant_type: 'password'
    },
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
}

// 视频信息
router.get('/api/video_data', async (ctx) => {
  ctx.set('Access-Control-Allow-Origin',"*")
  ctx.set('status', 200)
  const {url} = ctx.request.query;
  let _reqUrl = ''
  if (url.includes('douyin.com')) {
    _reqUrl = `/douyin_video_data?douyin_video_url=${url}`
  }
  if (url.includes('tiktok.com')) {
    _reqUrl = `/tiktok_video_data/?tiktok_video_url=${url}`
  }
  const d = await axios({
    baseURL: 'http://localhost:9010',
    method: 'get',
    url: `${_reqUrl}`,
  })
  console.log('看看是啥', d.data);
  ctx.body = d.data
})


// 请求数据
router.get('/api/douyin_profile', async (ctx) => {
  const {url} = ctx.request.query;
  let awemeList = {}
  let headers = {
    'Authorization': '',
    'Accept-Encoding': '*'
  }
  
  const _token = await getToken()
  token = _token.data
  headers.Authorization = `Bearer ${token.access_token}`
  const userProfile = await axios({
    baseURL: 'https://api-v2.douyin.wtf',
    method: 'get',
    headers,
    url: `/douyin_profile_videos/?douyin_profile_url=${url}&cursor=0&count=40`,
  })
  console.log('用户数据', userProfile.data);
  async function getMoreData({next_url, has_more}) {
    if (has_more && next_url) {
      const {data} =  await axios({
        method: 'get',
        headers,
        url: next_url
      })

      if (data && data.status == 'success') {
        awemeList.aweme_list = awemeList.aweme_list.concat(data.aweme_list)
        if (data.has_more && data.next_url) {
          await getMoreData(data)
        }
      }
    }
  }
  if (userProfile && userProfile.data && userProfile.data.status == 'success') {
    awemeList = userProfile.data
    await getMoreData(userProfile.data)
  } else {
    awemeList = userProfile.data
  }
  ctx.body = awemeList
})

// 搜索tk用户主页
router.get('/api/tiktok_profile', async (ctx) => {
  const {url} = ctx.request.query;
  let awemeList = {}
  let headers = {
    'Authorization': '',
    'Accept-Encoding': '*'
  }
  
  const _token = await getToken()
  token = _token.data
  headers.Authorization = `Bearer ${token.access_token}`
  const userProfile = await axios({
    baseURL: 'https://api-v2.douyin.wtf',
    method: 'get',
    headers,
    url: `/tiktok_profile_videos/?tiktok_video_url=${url}&cursor=0&count=40`,
  })
  console.log('用户数据', JSON.stringify(userProfile.data));
  async function getMoreData({next_url, has_more}) {
    if (has_more && next_url) {
      const {data} =  await axios({
        method: 'get',
        headers,
        url: next_url
      })

      if (data && data.status == 'success') {
        awemeList.aweme_list = awemeList.aweme_list.concat(data.aweme_list)
        if (data.has_more && data.next_url) {
          await getMoreData(data)
        }
      }
    }
  }
  if (userProfile && userProfile.data && userProfile.data.status == 'success') {
    awemeList = userProfile.data
    await getMoreData(userProfile.data)
  }
  ctx.body = awemeList
})

// 验证码
router.get('/api/code', async (ctx) => {
  const query = ctx.query
  console.log('query', query);
  if (!query || !query.code || !query.deviceId || !query.type) {
    ctx.body = {
      code: -1,
      message: '参数错误',
    }
    return
  } else {
    ctx.body = {
      code: 0,
      data: true,
      message: '成功'
    }
  }
})



const app = new Koa();
app
  .use(cors())
  .use(logger())
  .use(bodyParser())
  .use(router.routes())
  .use(router.allowedMethods());

const port = process.env.PORT || 80;
async function bootstrap() {
  // await initDB();
  app.listen(port, () => {
    console.log("启动成功", `http://localhost:${port}`);
  });
}
bootstrap();
