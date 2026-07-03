'use strict'

let ws

async function openWs(url, timeMs) {
  if (typeof (ws) !== 'undefined') {
    return false
  }

  try {
    ws = new WebSocket(url)
  } catch (error) {
    return false
  }

  let onopen = new Promise((resolve) => {
    ws.onopen = function (evt) {
      return resolve(true)
    }
  })

  let onclose = new Promise((resolve) => {
    ws.onclose = function (evt) {
      return resolve(false)
    }
  })

  let onmessage = new Promise((resolve) => {
    ws.onmessage = function (evt) {
      return resolve(false)
    }
  })

  let onerror = new Promise((resolve) => {
    ws.onerror = function (evt) {
      return resolve(false)
    }
  })

  let timeout = new Promise((resolve) => {
    setTimeout(function () {
      return resolve(false)
    }, timeMs)
  })

  await Promise.race([onopen, onclose, onmessage, onerror, timeout])

  ws.onopen = undefined
  ws.onclose = undefined
  ws.onmessage = undefined
  ws.onerror = undefined

  if (ws.readyState !== WebSocket.OPEN) {
    ws.close()
    ws = undefined
    return false
  }

  return true
}

async function closeWs() {
  if (typeof (ws) === 'undefined') {
    return
  }

  ws.close()
  ws = undefined
}

async function ReadMessage(timeMs) {
  if (typeof (ws) === 'undefined') {
    return
  }

  let onopen = new Promise((resolve) => {
    ws.onopen = function (evt) {
      return resolve(undefined)
    }
  })

  let onclose = new Promise((resolve) => {
    ws.onclose = function (evt) {
      return resolve(undefined)
    }
  })

  let onmessage = new Promise((resolve) => {
    ws.onmessage = function (evt) {
      return resolve(evt.data)
    }
  })

  let onerror = new Promise((resolve) => {
    ws.onerror = function (evt) {
      return resolve(undefined)
    }
  })

  let timeout = new Promise((resolve) => {
    setTimeout(function () {
      return resolve(undefined)
    }, timeMs)
  })

  let result = await Promise.race([onopen, onclose, onmessage, onerror, timeout])

  ws.onopen = undefined
  ws.onclose = undefined
  ws.onmessage = undefined
  ws.onerror = undefined

  return result
}

async function WriteMessage(msg) {
  if (typeof (ws) === 'undefined') {
    return false
  }

  try {
    ws.send(msg)
  } catch (error) {
    return false
  }

  return true
}

async function callDcrf32(data, timeMs) {
  let result

  result = await WriteMessage(data)
  if (!result) {
    return
  }

  return await ReadMessage(timeMs)
}

async function LibMain(flag, context) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"LibMain","in":["' + flag.toString() + '","' + context + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = obj.out[0]

  return result
}

async function dc_config_port_name(port, name) {
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_config_port_name","in":["' + port.toString() + '","' + name + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }
}

async function dc_init(port, baud) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_init","in":["' + port.toString() + '","' + baud.toString() + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)

  return result
}

async function dc_init_name(port, baud, name) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_init_name","in":["' + port.toString() + '","' + baud.toString() + '","' + name + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)

  return result
}

async function dc_exit(icdev) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_exit","in":["' + icdev.toString() + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)

  return result
}

async function dc_beep(icdev, _Msec) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_beep","in":["' + icdev.toString() + '","' + _Msec.toString() + '"]}'
  outStr = await callDcrf32(inStr, _Msec * 10 + 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)

  return result
}

async function dc_getver(icdev) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_getver","in":["' + icdev.toString() + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)
  if (result[0] === 0) {
    result[1] = obj.out[0]
  }

  return result
}

async function dc_ctlled(icdev, cLed, cOpenFlag) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_ctlled","in":["' + icdev.toString() + '","' + cLed.toString() + '","' + cOpenFlag.toString() + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)

  return result
}

async function dc_srd_eeprom(icdev, offset, length) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_srd_eeprom","in":["' + icdev.toString() + '","' + offset.toString() + '","' + length.toString() + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)
  if (result[0] === 0) {
    result[1] = obj.out[0]
  }

  return result
}

async function dc_swr_eeprom(icdev, offset, length, send_buffer) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_swr_eeprom","in":["' + icdev.toString() + '","' + offset.toString() + '","' + length.toString() + '","' + send_buffer + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)

  return result
}

