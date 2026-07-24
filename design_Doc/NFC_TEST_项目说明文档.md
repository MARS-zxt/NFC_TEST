# NFC_TEST —— 燃气表 CPU 卡 NFC 测试工具 项目说明文档

## 一、项目概述

### 1.1 项目定位

NFC_TEST 是一个基于 Web 浏览器的**非接触式 Type A CPU 卡（燃气表智能卡）读写测试工具**，用于对泽兴燃气表 CPU 卡进行发卡、读写、认证、擦除等全生命周期操作。该工具通过 WebSocket 与本地的 DCRF32 系列 NFC 读卡器进行通信，以 HTML/JavaScript 纯前端技术栈实现，无需安装，在浏览器中直接运行。

### 1.2 适用场景

- 燃气表 CPU 卡的**发行/开卡**（建立文件系统、装载密钥、写入持卡人信息）
- 燃气表 CPU 卡的**数据读写**（读取卡基本信息、燃气表状态、冻结日志、Token 数据）
- 燃气表 CPU 卡的**数据写入**（写入 Token、测试数据调试写入）
- 燃气表 CPU 卡的**认证测试**（3DES 外部认证）
- 燃气表 CPU 卡的**擦除/重置**
- **原始 APDU 指令调试**（手动构造并发送 ISO 7816 指令）
- **测试数据写入**（向 0008/0009 文件写入模拟燃气表数据）

### 1.3 技术栈

| 层级 | 技术 |
|------|------|
| 运行环境 | 浏览器（支持 WebSocket 的现代浏览器） |
| 前端 UI | HTML5 + CSS3（iOS26 毛玻璃风格、响应式布局） |
| 业务逻辑 | 原生 JavaScript (ES6+ async/await) |
| 加密算法 | CryptoJS（DES / 3DES / MAC 计算） |
| 硬件通信 | WebSocket → 本地读写器服务 (DCRF32) |
| 卡通信协议 | ISO 7816-4 APDU 指令 |

---

## 二、项目文件清单

```
NFC_TEST/
├── LoadCpuTypeACardDemo.html    # 燃气卡读写界面（读卡 + 读冻结日志 + 写 Token）
├── OpenCpuTypeACardDemo.html    # 开卡界面（发卡、建立文件系统、装载密钥）
├── TestCpuTypeA.html             # APDU 原始指令测试界面（含测试数据写入）
├── typeacpu_command.js           # APDU 指令构造函数库
├── typeacpu_util.js              # 工具函数库（初始化、认证、加解密、数据转换）
├── dcrf32_client.js              # WebSocket 通信 + 读卡器硬件驱动接口
├── crypto-js.min.js              # CryptoJS 加密库（第三方便携版）
├── image/
│   └── vector-art-colorful-8140x8140-12144.jpg  # 背景图片
├── design_Doc/
│   ├── 泽兴燃气表cpu card 文件系统（26072301）.docx  # 燃气表卡文件系统设计文档
│   ├── NFC_TEST_项目说明文档.md                   # 本文档
│   ├── fix.md                                     # 问题修复记录
│   └── fix_history.md                             # 修复历史归档
└── .git/                         # Git 版本控制
```

---

## 三、功能模块详解

### 3.1 主界面模块

项目包含三个独立的 HTML 页面，各自承担不同的功能角色。所有页面统一采用 **iOS26 毛玻璃风格**（`backdrop-filter: blur()` + 半透明背景）和**响应式布局**，支持通过 `postMessage` 跨 iframe 同步背景设置。

#### 3.1.1 燃气卡读写界面（[LoadCpuTypeACardDemo.html](LoadCpuTypeACardDemo.html)）

**功能**: 读取燃气卡中的基本信息、燃气表状态、冻结日志与 Token 数据，并向卡内写入新的 Token。

**界面组成**:
- **卡基本信息区**: 密钥输入（16 字节 Hex）、卡序列号（只读）、表号 ID、用户 ID、卡类型
- **燃气表状态区**: 读取日期、表状态、累计气量、信用额度、表内余额、主电电压
- **冻结日志区**:
  - 日冻结（7 条，含日期和冻结量）
  - 月冻结（6 条，含月份和冻结量）
  - 关阀事件记录（3 条，含时间、事件类型、详情）
