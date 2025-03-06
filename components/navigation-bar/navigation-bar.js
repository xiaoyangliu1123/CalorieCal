Component({
    properties: {
        title: {
            type: String,
            value: ''
        },
        back: {
            type: Boolean,
            value: false
        }
    },
    data: {
        statusBarHeight: 0,
        navBarHeight: 44
    },
    lifetimes: {
        attached() {
            const systemInfo = wx.getWindowInfo()
            this.setData({
                statusBarHeight: systemInfo.statusBarHeight
            })
        }
    },
    methods: {
        goBack() {
            if (this.properties.back) {
                wx.navigateBack({
                    delta: 1
                })
            }
        },
        chooseImage() {
            // 这里需要添加选择图片的逻辑
        },
        uploadImage() {
            // 这里需要添加上传图片到服务器的逻辑
        }
    }
}) 