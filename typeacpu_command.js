'use strict'
var readStatus="F0";
var writeStatus="F0";
var errorTimes="FF";

function cmd_GetRandom(bytenum) {
    if (bytenum != 4 && bytenum != 8) {
        alert("bytenum must be 4 or 8");
        return;
    }
    var cla = "00";
    var ins = "84";
    var p1 = "00";
    var p2 = "00";
    var lc = "";
    var data = "";
    var le = "0" + bytenum;
    return cla + ins + p1 + p2 + lc + data + le;
}

function cmd_ExternelAuthenticate(keyID, encrptrdRandom) {
    var cla = "00";
    var ins = "82";
    var p1 = "00";
    var p2 = keyID;
    var lc = "08";
    var data = encrptrdRandom;
    var le = "";
    return cla + ins + p1 + p2 + lc + data + le;
}

function cmd_SelectFileByID(fileID) {
    var cla = "00";
    var ins = "A4";
    var p1 = "00";
    var p2 = "00";
    var lc = "02";
    var data = fileID;
    var le = "";
    return cla + ins + p1 + p2 + lc + data + le;
}

function cmd_EraseDF() {
    var cla = "80";
    var ins = "0E";
    var p1 = "00";
    var p2 = "00";
    var lc = "00";
    var data = "";
    var le = "";
    return cla + ins + p1 + p2 + lc + data + le;
}
function cmd_CreateKeyFile(fileID, fileSize, shortID) {
    var cla = "80";
    var ins = "E0";
    var p1p2 = fileID;
    var lc = "07";
    var fileType = "3F";
    var data = fileType + fileSize + shortID + readStatus + "FF" + "FF";
    var le = "";
    return cla + ins + p1p2 + lc + data + le;
}

function cmd_Write36Key(keyID, keyData) {
    var cla = "80";
    var ins = "D4";
    var p1 = "01";
    var p2 = keyID;
    var lc = "15";
    var data = "36" + readStatus + writeStatus + "FF" + errorTimes + keyData;
    var le = "";
    return cla + ins + p1 + p2 + lc + data + le;
}

function cmd_Write39Key(keyID, keyData) {
    var cla = "80";
    var ins = "D4";
    var p1 = "01";
    var p2 = keyID;
    var lc = "15";
    var data = "39" + "F0" + "F0" + "AA" + errorTimes + keyData;
    var le = "";
    return cla + ins + p1 + p2 + lc + data + le;
}

function cmd_WritePBOCKey(keyType, keyID, keyData) {
    var cla = "80";
    var ins = "D4";
    var p1 = "01";
    var p2 = keyID;
    var lc = "0D";
    var data = keyType + readStatus + writeStatus + "01" + "01" + keyData;
    var le = "";
    return cla + ins + p1 + p2 + lc + data + le;
}

function cmd_WritePinKey(keyID, keyData) {
    var cla = "80";
    var ins = "D4";
    var p1 = "01";
    var p2 = keyID;
    var lc = "08";
    var data = "3A" + "F0" + "EF" + "AA" + errorTimes + keyData;
    var le = "";
    return cla + ins + p1 + p2 + lc + data + le;
}


function cmd_CreateFixLenFile(fileID, fileSize) {
    var cla = "80";
    var ins = "E0";
    var p1p2 = fileID;
    var lc = "07";
    var fileType = "AA";
    var data = fileType + fileSize + readStatus + writeStatus + "FF" + "FF";
    var le = "";
    return cla + ins + p1p2 + lc + data + le;
}

function cmd_CreateBinaryFile(fileID, fileSize) {
    var cla = "80";
    var ins = "E0";
    var p1p2 = fileID;
    var lc = "07";
    var fileType = "A8";
    var data = fileType + fileSize + readStatus + writeStatus + "FF" + "FF";
    var le = "";
    return cla + ins + p1p2 + lc + data + le;
}

function cmd_CreateLogFile(fileID, fileSize) {
    var cla = "80";
    var ins = "E0";
    var p1p2 = fileID;
    var lc = "07";
    var fileType = "A8";
    var data = fileType + fileSize + readStatus + writeStatus + "FF" + "FF";
    var le = "";
    return cla + ins + p1p2 + lc + data + le;
}