async function dc_read_4442(icdev, offset, length) {
  let result = new Array()
  let inStr, outStr
  let obj
  inStr = '{"func":"dc_read_4442","in":["' + icdev.toString() + '","' + offset.toString() + '","' + length.toString() + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)

  return result
}

async function dc_load_key(icdev, _Mode, _SecNr, _NKey) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_load_key","in":["' + icdev.toString() + '","' + _Mode.toString() + '","' + _SecNr.toString() + '","' + _NKey + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)

  return result
}

async function dc_startreadmag(icdev) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_startreadmag","in":["' + icdev.toString() + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)

  return result
}

async function dc_stopreadmag(icdev) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_stopreadmag","in":["' + icdev.toString() + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)

  return result
}

async function dc_readmag(icdev) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_readmag","in":["' + icdev.toString() + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)
  if (result[0] === 0) {
    result[1] = obj.out[0]
    result[2] = parseInt(obj.out[1])
    result[3] = obj.out[2]
    result[4] = parseInt(obj.out[3])
    result[5] = obj.out[4]
    result[6] = parseInt(obj.out[5])
  }

  return result
}

async function dc_setcpu(icdev, _Byte) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_setcpu","in":["' + icdev.toString() + '","' + _Byte.toString() + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }
  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)

  return result
}

async function  dc_CheckCard(icdev) {
  let result = new Array()
  let inStr, outStr
  let obj
  inStr = '{"func":"dc_CheckCard","in":["' + icdev.toString() + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }
  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)

  return result
}

async function dc_cpureset(icdev) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_cpureset","in":["' + icdev.toString() + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)
  if (result[0] === 0) {
    result[1] = parseInt(obj.out[0])
    result[2] = obj.out[1]
  }

  return result
}

async function dc_cpuapduInt(icdev, slen, sendbuffer) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_cpuapduInt","in":["' + icdev.toString() + '","' + slen.toString() + '","' + sendbuffer + '"]}'
  outStr = await callDcrf32(inStr, 100000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)
  if (result[0] === 0) {
    result[1] = parseInt(obj.out[0])
    result[2] = obj.out[1]
  }

  return result
}

async function dc_reset(icdev, _Msec) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_reset","in":["' + icdev.toString() + '","' + _Msec.toString() + '"]}'
  outStr = await callDcrf32(inStr, _Msec * 10 + 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)

  return result
}

async function dc_config_card(icdev, cardtype) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_config_card","in":["' + icdev.toString() + '","' + cardtype.toString() + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)

  return result
}

async function dc_card_n(icdev, _Mode) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_card_n","in":["' + icdev.toString() + '","' + _Mode.toString() + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)
  if (result[0] === 0) {
    result[1] = parseInt(obj.out[0])
    result[2] = obj.out[1]
  }

  return result
}

async function dc_pro_resetInt(icdev) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_pro_resetInt","in":["' + icdev.toString() + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)
  if (result[0] === 0) {
    result[1] = parseInt(obj.out[0])
    result[2] = obj.out[1]
  }

  return result
}

async function dc_pro_commandlinkInt(icdev, slen, sendbuffer, timeout) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_pro_commandlinkInt","in":["' + icdev.toString() + '","' + slen.toString() + '","' + sendbuffer + '","' + timeout.toString() + '"]}'
  outStr = await callDcrf32(inStr, timeout * 250 + 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)
  if (result[0] === 0) {
    result[1] = parseInt(obj.out[0])
    result[2] = obj.out[1]
  }

  return result
}

async function dc_card_b(icdev) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_card_b","in":["' + icdev.toString() + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)
  if (result[0] === 0) {
    result[1] = obj.out[0]
  }

  return result
}

async function dc_authentication_pass(icdev, _Mode, _Addr, passbuff) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_authentication_pass","in":["' + icdev.toString() + '","' + _Mode.toString() + '","' + _Addr.toString() + '","' + passbuff + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)

  return result
}

async function dc_read(icdev, _Adr) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_read","in":["' + icdev.toString() + '","' + _Adr.toString() + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)
  if (result[0] === 0) {
    result[1] = obj.out[0]
  }

  return result
}

