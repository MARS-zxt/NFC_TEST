var defaulthandle;
init = async function () {
    var resp = { code: -1, msg: "", data: "" };
    var respMsg = "";
    var st;
    var myFlag = await openWs("ws://127.0.0.1:50150", 10000)
    respMsg = respMsg + ">>开始卡片初始化连接设置(打开设备、设备蜂鸣、射频复位、设置卡类型、寻卡、卡复位)" + "\r\n";
    handle = await dc_init(100, 115200);
    defaulthandle = handle;
    if (handle <= 0) {
        respMsg = respMsg + "<<dc_init打开usb端口读写卡器设备error" + "\r\n";
        resp.msg = respMsg;
        return resp;
    }
    /*st = await dc_beep(handle, 5);
    if (st != 0) {
        respMsg = respMsg + "<<dc_beep设备蜂鸣error" + "\r\n";
        await dc_exit(handle);
        resp.msg = respMsg;
        return resp;
    }*/
    result = await dc_reset(handle, 10)
    if (result[0] !== 0) {
        respMsg = respMsg + "<<dc_reset设备射频复位error" + "\r\n";
        await dc_exit(handle);
        resp.msg = respMsg;
        return resp;
    }
    result = await dc_config_card(handle, 65)
    if (result[0] !== 0) {
        respMsg = respMsg + "<<dc_config_card配置非接触式Type A卡类型error" + "\r\n";
        await dc_exit(handle);
        resp.msg = respMsg;
        return resp;
    }
    result = await dc_card_n(handle, 0)
    if (result[0] !== 0) {
        respMsg = respMsg + "<<dc_card_n寻卡error" + "\r\n";
        await dc_exit(handle);
        resp.msg = respMsg;
        return resp;
    }
    respMsg = respMsg + "<<卡序列号:" + result[2] + "\r\n";
    var cardID = result[2];
    result = await dc_pro_resetInt(handle)
    if (result[0] !== 0) {
        respMsg = respMsg + "<<dc_pro_resetInt非接触式CPU卡复位error" + "\r\n";
        await dc_exit(handle);
        resp.msg = respMsg;
        return resp;
    }
    respMsg = respMsg + "<<完成卡片初始化连接设置" + "\r\n";
    resp.code = 0;
    resp.msg = respMsg;
    resp.data = { cardID: cardID, handle: handle };
    return resp;
}

externalAuthenticate = async function (keyID,key) {
    var respMsg = "";
    //1.获取8字节随机数
    respMsg = respMsg + "--1.获取8字节随机数" + "\r\n";
    sdata = cmd_GetRandom(8);
    result = await sendCommand(sdata);
    respMsg=respMsg+result.msg;
    if (result.code !== 0 || result.data.substr(result.data.length-4,4)!="9000") {
        result.msg=respMsg;
        return result;
    }
    //2.8字节随机数进行DES加密
    var src = result.data.substr(0,16);
    respMsg = respMsg + "--2.随机数进行DES加密" + "\r\n";
    respMsg = respMsg + ">>原文：" + src+ "\r\n";

    var encryptedStr = DesEncrypt(src,key);
    respMsg = respMsg + "<<加密结果：" + encryptedStr + "\r\n";
    //3.外部认证
    respMsg = respMsg + "--3.外部认证" + "\r\n";
    sdata = cmd_ExternelAuthenticate(keyID, encryptedStr);
    result = await sendCommand(sdata);
    result.msg=respMsg+result.msg;
    return result;
}

tripleDesExternalAuthenticate = async function (keyID,key) {
	    var respMsg = "";
	    //1.获取8字节随机数
	    respMsg = respMsg + "--1.获取8字节随机数" + "\r\n";
	    sdata = cmd_GetRandom(8);
	    result = await sendCommand(sdata);
	    respMsg=respMsg+result.msg;
	    if (result.code !== 0 || result.data.substr(result.data.length-4,4)!="9000") {
	        result.msg=respMsg;
	        return result;
	    }
	    //2.8字节随机数进行3DES加密
	    var src = result.data.substr(0,16);
	    respMsg = respMsg + "--2.随机数进行3DES加密" + "\r\n";
	    respMsg = respMsg + ">>原文：" + src+ "\r\n";
	    var encryptedStr = TripleDESEncrypt(src,key);
	    respMsg = respMsg + "<<加密结果：" + encryptedStr + "\r\n";
        //3.外部认证
        respMsg = respMsg + "--3.3DES认证" + "\r\n";
        sdata = cmd_ExternelAuthenticate(keyID, encryptedStr);
        result = await sendCommand(sdata);
            result.msg=respMsg+result.msg;
	    return result;
	}


