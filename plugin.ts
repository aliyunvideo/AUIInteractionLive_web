import { IApi } from 'umi'

export default (api: IApi) => {
  api.modifyHTML(($) => {
    $('head').append([
      '<title>阿里云互动直播</title>',
      `<link rel="icon" href="https://img.alicdn.com/tfs/TB1_ZXuNcfpK1RjSZFOXXa6nFXa-32-32.ico" type="image/x-icon" />`,
    ]);
    $('#root').after([
      // 测试阶段可以打开 vconsole，若是上线阶段了建议不要开启。这里通过判断查询参数中是否有 vconsole=1 来控制是否开启
      `<script src="https://g.alicdn.com/code/lib/vConsole/3.9.5/vconsole.min.js"></script>`,
      `<script>
        if (location.search.indexOf('vconsole=1') !== -1) {
          var vConsole = new VConsole();
        }
      </script>`,
      `<link rel="stylesheet" href="https://g.alicdn.com/de/prismplayer/2.13.1/skins/default/aliplayer-min.css" />`,
      `<script charset="utf-8" type="text/javascript" src="https://g.alicdn.com/de/prismplayer/2.13.1/aliplayer-h5-min.js"></script>`,
      `<script src='https://g.alicdn.com/video-cloud-fe/aliyun-interaction-sdk/1.0.0/aliyun-interaction-sdk.web.min.js'></script>`,
    ])
    return $;
  });
};