async function dc_write(icdev, _Adr, _Data) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_write","in":["' + icdev.toString() + '","' + _Adr.toString() + '","' + _Data + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)

  return result
}

async function dc_initval(icdev, _Adr, _Value) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_initval","in":["' + icdev.toString() + '","' + _Adr.toString() + '","' + _Value.toString() + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)

  return result
}

async function dc_increment(icdev, _Adr, _Value) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_increment","in":["' + icdev.toString() + '","' + _Adr.toString() + '","' + _Value.toString() + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)

  return result
}

async function dc_decrement(icdev, _Adr, _Value) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_decrement","in":["' + icdev.toString() + '","' + _Adr.toString() + '","' + _Value.toString() + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)

  return result
}

async function dc_readval(icdev, _Adr) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_readval","in":["' + icdev.toString() + '","' + _Adr.toString() + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)
  if (result[0] === 0) {
    result[1] = parseInt(obj.out[0])
  }

  return result
}

async function dc_write_24c(icdev, offset, length, snd_buffer) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_write_24c","in":["' + icdev.toString() + '","' + offset.toString() + '","' + length.toString() + '","' + snd_buffer + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)

  return result
}

async function dc_read_24c(icdev, offset, length) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_read_24c","in":["' + icdev.toString() + '","' + offset.toString() + '","' + length.toString() + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)
  if (result[0] === 0) {
    result[1] = obj.out[0]
  }

  return result
}

async function dc_write_24c64(icdev, offset, length, snd_buffer) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_write_24c64","in":["' + icdev.toString() + '","' + offset.toString() + '","' + length.toString() + '","' + snd_buffer + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)

  return result
}

async function dc_read_24c64(icdev, offset, length) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_read_24c64","in":["' + icdev.toString() + '","' + offset.toString() + '","' + length.toString() + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)
  if (result[0] === 0) {
    result[1] = obj.out[0]
  }

  return result
}

async function dc_verifypin_4442(icdev, passwd) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_verifypin_4442","in":["' + icdev.toString() + '","' + passwd + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)

  return result
}

async function dc_read_4442(icdev, offset, length) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_read_4442","in":["' + icdev.toString() + '","' + offset.toString() + '","' + length.toString() + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)
  if (result[0] === 0) {
    result[1] = obj.out[0]
  }

  return result
}

async function dc_write_4442(icdev, offset, length, data_buffer) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_write_4442","in":["' + icdev.toString() + '","' + offset.toString() + '","' + length.toString() + '","' + data_buffer + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)

  return result
}

async function dc_readprotect_4442(icdev, offset, length) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_readprotect_4442","in":["' + icdev.toString() + '","' + offset.toString() + '","' + length.toString() + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)
  if (result[0] === 0) {
    result[1] = obj.out[0]
  }

  return result
}

async function dc_writeprotect_4442(icdev, offset, length, data_buffer) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_writeprotect_4442","in":["' + icdev.toString() + '","' + offset.toString() + '","' + length.toString() + '","' + data_buffer + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)

  return result
}

async function dc_verifypin_4428(icdev, passwd) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_verifypin_4428","in":["' + icdev.toString() + '","' + passwd + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)

  return result
}

async function dc_read_4428(icdev, offset, length) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_read_4428","in":["' + icdev.toString() + '","' + offset.toString() + '","' + length.toString() + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)
  if (result[0] === 0) {
    result[1] = obj.out[0]
  }

  return result
}

async function dc_write_4428(icdev, offset, length, data_buffer) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_write_4428","in":["' + icdev.toString() + '","' + offset.toString() + '","' + length.toString() + '","' + data_buffer + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)

  return result
}

async function dc_readprotect_4428(icdev, offset, length) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_readprotect_4428","in":["' + icdev.toString() + '","' + offset.toString() + '","' + length.toString() + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)
  if (result[0] === 0) {
    result[1] = obj.out[0]
  }

  return result
}

async function dc_writeprotect_4428(icdev, offset, length, data_buffer) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_writeprotect_4428","in":["' + icdev.toString() + '","' + offset.toString() + '","' + length.toString() + '","' + data_buffer + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)

  return result
}

async function dc_get_idsnr(icdev) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_get_idsnr","in":["' + icdev.toString() + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)
  if (result[0] === 0) {
    result[1] = obj.out[0]
  }

  return result
}