sendCommand = async function (command,handle) {
    var resp = { code: -1, msg: "", data: "" };
    var respMsg = "";
    sdata = command.replace(/\s*/g, "");
    if (sdata == "") {
        alert("先设置发送报文");
        resp.msg = "<<报文为空"+ "\r\n";
        return resp;
    }
    if (typeof (handle) == "undefined") {
        handle=defaulthandle;
    }
    if (typeof (handle) == "undefined") {
        alert("先进行初始化连接");
        resp.msg = "<<连接为空"+ "\r\n";
        return resp;
    }
    /*
    dc_pro_commandlinkInt非接触式CPU卡指令交互
    传入参数:设备标识符、发送数据的长度、发送数据、超时时间(单位为250ms，建议值为7)
    传出参数:返回数据的长度、返回的数据
    result[0] 执行结果,0成功
    result[1] 返回数据的长度
    result[2] 返回的数据
    */
    respMsg = respMsg + ">>request:" + sdata + "\r\n";
    result = await dc_pro_commandlinkInt(handle, sdata.length / 2, sdata, 7);
    if (result[0] !== 0) {
        respMsg = respMsg + "<<error:" + result[0] + "\r\n";
        await dc_exit(handle);
        resp.msg = respMsg;
        resp.code = result[0];
        return resp;
    }
    resp.code = 0;
    resp.data = result[2];
    resp.msg = respMsg + "<<response:" + result[2] + "\r\n";
    return resp;
}

load = async function (pin,keyID,key36,loadAmount,terminalID,tranTime) {
    var respMsg = "";
    //1.圈存验证PIN
    sdata = cmd_VerifyPin("00",pin);
    respMsg = respMsg + ">>1.圈存验证PIN" + "\r\n";
    result = await sendCommand(sdata);
    respMsg=respMsg+result.msg;
    if (result.code !== 0 || result.data.substr(result.data.length-4,4)!="9000") {
        result.msg=respMsg;
        return result;
    }
    //2.圈存初始化
    amount = (loadAmount * 10).toString(16);
    zeroNum = 8 - amount.length;
    for (var i = 0; i < zeroNum; i++) {
        amount = "0" + amount;
    }
    sdata = cmd_LoadInitialize(keyID,amount,terminalID);
    respMsg = respMsg + ">>2.圈存初始化" + "\r\n";
    result = await sendCommand(sdata);
    respMsg=respMsg+result.msg;
    if (result.code !== 0 || result.data.substr(result.data.length-4,4)!="9000") {
        result.msg=respMsg;
        return result;
    }
    //3.进行MAC2计算
    respMsg = respMsg + ">>3.解析初始化返回结果，获取过程密钥" + "\r\n";
    var balance = result.data.substr(0, 8); //旧余额
    var random = result.data.substr(16, 8); //随机数
    var seriesno = result.data.substr(8, 4); //交易序号
    var cardmac1 = result.data.substr(24, 8); //MAC1
    var src = random + seriesno + "8000";
    respMsg = respMsg + ">>原文：" + src+ "\r\n";
    var encryptedStr = DesEncrypt(src,key36);
    respMsg = respMsg + "<<加密结果：" + encryptedStr + "\r\n";
    // 验证MAC1
    respMsg = respMsg + ">>4.验证MAC1" + "\r\n";
    var data1 = balance + amount + "02" + terminalID;
    respMsg = respMsg + ">>原文：" + data1+ "\r\n";
    var mac1 = MacCalculate(data1, encryptedStr, '0000000000000000');
    respMsg = respMsg + "<<计算结果：" + mac1 + "\r\n";
    if (mac1 != cardmac1) {
        respMsg = respMsg + "<<MAC1验证失败" + "\r\n";
        result.msg=respMsg;
        return result;
    }
    // data和processKey进行mac2计算
    respMsg = respMsg + ">>5.计算MAC2" + "\r\n";
    var data = amount + "02" + terminalID + tranTime;
    respMsg = respMsg + ">>原文：" + data + "\r\n";
    var mac2 = MacCalculate(data, encryptedStr, '0000000000000000');
    respMsg = respMsg + "<<计算结果：" + mac2 + "\r\n";
    //4.圈存
    respMsg = respMsg + ">>6.圈存" + "\r\n";
    sdata = cmd_Load(tranTime,mac2);
    result = await sendCommand(sdata);
    result.msg=respMsg+result.msg;
    return result;
}

