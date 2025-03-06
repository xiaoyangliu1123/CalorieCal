/// <reference types="miniprogram-api-typings" />

declare namespace WechatMiniprogram {
  interface IAppOption {
    globalData: {
      userInfo?: WechatMiniprogram.UserInfo;
    };
  }
} 