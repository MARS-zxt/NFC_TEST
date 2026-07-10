**一、开卡界面 OpenCpuTypeACardDemo.html**

1	密钥输入长度校验，非16个字符需要做提示，比如输入框标红，然后有提示词
2	按钮调整	三个按钮移到独立第4行，文字完整显示
3	卡类型下拉	 → <SELECT></select>，选项"用户卡"(01) / "维护卡"(02)
**二、APDU 界面 TestCpuTypeA.html**

1	优化调整按钮和输入框的位置，按钮大小美观合适能够展示完全文字
2	密钥输入长度校验，非16个字符需要做提示，比如输入框标红，然后有提示词
**三、燃气卡读写界面 LoadCpuTypeACardDemo.html**

1	token 数下拉	 → <SELECT></select>，选项 1~5，默认选中 3
