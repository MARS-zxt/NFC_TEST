# NFC 燃气表 CPU 卡测试工具

## 项目概述

基于浏览器的 NFC Type A CPU 卡测试工具，用于泽兴燃气表的开卡、读写卡、APDU 命令调试。

## 文件结构

| 文件 | 用途 | 是否修改 |
|------|------|----------|
| `OpenCpuTypeACardDemo.html` | 开卡页面（创建文件系统、写入初始数据） | ✅ |
| `LoadCpuTypeACardDemo.html` | 读写卡页面（读取/写入卡数据） | ✅ |
| `TestCpuTypeA.html` | 原始 APDU 命令测试 | ✅ |
| `typeacpu_util.js` | 工具函数（加解密、编码转换、认证） | ✅ |
| `typeacpu_command.js` | APDU 命令构造函数 | ✅ |
| `dcrf32_client.js` | 读卡器 WebSocket 驱动（外部库） | ❌ 不修改 |
| `crypto-js.min.js` | CryptoJS 加密库（第三方） | ❌ 不修改 |

## 编码约定

- **缩进**：4 空格（2026-07 已从 Tab 转换）
- **行尾**：CRLF（Windows）
- **全局变量**：`i1`/`i2`/`i3` 三级步骤计数器，`sdata`/`result`/`r` 临时变量
- **异步函数**：使用 `FuncName = async function() { ... }` 模式
- **APDU 响应**：`r.data` 是完整 hex 字符串（含尾部状态字 SW="9000"），`r.code` 是提取后的 SW
- **UI 模式**：每个 HTML 自包含（内联 HTML+CSS+JS），通过 `<script>` 引入共享 JS 库

## 卡文件系统数据格式

### 文件 0016 — 持卡人基本信息（43 字节 = 0x2B）

| 字节偏移 | 字段 | 格式 |
|---------|------|------|
| 0 | cardType | 01=用户卡, 02=维护卡 |
| 1-21 | utilityID | `buildPaddedFrame`: 1B长度 + 最多20B ASCII + 00填充 |
| 22-42 | userID | `buildPaddedFrame`: 1B长度 + 最多20B ASCII + 00填充 |

**写入**：`CreateCardHolderFile()` 在 `OpenCpuTypeACardDemo.html` 中定义。
**读取**：`readMFFile()` 在 `LoadCpuTypeACardDemo.html` 中定义，使用 `parsePaddedFrame()` 解析。

### 文件 0008 — 燃气表状态（34 字节 = 0x22）

| 字节偏移 | 字段 | 大小 |
|---------|------|------|
| 0-11 | readDate | 12B |
| 12-15 | meterStatus | 4B |
| 16-19 | mask_status | 4B |
| 20-23 | totalGas | 4B |
| 24-27 | creditLimit | 4B |
| 28-31 | balance | 4B |
| 32-33 | mainVoltage | 2B |

**写入**：`CreateCardStatusFile()` 在 `OpenCpuTypeACardDemo.html` 中定义。
**读取**：`readADF01File()` 在 `LoadCpuTypeACardDemo.html` 中定义。

### 文件 0009 — 燃气表冻结日志（88 字节 = 0x58）

二进制文件，创建和写入见 `CreateCardFreezeLogFile()`。

### 文件 001C — 上次充值 TOKEN（56 字节 = 0x38）

**写入**：`CreateLastTokenFile()`，**读取**：`readADF01File()`。

## 关键工具函数

| 函数 | 位置 | 用途 |
|------|------|------|
| `buildPaddedFrame(str)` | typeacpu_util.js:460 | ASCII 字符串 → [1B长度][≤20B数据][00填充] 帧 |
| `parsePaddedFrame(hexStr)` | LoadCpuTypeACardDemo.html | buildPaddedFrame 的逆操作 |
| `str2ascii(str)` | typeacpu_util.js:447 | 字符串 → hex ASCII 编码 |
| `ascii2str(hexStr)` | typeacpu_util.js:438 | hex ASCII 编码 → 字符串 |
| `cmd_CreateBinaryFile(id, size)` | typeacpu_command.js:120 | 创建二进制文件 APDU |
| `cmd_UpdateBinary(offset, data)` | typeacpu_command.js:284 | 更新二进制文件 APDU |
| `cmd_SelectFileByID(id)` | typeacpu_command.js:32 | 选择文件 APDU |
| `ReadBinary(offset, size)` | typeacpu_command.js:247 | 读取二进制文件 APDU |
| `CommandTypeACPU(cmd)` | 各 HTML 文件 | 发送 APDU 命令到读卡器 |
| `WriteFile(fileId, data)` | 各 HTML 文件 | 带 MAC 写入文件 |
| `getCardTypeText(val)` | LoadCpuTypeACardDemo.html | "01"/"1"→用户卡, "02"/"2"→维护卡 |

## 常见 Bug 模式

1. **`.value` vs `.textContent`**：`<span>` 用 `.textContent`，`<INPUT>` 用 `.value`
2. **Hex 字节 vs Hex 字符**：1 字节 = 2 hex 字符，slice 边界需 ×2
3. **数据帧格式**：不要直接用 `ascii2str()` 解析 `buildPaddedFrame` 生成的帧，须用 `parsePaddedFrame()` 按长度字段解析
4. **`r.data` 含 SW**：`CommandTypeACPU` 不剥离尾部 SW（"9000"），slice 需在数据范围内
5. **注释的 `return`**：多处错误处理中的 `return` 被注释掉，失败后继续执行

## Git 约定

- 中文 commit message
- 分支：main