async function dc_SamAReadSerialNumber(icdev) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_SamAReadSerialNumber","in":["' + icdev.toString() + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)
  if (result[0] === 0) {
    result[1] = obj.out[0]
  }

  return result
}

async function dc_SamAReadCardInfo(icdev, type) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_SamAReadCardInfo","in":["' + icdev.toString() + '","' + type.toString() + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)
  if (result[0] === 0) {
    result[1] = parseInt(obj.out[0])
    result[2] = obj.out[1]
    result[3] = parseInt(obj.out[2])
    result[4] = obj.out[3]
    result[5] = parseInt(obj.out[4])
    result[6] = obj.out[5]
    result[7] = parseInt(obj.out[6])
    result[8] = obj.out[7]
  }

  return result
}

async function dc_ParseTextInfo(icdev, charset, info_len, info) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_ParseTextInfo","in":["' + icdev.toString() + '","' + charset.toString() + '","' + info_len.toString() + '","' + info + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)
  if (result[0] === 0) {
    result[1] = obj.out[0]
    result[2] = obj.out[1]
    result[3] = obj.out[2]
    result[4] = obj.out[3]
    result[5] = obj.out[4]
    result[6] = obj.out[5]
    result[7] = obj.out[6]
    result[8] = obj.out[7]
    result[9] = obj.out[8]
    result[10] = obj.out[9]
  }

  return result
}

async function dc_ParseTextInfoForForeigner(icdev, charset, info_len, info) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_ParseTextInfoForForeigner","in":["' + icdev.toString() + '","' + charset.toString() + '","' + info_len.toString() + '","' + info + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)
  if (result[0] === 0) {
    result[1] = obj.out[0]
    result[2] = obj.out[1]
    result[3] = obj.out[2]
    result[4] = obj.out[3]
    result[5] = obj.out[4]
    result[6] = obj.out[5]
    result[7] = obj.out[6]
    result[8] = obj.out[7]
    result[9] = obj.out[8]
    result[10] = obj.out[9]
    result[11] = obj.out[10]
    result[12] = obj.out[11]
  }

  return result
}

async function dc_ParseTextInfoForHkMoTw(icdev, charset, info_len, info) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_ParseTextInfoForHkMoTw","in":["' + icdev.toString() + '","' + charset.toString() + '","' + info_len.toString() + '","' + info + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)
  if (result[0] === 0) {
    result[1] = obj.out[0]
    result[2] = obj.out[1]
    result[3] = obj.out[2]
    result[4] = obj.out[3]
    result[5] = obj.out[4]
    result[6] = obj.out[5]
    result[7] = obj.out[6]
    result[8] = obj.out[7]
    result[9] = obj.out[8]
    result[10] = obj.out[9]
    result[11] = obj.out[10]
    result[12] = obj.out[11]
    result[13] = obj.out[12]
    result[14] = obj.out[13]
  }

  return result
}

async function dc_ParsePhotoInfo(icdev, type, info_len, info, photo_len, photo) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_ParsePhotoInfo","in":["' + icdev.toString() + '","' + type.toString() + '","' + info_len.toString() + '","' + info + '","' + photo_len.toString() + '","' + photo + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)
  if (result[0] === 0) {
    result[1] = parseInt(obj.out[0])
    result[2] = obj.out[1]
  }

  return result
}

async function dc_ParseOtherInfo(icdev, flag, in_info) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_ParseOtherInfo","in":["' + icdev.toString() + '","' + flag.toString() + '","' + in_info + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)
  if (result[0] === 0) {
    result[1] = obj.out[0]
  }

  return result
}

async function dc_KeypadOpen(icdev, number) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_KeypadOpen","in":["' + icdev.toString() + '","' + number.toString() + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)
  if (result[0] === 0) {
    result[1] = obj.out[0]
  }

  return result
}

async function dc_KeypadClose(icdev, number) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_KeypadClose","in":["' + icdev.toString() + '","' + number.toString() + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)

  return result
}