purchase = async function (keyID,key36,purchaseAmount,terminalID,tranTime) {
    var respMsg = "";
    //1.消费初始化
    amount = (Math.abs(purchaseAmount) * 10).toString(16);
    zeroNum = 8 - amount.length;
    for (var i = 0; i < zeroNum; i++) {
        amount = "0" + amount;
    }
    sdata = cmd_PurchaseInitialize(keyID,amount,terminalID);
    respMsg = respMsg + ">>1.消费初始化" + "\r\n";
    result = await sendCommand(sdata);
    respMsg=respMsg+result.msg;
    if (result.code !== 0 || result.data.substr(result.data.length-4,4)!="9000") {
        result.msg=respMsg;
        return result;
    }
    //2.进行MAC1计算 00018704 0000 000000 01 01 D04252BE 9000
    respMsg = respMsg + ">>2.解析初始化返回结果，获取过程密钥" + "\r\n";
    var balance = result.data.substr(0, 8); //旧余额
    var random = result.data.substr(22, 8); //随机数
    var seriesno = result.data.substr(8, 4); //交易序号
    var tranNo = dateFormat("MMDD", new Date()) + seriesno;
    var src = random + seriesno + seriesno; // 终端交易序号的最右两个字节，与消费命令的终端交易序号对应
    respMsg = respMsg + ">>原文：" + src+ "\r\n";
    var encryptedStr = DesEncrypt(src,key36);
    respMsg = respMsg + "<<加密结果：" + encryptedStr + "\r\n";
    // data和processKey进行mac1计算
    respMsg = respMsg + ">>3.计算MAC1" + "\r\n";
    var data = amount + "06" + terminalID + tranTime;
    respMsg = respMsg + ">>原文：" + data+ "\r\n";
    var mac2 = MacCalculate(data, encryptedStr, '0000000000000000');
    respMsg = respMsg + "<<计算结果：" + mac2 + "\r\n";
    //4.消费
    respMsg = respMsg + ">>4.消费" + "\r\n";
    sdata = cmd_Purchase(tranNo,tranTime,mac2);
    result = await sendCommand(sdata);
    result.msg=respMsg+result.msg;
    return result;
}

