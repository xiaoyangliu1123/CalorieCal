Page({
  data: {
    tempImagePath: '',
    foodName: '',
    calories: '',
    errorMessage: '',
    isLoading: false  // 添加加载状态
  },

  // 处理API返回的数据
  handleApiResponse: function (response) {
    console.log('API返回数据:', response);  // 调试日志

    if (response && response.choices && response.choices[0] && response.choices[0].message) {
      const content = response.choices[0].message.content;
      console.log('AI返回内容:', content);  // 调试日志

      // 使用简单的格式匹配
      const foodNameMatch = content.match(/食物名称：(.+)$/m);
      const caloriesMatch = content.match(/卡路里：(.+)$/m);

      if (foodNameMatch || caloriesMatch) {
        this.setData({
          foodName: foodNameMatch ? foodNameMatch[1].trim() : '未知食物',
          calories: caloriesMatch ? caloriesMatch[1].trim() : '无法估算',
          errorMessage: '',
          isLoading: false
        });

        console.log('设置数据:', {
          foodName: foodNameMatch ? foodNameMatch[1].trim() : '未知食物',
          calories: caloriesMatch ? caloriesMatch[1].trim() : '无法估算'
        });
      } else {
        this.setData({
          errorMessage: '无法识别食物信息',
          isLoading: false
        });
      }
    } else {
      this.setData({
        errorMessage: '解析返回数据失败',
        isLoading: false
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
          errorMessage: '',
          isLoading: true  // 开始加载
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
                        text: '请分析这张图片中的食物，并按照以下格式回复（每项单独一行）：\n食物名称：[食物名称]\n卡路里：[预计卡路里，请包含单位]'
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
                  errorMessage: '调用API失败，请重试',
                  isLoading: false
                });
              }
            });
          },
          fail: function (error) {
            console.error('读取图片失败:', error);
            that.setData({
              errorMessage: '读取图片失败，请重试',
              isLoading: false
            });
          }
        });
      },
      fail: function (error) {
        console.error('选择图片失败:', error);
        that.setData({
          errorMessage: '选择图片失败，请重试',
          isLoading: false
        });
      }
    });
  }
}); 