- **Token 数据区**: Token 数量下拉选择、5 组 Token（各 20 位数字）+ 对应的 result 状态码
- **操作按钮**: 读卡、写 Token、清除日志
- **日志输出区**: 可滚动只读文本框，实时显示命令执行过程
- **输入校验**: 密钥长度实时校验、Token 20 位数字格式实时校验（红色边框 + 错误提示）

**核心流程**:

1. **读卡流程** (`ReadTypeACPUCard`):
   ```
   初始化连接 → 读 MF 主目录文件 → 读 ADF01 应用目录文件
   ├── 选择 MF (3F00)
   ├── 3DES 外部认证
   ├── 选择 0016 文件 → 读持卡人基本信息（卡类型、表号、用户 ID）
   ├── 选择 ADF01 (1001)
   ├── 应用 3DES 认证 (keyID=01)
   ├── 选择 0008 文件 → 读燃气表状态（日期、表状态、阀门状态、累计气量、信用额度、余额、主电电压）
   ├── 选择 0009 文件 → 读冻结日志
   │   ├── 日冻结（7 条：起始日期 + 7×4B 日冻结量）
   │   ├── 月冻结（6 条：起始月份 + 6×4B 月冻结量）
   │   └── 关阀事件（3 条：事件数 + 3×9B 事件记录，各含类型/时间/详情）
   ├── 选择 001C 文件 → 读上次充值 Token（解析 BCD 编码）
   └── 解析并显示 5 组 Token 及其状态
   ```

2. **写卡流程** (`writeTypeACPUCard`):
   ```
   初始化连接 → 写 Token
   ├── 选择 MF (3F00) → 3DES 外部认证
   ├── 选择 ADF01 (1001)
   ├── 构造 Token 数据（Token 数 + 5×10字节 BCD Token + 5×1字节 Result）
   ├── MAC 计算保护 → 写 001C 文件
   └── 显示写入结果
   ```

#### 3.1.2 开卡界面（[OpenCpuTypeACardDemo.html](OpenCpuTypeACardDemo.html)）

**功能**: 对新卡进行发行操作，建立完整的文件系统结构并装载密钥。

**界面组成**:
- 卡序列号（只读）、初始密钥（16 字节 Hex）、主控密钥（16 字节 Hex）
- 卡类型（01=用户卡, 02=维护卡）、表号、用户 ID
- 操作按钮: 开卡、卡片擦除(3DES)、清除日志
- **输入校验**: 密钥长度实时校验（32 位 hex）、表号/用户 ID 非空校验（红色边框 + 错误提示）

**核心流程** (`ReadTypeACPUCard` → `OpenTypeACPUCard`):

```
初始化连接 → 初始密钥 3DES 认证 → 卡片擦除 → 建立文件系统
├── 建立 MF 目录文件 (CreateMFFile)
│   ├── 选择 MF (3F00)
│   ├── 创建密钥文件 (0000, 0x30 字节) — 存储 0x36 线路保护密钥 + 0x39 外部认证密钥
│   └── 创建持卡人基本数据文件 (0016, 0x2B 字节) — 写入卡类型、表号、用户 ID
├── 建立 ADF01 应用目录文件 (CreateADFFile)
│   ├── 创建 ADF01 目录 (1001, 0x800 字节)
│   ├── 创建应用密钥文件 (0x44 字节) — 装载 0x39 主控密钥(keyID=00)、0x39 外部认证密钥(keyID=01)、0x36 线路保护密钥(keyID=00)
│   ├── 创建燃气表状态文件 (0008, 0x22 字节) — 写入初始状态
│   ├── 创建燃气表冻结日志文件 (0009, 0x57 字节) — 写入全零初始值
│   └── 创建上次充值 Token 文件 (001C, 0x38 字节) — 初始化为 5 组空 Token
└── 发卡成功，断开连接
```

> **注意**: `ReadTypeACPUCard()` 是开卡入口，会依次执行：初始化 → 初始密钥认证（使用 initkey）→ 卡片擦除 → 建立文件系统。这是一个完整的"擦除+重建"流程。

