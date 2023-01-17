(function () {
    if ((typeof cocosAnalytics) !== 'undefined'){
        var initArgs = {
            appID: '642225840',
            storeID: 'an.rustfisher.com',
            engine: 'cocos',
            callNumber: ''
        };
        if (!initArgs.appID || !initArgs.storeID) return console.error('请在编辑器设置好 Cocos Analytics 的 appID，如果在 Android 或者 iOS 下发布，请选择好对应的渠道。');
        cocosAnalytics.init(initArgs);
    }
})();