WriteFileData = async function (fileId, fileData,key) {
    var respMsg = "";
    //1.选择文件
    respMsg = respMsg + ">>1.选择文件" + "\r\n";
    sdata = cmd_SelectFileByID(fileId);
    result = await sendCommand(sdata);
    respMsg=respMsg+result.msg;
    if (result.code !== 0  || result.data.substr(result.data.length-4,4)!="9000") {
        result.msg=respMsg;
        return result;
    }
    //2.获取4字节随机数
    respMsg = respMsg + ">>2.获取4字节随机数" + "\r\n";
    sdata = cmd_GetRandom(4);
    result = await sendCommand(sdata);
    respMsg=respMsg+result.msg;
    if (result.code !== 0 || result.data.substr(result.data.length-4,4)!="9000") {
        result.msg=respMsg;
        return result;
    }
    //3.MAC计算:偏移量为4字节随机数+00000000,密钥为线路保护密钥FF,数据为除了MAC以外的数据
    respMsg = respMsg + ">>3.进行MAC计算" + "\r\n";
    var mac
    if (key.length == 16) {
        mac = MacCalculate(fileData, key, result.data.substr(0, 8) + "00000000")// data和processKey进行mac2计算
    }else{
        mac = MacCalculate16(fileData, key, result.data.substr(0, 8) + "00000000")// data和processKey进行mac2计算
    }

    respMsg=respMsg+ '>>mac' + mac  + "\r\n";
    //4.写入数据
    respMsg = respMsg + ">>4.写入数据" + "\r\n";
    sdata = fileData + mac;
    result = await sendCommand(sdata);
    respMsg=respMsg+result.msg;
    result.msg=respMsg;
    return result;
}
//    FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF 
MacCalculate16 = function (data, processKey, icv) {
    // 1. 拆分16字节密钥为K1(左8字节)和K2(右8字节)
    var keyHex = CryptoJS.enc.Hex.parse(processKey);
    var K1 = CryptoJS.lib.WordArray.create(keyHex.words.slice(0, 2), 8);
    var K2 = CryptoJS.lib.WordArray.create(keyHex.words.slice(2, 4), 8);

    var icvBtyes = CryptoJS.enc.Hex.parse(icv);
    var message = CryptoJS.enc.Hex.parse(data + '80');
    var dataLength = message.sigBytes - 1;
    var blockCount = parseInt(dataLength / 8) + 1;

    // 2. 第一步：D1 与 8字节初始值(ICV)异或
    var desXorBytes = [];
    var desXor0 = message.words[0] ^ icvBtyes.words[0];
    var desXor1 = message.words[1] ^ icvBtyes.words[1];
    desXorBytes[0] = desXor0;
    desXorBytes[1] = desXor1;
    var desXor = CryptoJS.lib.WordArray.create();
    desXor.words = desXorBytes || [];
    desXor.sigBytes = 8;

    // 3. 中间迭代：按流程图，每块都用K1加密后再和下一块异或
    for (var i = 1; i < blockCount; i++) {
        // 用16字节密钥的左半部分(K1)进行DES加密（ECB模式，无填充）
        var encrypted = CryptoJS.DES.encrypt(desXor, K1, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.NoPadding
        });
        var desStr = encrypted.ciphertext.toString().toUpperCase().substr(0, 16);
        var des = CryptoJS.enc.Hex.parse(desStr);

        // 与下一块数据异或
        desXorBytes = [];
        desXor0 = message.words[2 * i] ^ des.words[0];
        desXorBytes[0] = desXor0;
        if (typeof (message.words[2 * i + 1]) != "undefined") {
            desXor1 = message.words[2 * i + 1] ^ des.words[1];
            desXorBytes[1] = desXor1;
        } else {
            desXor1 = des.words[1];
            desXorBytes[1] = desXor1;
        }

        desXor = CryptoJS.lib.WordArray.create();
        desXor.words = desXorBytes || [];
        desXor.sigBytes = 8;
    }

    // 4. 最后三步，严格按流程图执行
    // 步骤1：用16字节密钥的左半部分(K1)DES加密
    var step1 = CryptoJS.DES.encrypt(desXor, K1, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.NoPadding
    });
    var block1 = CryptoJS.enc.Hex.parse(step1.ciphertext.toString());

    // 步骤2：用16字节密钥的右半部分(K2)DES解密
    var step2 = CryptoJS.DES.decrypt({ ciphertext: block1 }, K2, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.NoPadding
    });

    // 步骤3：再用16字节密钥的左半部分(K1)DES加密
    var step3 = CryptoJS.DES.encrypt(step2, K1, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.NoPadding
    });

    // 得到8字节的计算结果（卡片一般取前4字节）
    var desStr = step3.ciphertext.toString().toUpperCase().substr(0, 8);
    return desStr;
};
// MacCalculate = function (data, processKey, icv) {
//     var keyHex = CryptoJS.enc.Hex.parse(processKey);
//     var icvBtyes = CryptoJS.enc.Hex.parse(icv);
//     var message = CryptoJS.enc.Hex.parse(data + '80');
//     var dataLength = message.sigBytes - 1;
//     var blockCount = parseInt(dataLength / 8) + 1;
//     //第一个8位与初始偏移量进行异或计算
//     var desXorBytes = [];
//     var desXor0 = message.words[0] ^ icvBtyes.words[0];
//     var desXor1 = message.words[1] ^ icvBtyes.words[1];
//     desXorBytes[0] = desXor0;
//     desXorBytes[1] = desXor1;
//     var desXor = CryptoJS.lib.WordArray.create();
//     desXor.words = desXorBytes || [];
//     desXor.sigBytes = 8;
//     for (var i = 1; i < blockCount; i++) {
//         var encrypted = CryptoJS.DES.encrypt(desXor, keyHex, { iv: CryptoJS.enc.Hex.parse("0000000000000000"), mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
//         var desStr = encrypted.ciphertext.toString().toUpperCase().substr(0, 16);
//         var des = CryptoJS.enc.Hex.parse(desStr);
//         desXorBytes = [];
//         desXor0 = message.words[2 * i] ^ des.words[0];
//         desXorBytes[0] = desXor0;
//         if (typeof (message.words[2 * i + 1]) != "undefined") {
//             desXor1 = message.words[2 * i + 1] ^ des.words[1];
//             desXorBytes[1] = desXor1;
//         } else {
//             desXor1 = des.words[1];
//             desXorBytes[1] = desXor1;
//         }
//         desXor = CryptoJS.lib.WordArray.create();
//         desXor.words = desXorBytes || [];
//         desXor.sigBytes = 8;
//     }
//     var encrypted = CryptoJS.DES.encrypt(desXor, keyHex, { iv: CryptoJS.enc.Hex.parse("0000000000000000"), mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
//     var desStr = encrypted.ciphertext.toString().toUpperCase().substr(0, 8);
//     return desStr;
// }