**卡片擦除功能** (`ClearTypeACPUCard`):
```
初始化连接 → 选择 MF → 3DES 外部认证 → 发送 EraseDF 指令 (80 0E 00 00 00)
```

#### 3.1.3 APDU 测试界面（[TestCpuTypeA.html](TestCpuTypeA.html)）

**功能**: 提供原始 APDU 指令的发送与调试环境，并支持向文件 0008/0009 写入测试数据。

**界面组成**:
- **连接操作区**: 初始化连接、关闭连接、清除日志
- **认证区**: 密钥输入（含长度校验）+ 3DES 外部认证按钮
- **APDU 发送区**: 报文输入框 + 发送按钮
- **测试数据写入区**:
  - **文件 0008 写入**: 表状态(4B)、阀门状态(4B)、累计气量(4B)、信用额度(4B)、余额(4B)、主电电压(2B)
  - **文件 0009 写入**: 日冻结（起始日期 + 7 条日冻结量）、月冻结（起始月份 + 6 条月冻结量）、关阀事件（3 条，含类型/时间/详情）
- **日志输出文本框**

**测试数据写入流程** (`writeTestData0008` / `writeTestData0009`):
```
选择 MF (3F00) → 3DES 外部认证 → 选择 ADF01 (1001) → 打包数据 → MAC 保护写入目标文件
```

### 3.2 JavaScript 库模块

#### 3.2.1 [dcrf32_client.js](dcrf32_client.js) —— 硬件通信层

**职责**: 封装与 DCRF32 系列 NFC 读卡器的底层通信。

**核心功能**:
- **WebSocket 连接管理**: `openWs(url, timeout)` / `closeWs()`
  - 连接至 `ws://127.0.0.1:50150`
- **读卡器设备操作**（通过 WebSocket 转发至硬件驱动）:
  - `dc_init(port, baud)` — 打开设备
  - `dc_beep(handle, times)` — 蜂鸣
  - `dc_reset(handle, timeout)` — 射频复位
  - `dc_config_card(handle, type)` — 配置卡类型（65 = Type A）
  - `dc_card_n(handle, mode)` — 寻卡
  - `dc_pro_resetInt(handle)` — CPU 卡复位
  - `dc_pro_commandlinkInt(handle, len, data, timeout)` — CPU 卡 APDU 指令交互
  - `dc_exit(handle)` — 关闭设备
- **读卡器响应读取**: `ReadMessage(timeMs)`

> **架构说明**: 该工具采用 WebSocket 中转架构。浏览器端通过 WebSocket 与本地运行的读写器服务（端口 50150）通信，由该服务将指令转发给 USB 连接的 DCRF32 硬件读卡器。

#### 3.2.2 [typeacpu_command.js](typeacpu_command.js) —— APDU 指令构造库

**职责**: 按 ISO 7816-4 标准构造各类 CPU 卡 APDU 指令的十六进制报文。

**指令类型清单**:

