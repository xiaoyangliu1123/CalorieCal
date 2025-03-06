Page({
  data: {
    tempImagePath: '',
    foodName: '',
    calories: '',
    errorMessage: ''
  },

  // 处理API返回的数据
  handleApiResponse: function(response) {
    console.log('API返回数据:', response);  // 调试日志
    
    if (typeof response === 'string') {
      // 分别匹配食物名称和卡路里信息
      const foodNameMatch = response.match(/食物名称：(.+?)\n/);
      const caloriesMatch = response.match(/预计卡路里：(.+)$/);
      
      console.log('解析结果:', {  // 调试日志
        foodNameMatch,
        caloriesMatch
      });

      if (foodNameMatch && caloriesMatch) {
        this.setData({
          foodName: foodNameMatch[1],
          calories: caloriesMatch[1],
          errorMessage: ''
        });
        
        console.log('设置数据:', {  // 调试日志
          foodName: foodNameMatch[1],
          calories: caloriesMatch[1]
        });
      } else {
        this.setData({
          errorMessage: '解析返回数据格式错误'
        });
      }
    } else {
      this.setData({
        errorMessage: '解析返回数据失败'
      });
    }
  },

  // 选择图片
  chooseImage: function() {
    const that = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function(res) {
        that.setData({
          tempImagePath: res.tempFilePaths[0],
          errorMessage: ''
        });
        // 这里调用你的API并在成功后调用handleApiResponse
      }
    });
  }
}); 