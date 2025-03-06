Page({
  data: {
    tempImagePath: '',
    foodName: '',
    calories: '',
    errorMessage: ''
  },

  // 处理API返回的数据
  handleApiResponse: function (response) {
    console.log('API返回数据:', response);  // 调试日志

    if (response && response.choices && response.choices[0] && response.choices[0].message) {
      const content = response.choices[0].message.content;
      console.log('AI返回内容:', content);  // 调试日志

      // 尝试提取食物名称和卡路里信息
      let foodName = '';
      let calories = '';

      // 提取食物名称 - 尝试多种可能的格式
      const foodNamePatterns = [
        /食物名称：(.+?)[\n。]/,
        /这是一道(.+?)[\n。]/,
        /图片展示的是(.+?)[\n。]/,
        /图片中的食物是(.+?)[\n。]/
      ];

      for (const pattern of foodNamePatterns) {
        const match = content.match(pattern);
        if (match) {
          foodName = match[1].trim();
          break;
        }
      }

      // 提取卡路里信息 - 尝试多种可能的格式
      const caloriesPatterns = [
        /预计卡路里：(.+?)[\n。]/,
        /卡路里：(.+?)[\n。]/,
        /热量：(.+?)[\n。]/,
        /约(.+?)卡路里/
      ];

      for (const pattern of caloriesPatterns) {
        const match = content.match(pattern);
        if (match) {
          calories = match[1].trim();
          break;
        }
      }

      // 如果找到了任何信息，就更新界面
      if (foodName || calories) {
        this.setData({
          foodName: foodName || '未知食物',
          calories: calories || '无法估算',
          errorMessage: ''
        });

        console.log('设置数据:', {
          foodName: foodName || '未知食物',
          calories: calories || '无法估算'
        });
      } else {
        this.setData({
          errorMessage: '无法识别食物信息'
        });
      }
    } else {
      this.setData({
        errorMessage: '解析返回数据失败'
      });
    }
  },

  // 选择图片
  chooseImage: function () {
    const that = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        that.setData({
          tempImagePath: res.tempFilePaths[0],
          errorMessage: ''
        });

        // 先将图片转为 base64
        wx.getFileSystemManager().readFile({
          filePath: res.tempFilePaths[0],
          encoding: 'base64',
          success: function (base64Res) {
            // 调用 SiliconFlow API
            wx.request({
              url: 'https://api.siliconflow.cn/v1/chat/completions',
              method: 'POST',
              header: {
                'Authorization': 'Bearer sk-jnguzikupqzcgsorralgxhppujybvytrlozrusdresygxepk',
                'Content-Type': 'application/json'
              },
              data: {
                model: 'deepseek-ai/deepseek-vl2',
                messages: [
                  {
                    role: 'user',
                    content: [
                      {
                        type: 'image_url',
                        image_url: {
                          url: `data:image/jpeg;base64,${base64Res.data}`
                        }
                      },
                      {
                        type: 'text',
                        text: '请分析这张图片中的食物，并告诉我：\n1. 食物名称（请用"食物名称："开头）\n2. 预计卡路里（请用"预计卡路里："开头）'
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
              },
              success: function (apiRes) {
                console.log('API响应:', apiRes);
                that.handleApiResponse(apiRes.data);
              },
              fail: function (error) {
                console.error('API调用失败:', error);
                that.setData({
                  errorMessage: '调用API失败，请重试'
                });
              }
            });
          },
          fail: function (error) {
            console.error('读取图片失败:', error);
            that.setData({
              errorMessage: '读取图片失败，请重试'
            });
          }
        });
      },
      fail: function (error) {
        console.error('选择图片失败:', error);
        that.setData({
          errorMessage: '选择图片失败，请重试'
        });
      }
    });
  }
}); 