| 函数 | CLA-INS | 功能说明 |
|------|---------|----------|
| `cmd_GetRandom(bytenum)` | 00 84 | 获取随机数（4/8 字节） |
| `cmd_ExternelAuthenticate(keyID, data)` | 00 82 | 外部认证 |
| `cmd_SelectFileByID(fileID)` | 00 A4 | 按文件 ID 选择文件 |
| `cmd_EraseDF()` | 80 0E | 擦除 DF 目录及下属文件 |
| `cmd_CreateKeyFile(fileID, fileSize, shortID)` | 80 E0 | 创建密钥文件（类型 3F） |
| `cmd_Write36Key(keyID, keyData)` | 80 D4 | 装载 0x36 线路保护密钥 |
| `cmd_Write39Key(keyID, keyData)` | 80 D4 | 装载 0x39 外部认证/主控密钥 |
| `cmd_WritePBOCKey(keyType, keyID, keyData)` | 80 D4 | 装载 PBOC 消费/圈存密钥 |
| `cmd_WritePinKey(keyID, keyData)` | 80 D4 | 装载 0x3A 口令密钥 |
| `cmd_CreateBinaryFile(fileID, fileSize)` | 80 E0 | 创建二进制文件（类型 A8） |
| `cmd_CreateFixLenFile(fileID, fileSize)` | 80 E0 | 创建定长记录文件（类型 AA） |
| `cmd_CreateADFFile(fileID, fileSize)` | 80 E0 | 创建 ADF 目录文件（类型 38） |
| `cmd_CreatePBOCFile(fileID, recordID)` | 80 E0 | 创建 PBOC 电子钱包文件（类型 2F） |
| `cmd_CreateCycleFile(fileID, fileSize)` | 80 E0 | 创建循环记录文件（类型 2E） |
| `cmd_CreateLogFile(fileID, fileSize)` | 80 E0 | 创建日志文件（类型 A8） |
| `cmd_VerifyPin(keyID, keyData)` | 00 20 | PIN 口令验证 |
| `cmd_LoadInitialize(keyID, amount, terminalID)` | 80 50 | 圈存初始化 |
| `cmd_Load(tranTime, mac2)` | 80 52 | 圈存确认 |
| `cmd_PurchaseInitialize(...)` | 80 50 | 消费初始化 |
| `cmd_Purchase(tranNo, tranTime, mac1)` | 80 54 | 消费确认 |
| `ReadBinary(fileID, readSize)` | 00 B0 | 读二进制文件 |
| `ReadRecord(seqNoStr, fileID, readSize)` | 00 B2 | 读记录文件 |
| `ReadEpBalance()` | 80 5C | 读电子钱包余额 |
| `cmd_UpdateBinary(fileID, fileData)` | 04 D6 | 更新二进制文件（含 MAC 预留位） |
| `cmd_UpdateRecord(fileID, fileData)` | 04 E2 | 更新记录文件（含 MAC 预留位） |

> **注意**: `cmd_UpdateBinary` 和 `cmd_UpdateRecord` 构造的指令 Lc 已包含 4 字节 MAC 预留空间，实际 MAC 由 `WriteFileData()` 在发送前拼接。

#### 3.2.3 [typeacpu_util.js](typeacpu_util.js) —— 工具函数库

**职责**: 提供高层业务逻辑封装，包括卡初始化、认证流程、加解密、数据格式转换等。

**核心功能模块**:

**1. 卡初始化** (`init`):
```
openWs → dc_init → dc_reset → dc_config_card(TypeA) → dc_card_n → dc_pro_resetInt
返回: {code, msg, data: {cardID, handle}}
```
初始化时会自动降级使用 `defaulthandle` 全局变量作为备用 handle。

**2. 认证流程**:
- `externalAuthenticate(keyID, key)` — DES 外部认证:
  ```
  获取 8 字节随机数 → DES 加密(ECB/Pkcs7) → 外部认证指令
  ```
- `tripleDesExternalAuthenticate(keyID, key)` — 3DES 外部认证:
  ```
  获取 8 字节随机数 → 3DES 加密(ECB/Pkcs7) → 外部认证指令
  ```

**3. 指令发送** (`sendCommand`):
- 通过 `dc_pro_commandlinkInt` 发送 APDU 指令
- 自动解析返回的状态字（SW1 SW2）
- 返回结构化结果 `{code, msg, data}`
- 当 handle 未定义时自动回退到 `defaulthandle`

**4. 文件写入** (`WriteFileData`):
```
选择文件 → 获取 4 字节随机数 → MAC 计算（ICV: 随机数+00000000）→ 拼接 MAC 后写入
```
- 当密钥长度为 16 字节（32 hex）时使用 `MacCalculate` 标准 MAC
- 当密钥长度为 32 字节（64 hex）时使用 `MacCalculate16` 3DES MAC

**5. 圈存/消费交易**（已实现，在读写界面中被注释）:
- `load(pin, keyID, key36, amount, terminalID, tranTime)` — 完整圈存流程
  - 验证 PIN → 圈存初始化 → 获取过程密钥 → 验证 MAC1 → 计算 MAC2 → 执行圈存