async function dc_KeypadLoadKey(icdev, number, set_index, sub_index, type, mode, key_data, key_len, flag, ex_data, ex_len) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_KeypadLoadKey","in":["' + icdev.toString() + '","' + number.toString() + '","' + set_index.toString() + '","' + sub_index.toString() + '","' + type.toString() + '","' + mode.toString() + '","' + key_data + '","' + key_len.toString() + '","' + flag.toString() + '","' + ex_data + '","' + ex_len.toString() + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)
  if (result[0] === 0) {
    result[1] = obj.out[0]
    result[2] = parseInt(obj.out[1])
  }

  return result
}

async function dc_KeypadClearKey(icdev, number, set_index, sub_index) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_KeypadClearKey","in":["' + icdev.toString() + '","' + number.toString() + '","' + set_index.toString() + '","' + sub_index.toString() + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)

  return result
}

async function dc_KeypadGetKeyType(icdev, number, set_index, sub_index) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_KeypadGetKeyType","in":["' + icdev.toString() + '","' + number.toString() + '","' + set_index.toString() + '","' + sub_index.toString() + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)
  if (result[0] === 0) {
    result[1] = parseInt(obj.out[0])
  }

  return result
}

async function dc_KeypadAlgorithm(icdev, number, set_index, sub_index, flag, mode, in_data, in_len) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_KeypadAlgorithm","in":["' + icdev.toString() + '","' + number.toString() + '","' + set_index.toString() + '","' + sub_index.toString() + '","' + flag.toString() + '","' + mode.toString() + '","' + in_data + '","' + in_len.toString() + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)
  if (result[0] === 0) {
    result[1] = obj.out[0]
    result[2] = parseInt(obj.out[1])
  }

  return result
}

async function dc_KeypadStartInput(icdev, number, mode, set_index, sub_index, in_data, in_len, min_len, max_len, auto_end, enable_beep, time_s) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_KeypadStartInput","in":["' + icdev.toString() + '","' + number.toString() + '","' + mode.toString() + '","' + set_index.toString() + '","' + sub_index.toString() + '","' + in_data + '","' + in_len.toString() + '","' + min_len.toString() + '","' + max_len.toString() + '","' + auto_end.toString() + '","' + enable_beep.toString() + '","' + time_s.toString() + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)
  if (result[0] === 0) {
    result[1] = obj.out[0]
    result[2] = parseInt(obj.out[1])
  }

  return result
}

async function dc_KeypadGetKeyValue(icdev, number) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_KeypadGetKeyValue","in":["' + icdev.toString() + '","' + number.toString() + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)
  if (result[0] === 0) {
    result[1] = parseInt(obj.out[0])
  }

  return result
}

async function dc_KeypadExitAndGetInput(icdev, number, mode) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_KeypadExitAndGetInput","in":["' + icdev.toString() + '","' + number.toString() + '","' + mode.toString() + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)
  if (result[0] === 0) {
    result[1] = obj.out[0]
    result[2] = parseInt(obj.out[1])
  }

  return result
}

async function dc_KeypadSetKeyValue(icdev, number, value) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_KeypadSetKeyValue","in":["' + icdev.toString() + '","' + number.toString() + '","' + value.toString() + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)

  return result
}

async function dc_GetSocialSecurityCardBaseInfo(icdev, type) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_GetSocialSecurityCardBaseInfo","in":["' + icdev.toString() + '","' + type.toString() + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)
  if (result[0] === 0) {
    result[1] = obj.out[0]
    result[2] = obj.out[1]
    result[3] = obj.out[2]
    result[4] = obj.out[3]
    result[5] = obj.out[4]
    result[6] = obj.out[5]
    result[7] = obj.out[6]
    result[8] = obj.out[7]
    result[9] = obj.out[8]
    result[10] = obj.out[9]
    result[11] = obj.out[10]
    result[12] = obj.out[11]
    result[13] = obj.out[12]
    result[14] = obj.out[13]
  }

  return result
}

async function dc_GetBankAccountNumber(icdev, type) {
  let result = new Array()
  let inStr, outStr
  let obj

  inStr = '{"func":"dc_GetBankAccountNumber","in":["' + icdev.toString() + '","' + type.toString() + '"]}'
  outStr = await callDcrf32(inStr, 10000)
  if (typeof (outStr) === 'undefined') {
    return
  }

  try {
    obj = JSON.parse(outStr)
  } catch (error) {
    return
  }

  result[0] = parseInt(obj.result)
  if (result[0] === 0) {
    result[1] = obj.out[0]
  }

  return result
}