DesEncrypt = function (data, key) {
    var keyHex = CryptoJS.enc.Hex.parse(key);
    var message = CryptoJS.enc.Hex.parse(data);
    debugger
    var encrypted = CryptoJS.DES.encrypt(message, keyHex, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 });
    var encryptedStr = encrypted.ciphertext.toString().toUpperCase().substr(0, 16);
    return encryptedStr;
}

TripleDESEncrypt = function (data, key) {
    var keyHex = CryptoJS.enc.Hex.parse(key);
    var message = CryptoJS.enc.Hex.parse(data);
    debugger
    var encrypted = CryptoJS.TripleDES.encrypt(message, keyHex, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 });
    var encryptedStr = encrypted.ciphertext.toString().toUpperCase().substr(0, 16);
    return encryptedStr;
}

dateFormat = function (fmt, date) {
    let ret;
    const opt = {
        "Y+": date.getFullYear().toString(),        // 年
        "M+": (date.getMonth() + 1).toString(),     // 月
        "D+": date.getDate().toString(),            // 日
        "H+": date.getHours().toString(),           // 时
        "m+": date.getMinutes().toString(),         // 分
        "s+": date.getSeconds().toString()          // 秒
    };
    for (let k in opt) {
        ret = new RegExp("(" + k + ")").exec(fmt);
        if (ret) {
            fmt = fmt.replace(ret[1], (ret[1].length == 1) ? (opt[k]) : (opt[k].padStart(ret[1].length, "0")))
        };
    };
    return fmt;
}

ascii2str = function(asciiStr) {
    var str = "";
    for (var i = 0; i < asciiStr.length / 2; i++) {
        var tmp = parseInt(asciiStr.substr(i * 2, 2), 16);
        str = str + String.fromCharCode(tmp);
    }
    return str;
}

str2ascii = function(str) {
    var asciistr = "";
    for (var i = 0; i < str.length; i++) {
        var tmp = str.substr(i, 1).charCodeAt();
        asciistr = asciistr + tmp.toString(16);
    }
    return asciistr;
}
function bytesToHex(bytes) {
  return Array.from(bytes)
    .map(num => num.toString(16).padStart(2, '0'))
    .join('');
}
/**
 * 20位十进制字符串 → 10字节压缩BCD
 * @param {string} decStr - 必须是 20 个 0-9 的字符串
 * @returns {Uint8Array} 10 字节 BCD
 */
function decimal20ToBCD10(decStr) {
    // 校验：必须正好20位数字
    if (!/^\d{20}$/.test(decStr)) {
        throw new Error("必须传入正好20位十进制数字字符串");
    }

    const bcd = new Uint8Array(10); // 10字节结果
    for (let i = 0; i < 10; i++) {
        // 每2位十进制 → 1字节BCD
        const high = parseInt(decStr[i * 2], 10);   // 高4位
        const low  = parseInt(decStr[i * 2 + 1], 10); // 低4位
        bcd[i] = (high << 4) | low;
    }
    return bcd;
}

function hexToBcd(hexStr) {
  const bytes = new Uint8Array(10);
  for (let i = 0; i < 10; i++) {
    bytes[i] = parseInt(hexStr.substr(i * 2, 2), 16);
  }
  return bytes;
}

// BCD → 20位十进制字符串
function bcdToDecimal(bcdBytes) {
  let str = '';
  for (const byte of bcdBytes) {
    const h = (byte >> 4) & 0xF;
    const l = byte & 0xF;
    str += h + '' + l;
  }
  return str;
}

/**
 * 把【数字字符串】（正数/负数）转成 8位有符号 1字节 十六进制
 * 适用："4"、"-12"、"0"、"-1"、"10"、"-20" 等
 * @param {string} numStr 输入数字字符串（如 "-12"）
 * @returns {string} 2位十六进制（大写）
 */
function int8StrToHex(numStr) {
  // 第一步：把字符串转成数字
  const num = parseInt(numStr, 10);
  
  // 转成 8位有符号整数
  const byte = Int8Array.from([num])[0];
  
  // 转成 2位十六进制（自动补0）
  return (byte & 0xFF).toString(16).padStart(2, '0').toUpperCase();
}

function Toint8(uint) {
  // 把无符号数转为有符号数
  const uint8 = new Uint8Array([uint]);
  const int8 = new Int8Array(uint8.buffer);
return int8[0];
}