- `purchase(keyID, key36, amount, terminalID, tranTime)` — 完整消费流程
  - 消费初始化 → 获取过程密钥 → 计算 MAC1 → 执行消费

**6. 加密算法**:
- `DesEncrypt(data, key)` — DES ECB 加密（CryptoJS, Pkcs7 填充）
- `TripleDESEncrypt(data, key)` — 3DES ECB 加密（CryptoJS, Pkcs7 填充）
- `MacCalculate16(data, processKey, icv)` — 16 字节密钥 MAC 计算（3DES CBC-MAC 标准流程）
  - K1(左8字节) DES 加密 → K2(右8字节) DES 解密 → K1 DES 加密（Triple-DES MAC）
  - 返回 4 字节 MAC
- 原 `MacCalculate`（8 字节密钥，DES CBC-MAC）已被注释，当前使用 `MacCalculate16`

**7. 数据转换工具**:

| 函数 | 功能 |
|------|------|
| `ascii2str(asciiStr)` | 十六进制 ASCII → 字符串 |
| `str2ascii(str)` | 字符串 → 十六进制 ASCII |
| `buildPaddedFrame(str)` | 字符串 → [1B长度][≤20B数据][00填充] 帧（21 字节） |
| `bytesToHex(bytes)` | Uint8Array → 十六进制字符串 |
| `decimal20ToBCD10(decStr)` | 20 位十进制 → 10 字节压缩 BCD |
| `bcdToDecimal(bcdBytes)` | 10 字节 BCD → 20 位十进制字符串 |
| `hexToBcd(hexStr)` | 十六进制 → BCD 字节数组 |
| `Toint8(uint)` | 无符号整型 → 有符号 Int8 |
| `int8StrToHex(numStr)` | 数字字符串 → Int8 十六进制表示（2 hex） |
| `dateFormat(fmt, date)` | 日期格式化（十进制输出） |
| `dateFormatHex(fmt, date)` | 日期格式化（十六进制输出） |

---

## 四、系统架构

### 4.1 整体架构图

```
┌─────────────────────────────────────────────────────────┐
│                     浏览器 (HTML/JS)                      │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ LoadCpuTypeA │  │ OpenCpuTypeA │  │ TestCpuTypeA  │  │
│  │ CardDemo.html│  │ CardDemo.html│  │   .html       │  │
│  │  (读写界面)   │  │  (开卡界面)   │  │ (APDU测试界面) │  │
│  └──────┬───────┘  └──────┬───────┘  └───────┬───────┘  │
│         │                 │                   │          │
│         └─────────┬───────┴───────────────────┘          │
│                   ▼                                      │
│  ┌──────────────────────────────────────────────────┐    │
│  │           typeacpu_util.js (业务逻辑层)            │    │
│  │  init / sendCommand / WriteFileData / 认证 / 交易  │    │
│  └──────┬───────────────────────┬───────────────────┘    │
│         │                       │                        │
│         ▼                       ▼                        │
│  ┌──────────────┐    ┌──────────────────────┐           │
│  │typeacpu_     │    │   crypto-js.min.js   │           │
│  │command.js    │    │   (DES/3DES/MAC)     │           │
│  │(APDU指令构造) │    └──────────────────────┘           │
│  └──────┬───────┘                                        │
│         │                                                │
│         ▼                                                │
│  ┌──────────────────────┐                                │
│  │  dcrf32_client.js    │                                │
│  │  (WebSocket 通信层)   │                                │
│  └──────────┬───────────┘                                │
└─────────────┼────────────────────────────────────────────┘
              │ WebSocket (ws://127.0.0.1:50150)
              ▼
┌─────────────────────────────┐
│   本地读写器服务 (DCRF32)     │
│   端口: 50150                │
└─────────────┬───────────────┘
              │ USB
              ▼
┌─────────────────────────────┐
│   DCRF32 NFC 读卡器硬件      │
│   (非接触式 Type A 读写)      │
└─────────────┬───────────────┘
              │ 13.56MHz RFID
              ▼
┌─────────────────────────────┐
│   燃气表 Type A CPU 卡        │
│   (泽兴燃气智能卡)            │
└─────────────────────────────┘
```

