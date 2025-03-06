/// <reference path="../../typings/index.d.ts" />

// index.ts
// 获取应用实例
const app = getApp<IAppOption>()
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

const API_KEY = 'sk-jnguzikupqzcgsorralgxhppujybvytrlozrusdresygxepk';
const API_URL = 'https://api.siliconflow.cn/v1/chat/completions';

interface PageData {
  motto: string;
  userInfo: {
    avatarUrl: string;
    nickName: string;
  };
  hasUserInfo: boolean;
  canIUseGetUserProfile: boolean;
  canIUseNicknameComp: boolean;
  tempImagePath: string;
  calories: string;
  foodName: string;
  loading: boolean;
  errorMessage: string;
}

type CustomPage = WechatMiniprogram.Page.Instance<
  PageData,
  WechatMiniprogram.Page.CustomOption
>;

Page<PageData, WechatMiniprogram.Page.CustomOption>({
  data: {
    motto: 'Hello World',
    userInfo: {
      avatarUrl: defaultAvatarUrl,
      nickName: '',
    },
    hasUserInfo: false,
    canIUseGetUserProfile: wx.canIUse('getUserProfile'),
    canIUseNicknameComp: wx.canIUse('input.type.nickname'),
    tempImagePath: '',
    calories: '',
    foodName: '',
    loading: false,
    errorMessage: ''
  },

  // 选择图片
  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.setData({
          tempImagePath: tempFilePath,
          calories: '',
          foodName: '',
          errorMessage: ''
        });
        this.analyzeImage(tempFilePath);
      }
    });
  },

  // 分析图片
  async analyzeImage(filePath: string) {
    try {
      this.setData({ 
        loading: true,
        errorMessage: ''
      });
      
      // 将图片转为base64
      const fileManager = wx.getFileSystemManager();
      const base64 = fileManager.readFileSync(filePath, 'base64');
      
      const response = await this.callVisionAPI(base64);
      console.log('API完整响应:', response);
      
      if (response?.choices?.[0]?.message?.content) {
        const content = response.choices[0].message.content;
        console.log('API返回内容:', content);
        this.parseResponse(content);
      } else {
        throw new Error('API返回格式不正确');
      }
    } catch (error) {
      this.setData({
        errorMessage: error.message || '分析失败，请重试'
      });
      console.error('分析失败:', error);
    } finally {
      this.setData({ loading: false });
    }
  },

  // 调用Vision API
  async callVisionAPI(base64Image: string) {
    return new Promise((resolve, reject) => {
      const requestData = {
        model: 'deepseek-ai/deepseek-vl2',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: '请分析图片中的食物，并按以下格式回复（只需要回复这两行，不要其他任何解释）：\n食物名称：[食物名称]\n预计卡路里：约[数字]卡路里\n\n如果无法识别食物，请只回复：未检测到食物'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        stream: false,
        max_tokens: 512,
        temperature: 0.7,
        top_p: 0.7,
        top_k: 50,
        frequency_penalty: 0.5,
        n: 1
      };

      wx.request({
        url: API_URL,
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          'Accept': 'application/json'
        },
        data: requestData,
        success: (res: any) => {
          console.log('API响应状态:', res.statusCode);
          console.log('API响应头:', res.header);
          console.log('API响应体:', res.data);

          if (res.statusCode === 403) {
            console.error('API认证失败:', res);
            reject(new Error('API认证失败'));
          } else if (res.statusCode === 400) {
            console.error('API请求格式错误:', res);
            reject(new Error('API请求格式错误'));
          } else if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            reject(new Error(`API请求失败: ${res.statusCode}`));
          }
        },
        fail: (error) => {
          console.error('API请求失败:', error);
          reject(error);
        }
      });
    });
  },

  // 解析API返回的结果
  parseResponse(content: string) {
    try {
      console.log('正在解析内容:', content);
      
      // 检查是否包含"未检测到食物"
      if (content.includes('未检测到食物')) {
        this.setData({
          errorMessage: '未检测到食物，请重新拍摄',
          foodName: '',
          calories: ''
        });
        return;
      }

      // 使用更精确的正则表达式匹配
      const foodNameMatch = content.match(/食物名称：([^\n]+)/);
      const caloriesMatch = content.match(/预计卡路里：([^\n]+)/);

      console.log('匹配结果:', { foodNameMatch, caloriesMatch });

      if (foodNameMatch?.[1] && caloriesMatch?.[1]) {
        const foodName = foodNameMatch[1].trim();
        const calories = caloriesMatch[1].trim();
        console.log('解析结果:', { foodName, calories });
        
        this.setData({
          foodName,
          calories,
          errorMessage: ''
        });
      } else {
        this.setData({
          errorMessage: '无法识别食物信息，请重新拍摄',
          foodName: '',
          calories: ''
        });
      }
    } catch (error) {
      console.error('解析响应失败:', error);
      this.setData({
        errorMessage: typeof error === 'object' && error !== null && 'message' in error 
          ? String(error.message) 
          : '解析失败，请重试',
        foodName: '',
        calories: ''
      });
    }
  },

  methods: {
    // 事件处理函数
    bindViewTap() {
      wx.navigateTo({
        url: '../logs/logs',
      })
    },
    onChooseAvatar(e: any) {
      const { avatarUrl } = e.detail
      const { nickName } = this.data.userInfo
      this.setData({
        "userInfo.avatarUrl": avatarUrl,
        hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
      })
    },
    onInputChange(e: any) {
      const nickName = e.detail.value
      const { avatarUrl } = this.data.userInfo
      this.setData({
        "userInfo.nickName": nickName,
        hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
      })
    },
    getUserProfile() {
      // 推荐使用wx.getUserProfile获取用户信息，开发者每次通过该接口获取用户个人信息均需用户确认，开发者妥善保管用户快速填写的头像昵称，避免重复弹窗
      wx.getUserProfile({
        desc: '展示用户信息', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
        success: (res) => {
          console.log(res)
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }
  },
})