function cmd_CreateADFFile(fileID, fileSize) {
    var cla = "80";
    var ins = "E0";
    var p1p2 = fileID;
    var lc = "0D";
    var fileType = "38";
    var data = fileType + fileSize + readStatus + writeStatus + "84" + "FFFF" + "ADF0000001";
    var le = "";
    return cla + ins + p1p2 + lc + data + le;
}

function cmd_CreatePBOCFile(fileID, recordID) {
    var cla = "80";
    var ins = "E0";
    var p1p2 = fileID;
    var lc = "07";
    var fileType = "2F";
    var data = fileType + "0208" + readStatus + "00" + "FF" + recordID;
    var le = "";
    return cla + ins + p1p2 + lc + data + le;
}


function cmd_CreateCycleFile(fileID, fileSize) {
    var cla = "80";
    var ins = "E0";
    var p1p2 = fileID;
    var lc = "07";
    var fileType = "2E";
    var data = fileType + fileSize + readStatus + "EF" + "FF" + "FF";
    var le = "";
    return cla + ins + p1p2 + lc + data + le;
}

function cmd_VerifyPin(keyID,keyData) {
    var cla = "00";
    var ins = "20";
    var p1 = "00";
    var p2 = keyID;
    var lc = "03";
    var data = keyData;
    var le = "";
    return cla + ins + p1+p2 + lc + data + le;
}

function cmd_LoadInitialize(keyID, amount, terminalID) {
    var cla = "80";
    var ins = "50";
    var p1 = "00";
    var p2 = "02";
    var lc = "0B";
    var data = keyID+amount+terminalID;
    var le = "10";
    return cla + ins + p1+p2 + lc + data + le;
}

function cmd_Load(tranTime,mac2) {
    var cla = "80";
    var ins = "52";
    var p1 = "00";
    var p2 = "00";
    var lc = "0B";
    var data = tranTime+mac2;
    var le = "04";
    return cla + ins + p1+p2 + lc + data + le;
}

function cmd_PurchaseInitialize(keyID, amount, terminalID) {
    var cla = "80";
    var ins = "50";
    var p1 = "01";
    var p2 = "02";
    var lc = "0B";
    var data = keyID+amount+terminalID;
    var le = "0F";
    return cla + ins + p1+p2 + lc + data + le;
}

function cmd_Purchase(tranNo,tranTime,mac1) {
    var cla = "80";
    var ins = "54";
    var p1 = "01";
    var p2 = "00";
    var lc = "0F";
    var data = tranNo+tranTime+mac1;
    var le = "08";
    return cla + ins + p1+p2 + lc + data + le;
}


function ReadOneRecord(seqNoStr, fileID) {
    return ReadRecord(seqNoStr, fileID, "00");
}

function ReadRecord(seqNoStr, fileID, readSize) {
    var cla = "00";
    var ins = "B2";
    var p1 = seqNoStr;
    var p2 = fileID;
    var lc = "";
    var data = "";
    var le = readSize;
    return cla + ins + p1 + p2 + lc + data + le;
}

function ReadBinary(fileID, readSize) {
    var cla = "00";
    var ins = "B0";
    var p1 = fileID;
    var p2 = "00";
    var lc = "";
    var data = "";
    var le = readSize;
    return cla + ins + p1 + p2 + lc + data + le;
}

function ReadEpBalance() {
    var cla = "80";
    var ins = "5C";
    var p1 = "00";
    var p2 = "02";
    var lc = "";
    var data = "";
    var le = "04";
    return cla + ins + p1 + p2 + lc + data + le;
}


function cmd_UpdateRecord(fileID, fileData) {
    var cla = "04";
    var ins = "E2";
    var p1 = "00";
    var p2 = fileID;
    var lc = (fileData.length/2+4).toString(16);
    if(lc.length==1){
        lc="0"+lc;
    }
    var data = fileData;
    var le = "";
    return cla + ins + p1 + p2 + lc + data + le;
}

function cmd_UpdateBinary(fileID, fileData) {
    var cla = "04";
    var ins = "D6";
    var p1 = fileID;
    var p2 = "00";
    var lc = (fileData.length/2+4).toString(16);
    if(lc.length==1){
        lc="0"+lc;
    }
    var data = fileData;
    var le = "";
    return cla + ins + p1 + p2 + lc + data + le;
}