### 4.2 数据流说明

1. **用户操作** → HTML 界面按钮触发 JavaScript 异步函数（含输入校验）
2. **业务逻辑** → `typeacpu_util.js` 调用 `typeacpu_command.js` 构造 APDU 指令
3. **加密处理** → 需要 MAC 计算/认证的指令通过 `crypto-js.min.js` 进行 DES/3DES 加密
4. **指令发送** → `sendCommand()` 通过 `dcrf32_client.js` 的 `dc_pro_commandlinkInt()` 将指令经 WebSocket 发送至本地服务
5. **硬件执行** → 本地服务通过 USB 将 APDU 转发给 DCRF32 读卡器，读卡器通过 13.56MHz 射频与 CPU 卡交互
6. **响应返回** → 卡片响应按原路径返回，在 `sendCommand()` 中解析状态字并记录日志

### 4.3 UI 架构特性

- **iOS26 毛玻璃风格**: 统一 `glass-card` 样式 — `backdrop-filter: blur(24px) saturate(1.2)` + 半透明白色背景 + 圆角 28px + 柔和阴影
- **响应式设计**: `@media (max-width: 900px)` 下表格单元格纵向堆叠
- **Apple 字体体系**: `system-ui, -apple-system, 'Segoe UI', sans-serif` + `antialiased` 平滑
- **实时输入校验**: 密钥长度、Token 格式、必填项非空 — 红色边框 + 错误提示文字
- **跨 iframe 通信**: 各页面监听 `window.message` 事件，支持父框架动态设置背景图片

---

## 五、卡文件系统结构

基于代码分析，泽兴燃气表 CPU 卡的文件系统结构如下：

```
MF (3F00) —— 主目录
├── 0000 — 密钥文件 (Key File, 0x30 字节)
│   ├── 0x36 (keyID=00) — 线路保护密钥（应用维护密钥）
│   └── 0x39 (keyID=00) — 外部认证密钥（应用主控密钥）
├── 0016 — 持卡人基本数据文件 (Binary, 0x2B = 43 字节)
│   ├── 卡类型 (1 字节: 01=用户卡, 02=维护卡)
│   ├── 表号/Utility ID (21 字节帧: 1B长度 + 最多20B ASCII + 00填充)
│   └── 用户 ID (21 字节帧: 1B长度 + 最多20B ASCII + 00填充)
├── 0008 — 燃气表状态文件 (Binary, 0x22 = 34 字节) [创建于 ADF01 下]
│   ├── 读取日期 (16 字节 hex: YYYYMMDDWWHHmmss + 4B 填充)
│   ├── 表状态 meterStatus (4 字节)
│   ├── 阀门状态 mask_status (4 字节)
│   ├── 累计气量 totalGas (4 字节)
│   ├── 信用额度 creditLimit (4 字节)
│   ├── 表内余额 balance (4 字节)
│   └── 主电电压 mainVoltage (2 字节)
├── 0009 — 冻结日志文件 (Binary, 0x57 = 87 字节) [创建于 ADF01 下]
│   ├── 日冻结 (32 字节): 起始日(YY+MM+DD+条数, 4B) + 7×4B 日冻结量
│   ├── 月冻结 (27 字节): 起始月(YY+MM+条数, 3B) + 6×4B 月冻结量
│   └── 关阀事件 (28 字节): 事件数(1B) + 3×9B(类型2B+时间6B+详情1B)
│
└── ADF01 (1001) —— 燃气卡应用目录 (0x800 字节)
    ├── 密钥文件 (Key File, 0x44 字节)
    │   ├── 0x39 (keyID=00) — 应用主控密钥
    │   ├── 0x39 (keyID=01) — 外部认证密钥
    │   └── 0x36 (keyID=00) — 线路保护密钥（应用维护密钥）
    └── 001C — 上次充值 Token 文件 (Binary, 0x38 = 56 字节)
        ├── Token 数量 (1 字节)
        ├── Token1~5 (各 10 字节 BCD = 20 位数字)
        └── Result1~5 (各 1 字节 Int8: 00=未用, 01=成功, 02=失败, 88=初始空值, 99=待使用)
```

> **注意**: 代码中文件 0008 和 0009 虽然在 MF 层的 `CreateMFFile()` 中未创建，但在 `CreateADFFile()` 流程中（选择 ADF01 后）创建，实际归属于 ADF01 应用目录下。

### 密钥体系说明

| 密钥类型 | Key Type 值 | 用途 |
|----------|------------|------|
| 线路保护密钥 | 0x36 | 保护文件数据写入时的 MAC 计算 |
| 外部认证密钥 | 0x39 | 卡与终端之间的双向身份认证 |
| 应用主控密钥 | 0x39 | 最高权限密钥，用于创建文件系统和装载其他密钥 |
| 口令密钥 (PIN) | 0x3A | 持卡人身份验证（当前版本已注释） |
| 消费子密钥 | 0x3E | PBOC 消费交易密钥（当前版本已注释） |
| 圈存子密钥 | 0x3F | PBOC 圈存交易密钥（当前版本已注释） |
| TAC 密钥 | 0x34 | 交易验证码密钥（当前版本已注释） |

---

## 六、通信协议

### 6.1 WebSocket 协议

- **连接地址**: `ws://127.0.0.1:50150`
- **连接超时**: 10000ms
- **通信模式**: 请求-响应（基于 Promise 封装）
- **数据格式**: 读卡器专用二进制帧协议（由 `dcrf32_client.js` 封装）

### 6.2 APDU 指令格式（ISO 7816-4）

```
+------+------+------+------+------+--------+------+
| CLA  | INS  |  P1  |  P2  |  Lc  |  Data  |  Le  |
+------+------+------+------+------+--------+------+
```

- **CLA**: 指令类别（00=标准, 80=专有, 04=带 MAC）
- **INS**: 指令代码
- **P1/P2**: 参数
- **Lc**: 数据长度
- **Data**: 数据域
- **Le**: 期望响应长度

### 6.3 安全报文格式

写文件操作使用**线路保护 MAC**，在指令数据后附加 4 字节 MAC：

```
UpdateBinary = CLA(04) + INS(D6) + P1 + P2 + Lc + [原始数据 + MAC(4字节)]
```

MAC 计算流程（`WriteFileData`）：
1. 选择目标文件
2. 获取 4 字节随机数
3. 以 `随机数 + "00000000"` 为 ICV，对数据计算 MAC
   - 16 字节密钥：使用 `MacCalculate16`（3DES CBC-MAC）
   - 32 字节密钥：使用 `MacCalculate16`（3DES CBC-MAC）
4. MAC 附加到数据尾部发送

---

## 七、跨页面通信机制

所有三个 HTML 页面均支持通过 `window.postMessage` 接收背景图片设置：

```javascript
window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'setBackground') {
        document.body.style.backgroundImage = e.data.backgroundImage;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundAttachment = 'fixed';
    }
});
```

这允许在主框架页面中统一控制各子页面的背景主题。

---

## 八、输入校验机制

| 页面 | 校验项 | 校验规则 | 视觉反馈 |
|------|--------|----------|----------|
| 开卡页面 | 初始密钥 | 必须 32 位 hex（16 字节） | 红色边框 + "请输入32个字符(16字节)" |
| 开卡页面 | 主控密钥 | 必须 32 位 hex（16 字节） | 红色边框 + "请输入32个字符(16字节)" |
| 开卡页面 | 表号 | 不能为空 | 红色边框 + "请输入表号" |
| 开卡页面 | 用户 ID | 不能为空 | 红色边框 + "请输入用户ID" |
| 读写页面 | 密钥 | 必须 32 位 hex（16 字节） | 红色边框 + "请输入32位密钥(16字节)" |
| 读写页面 | Token 1-5 | 必须 20 位数字 | 红色边框 + "请输入20位数字" |
| APDU 测试 | 密钥 | 必须 32 位 hex（16 字节） | 红色边框 + "请输入32个字符(16字节)" |

校验函数均以 `oninput` 事件实时触发，提交时（按钮点击）再次验证，不合法则 `alert` 并 `return` 终止。

---

## 九、版本历史

| 提交 ID | 说明 |
|---------|------|
| `c930a3f` | 综合优化：多iframe架构保留页面状态、毛玻璃iOS26风格、设置面板背景同步、SVG自定义图标、输入校验修复 |
| `c2f0f21` | 统一Apple风格字体体系：建立7级字体层级+字体平滑+修复样式不一致 |
| `6bfa5eb` | iOS26毛玻璃风格统一+读写界面输入校验+主框架页面 |
| `40056e6` | 优化APDU测试界面列宽：拆分为4个独立表格+colgroup定义列宽+修复关阀事件行宽度不一致 |
| `4ed7bef` | 优化各区块列宽：按内容长度分配宽度，冻结+关阀事件数据居中展示 |
| `a430485` | 拆分5个数据区块为独立表格，各自列宽互不影响 |
| `a3ae258` | 新增APDU测试界面0008/0009文件数据写入功能，修复写入流程(选择MF→外部认证→选择ADF→写入) |
| `5423c51` | 新增关阀事件记录数据解析（文件0009 byte59-86） |
| `da7ec7b` ~ `c091e39` | 多轮列宽优化、table-layout:fixed、colgroup调整、边界bug修复 |
| `f54b9f6` | 修复移除width:95%导致INPUT与id连写问题 |
| `6cbf11c` | 修复选择0009失败时return导致后续token/result读取被跳过 |
| `e72b5f2` | NFC 测试工具初始提交 |
| `9a8f6fc` | 上传设计文档 |

当前分支: `main`

---

## 十、开发与使用说明

### 10.1 运行环境要求

- **操作系统**: Windows 10+
- **浏览器**: Chrome / Edge（支持 WebSocket 和 ES6）
- **硬件**: DCRF32 系列非接触式 IC 卡读写器（USB 连接）
- **服务**: 本地读写器 WebSocket 服务运行于 `127.0.0.1:50150`

### 10.2 使用步骤

1. 确保 DCRF32 读卡器已通过 USB 连接并安装驱动
2. 启动本地读写器 WebSocket 服务（监听 50150 端口）
3. 在浏览器中打开对应的 HTML 页面
4. 将 Type A CPU 卡放置在读卡器感应区
5. 执行相应的读卡/写卡/开卡操作

### 10.3 注意事项

- 开卡操作（OpenCpuTypeACardDemo.html）会**先擦除卡片再建立文件系统**，请确认卡片可被重新发行
- 开卡流程使用两个密钥：**初始密钥**（用于擦除前的认证）和**主控密钥**（用于建立文件系统和装载新密钥）
- 写文件操作自动进行 MAC 计算保护，密钥需与卡内装载的线路保护密钥一致
- Token 数据需为 20 位十进制数字，系统自动转换为 BCD 编码存储
- Result 状态码含义：00=未使用, 01=成功, 02=失败, 88=初始空值, 99=待使用
- 默认密钥 `FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF` 为测试密钥，生产环境需替换
- 冻结日志文件 0009 的日冻结和月冻结日期基于起始日期倒推计算

---

## 十一、已知限制与改进方向

1. **已注释功能**: 圈存/消费交易流程（PBOC 电子钱包）、免费用水记录、交易记录读取等功能在代码中已实现但被注释，注释原因推测为当前燃气卡版本暂不需要
2. **单卡操作**: 当前不支持多卡同时操作
3. **错误处理**: 部分认证失败场景使用了 `// return;` 注释（不阻断流程），可能存在安全风险
4. **密钥写死**: 界面提供密钥输入框，但部分场景中默认值硬编码，生产使用需注意
5. **日志系统**: 当前仅使用 textarea 显示日志，无日志导出或持久化功能
6. **debugger 语句**: `DesEncrypt` 和 `TripleDESEncrypt` 函数中含有 `debugger` 断点语句，生产环境应移除

---

> **文档更新日期**: 2026-07-24
> **分析版本**: commit `c930a3f` (main 分支)
> **关联设计文档**: `design_Doc/泽兴燃气表cpu card 文件系统（26072301）.docx`
